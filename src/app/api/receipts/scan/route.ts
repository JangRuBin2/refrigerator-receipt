import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromImage } from '@/lib/ocr/vision';
import { parseReceiptText, isReceiptText } from '@/lib/ocr/parser';
import { parseReceiptWithAI, analyzeReceiptImage } from '@/lib/ocr/ai-parser';

// Profile 타입 (Supabase 타입 추론 문제 해결용)
interface ProfileRow {
  is_premium: boolean | null;
  subscription_end_date: string | null;
}

interface ScanRecord {
  id: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DAILY_LIMIT_FREE = 5; // 무료 사용자 일일 제한
const DAILY_LIMIT_PREMIUM = 50; // 프리미엄 사용자 일일 제한

interface ScanResult {
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    confidence: number;
    estimatedExpiryDays?: number;
  }>;
  rawText: string;
  mode: 'ai' | 'ocr' | 'ai-vision';
  scanId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 로그인 필수
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 프리미엄 상태 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, subscription_end_date')
      .eq('id', user.id)
      .single() as { data: ProfileRow | null };

    const isPremium = profile?.is_premium &&
      (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date());
    const dailyLimit = isPremium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;

    // 오늘 업로드 횟수 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count: todayCount } = await supabase
      .from('receipt_scans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayISO);

    const currentCount = todayCount || 0;

    if (currentCount >= dailyLimit) {
      return NextResponse.json(
        {
          error: `일일 업로드 제한(${dailyLimit}회)에 도달했습니다. ${isPremium ? '내일 다시 시도해주세요.' : '프리미엄으로 업그레이드하면 더 많이 스캔할 수 있습니다.'}`,
          limitReached: true,
          dailyLimit,
          currentCount,
          isPremium,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const useAIVision = formData.get('useAIVision') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 파일 용량 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '이미지 용량이 너무 큽니다. 10MB 이하의 이미지를 업로드해주세요.' },
        { status: 400 }
      );
    }

    // 파일을 Base64로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    let result: ScanResult;

    // AI Vision 모드: Gemini가 이미지를 직접 분석
    if (useAIVision && process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        const analysisResult = await analyzeReceiptImage(base64Image);

        // 이미지 유효성 검증
        if (!analysisResult.isValid) {
          const errorMessages: Record<string, string> = {
            not_receipt: '영수증이나 식재료 사진이 아닙니다. 영수증 또는 구매한 식재료 사진을 업로드해주세요.',
            no_food_items: '이미지에서 식재료를 찾을 수 없습니다. 식품이 포함된 영수증인지 확인해주세요.',
            unreadable: '이미지를 인식할 수 없습니다. 더 선명한 사진을 촬영해주세요.',
          };
          return NextResponse.json(
            { error: errorMessages[analysisResult.invalidReason || 'not_receipt'] },
            { status: 400 }
          );
        }

        if (analysisResult.items.length === 0) {
          return NextResponse.json(
            { error: '영수증에서 식재료를 찾을 수 없습니다. 영수증 사진을 다시 촬영해주세요.' },
            { status: 400 }
          );
        }

        result = {
          items: analysisResult.items,
          rawText: analysisResult.rawText,
          mode: 'ai-vision',
        };
      } catch {
        // AI Vision 실패 시 기존 OCR로 폴백
        result = await processWithOCR(base64Image);
      }
    } else if (!useAIVision && process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
      // OCR 모드
      result = await processWithOCR(base64Image);
    } else {
      // API 키 미설정
      return NextResponse.json(
        { error: 'OCR 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.' },
        { status: 503 }
      );
    }

    // 스캔 기록 저장
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scanRecord } = await (supabase
      .from('receipt_scans') as any)
      .insert({
        user_id: user.id,
        raw_text: result.rawText,
        parsed_items: result.items,
        status: 'completed',
      })
      .select('id')
      .single() as { data: ScanRecord | null };

    if (scanRecord) {
      result.scanId = scanRecord.id;
    }

    // 남은 횟수 정보 포함하여 응답
    return NextResponse.json({
      ...result,
      usage: {
        dailyLimit,
        used: currentCount + 1,
        remaining: dailyLimit - currentCount - 1,
        isPremium,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: errorMessage || '스캔 중 오류가 발생했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

async function processWithOCR(base64Image: string): Promise<ScanResult> {
  // Google Cloud Vision 설정 확인
  if (!process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    throw new Error('OCR 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.');
  }

  // OCR 실행
  const rawText = await extractTextFromImage(base64Image);

  // 영수증 형태인지 검증
  if (!isReceiptText(rawText)) {
    throw new Error('영수증 형태의 이미지가 아닙니다. 영수증 사진을 다시 촬영해주세요.');
  }

  // Gemini AI 파싱 시도
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    try {
      const items = await parseReceiptWithAI(rawText);

      if (items.length > 0) {
        return {
          items,
          rawText,
          mode: 'ai',
        };
      }
    } catch {
      // AI parsing failed, falling back to rule-based
    }
  }

  // 규칙 기반 파싱 (폴백)
  const items = parseReceiptText(rawText);

  return {
    items,
    rawText,
    mode: 'ocr',
  };
}

// 스캔 히스토리 및 사용량 조회 API
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 프리미엄 상태 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, subscription_end_date')
      .eq('id', user.id)
      .single() as { data: ProfileRow | null };

    const isPremium = profile?.is_premium &&
      (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date());
    const dailyLimit = isPremium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;

    // 오늘 업로드 횟수 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count: todayCount } = await supabase
      .from('receipt_scans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayISO);

    const used = todayCount || 0;

    // 스캔 기록
    const { data: scans, error } = await supabase
      .from('receipt_scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      scans,
      usage: {
        dailyLimit,
        used,
        remaining: Math.max(0, dailyLimit - used),
        isPremium,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scan history' }, { status: 500 });
  }
}
