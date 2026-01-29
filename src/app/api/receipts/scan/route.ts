import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromImage } from '@/lib/ocr/vision';
import { parseReceiptText, isReceiptText } from '@/lib/ocr/parser';
import { parseReceiptWithAI, analyzeReceiptImage } from '@/lib/ocr/ai-parser';

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
  mode: 'ai' | 'ocr' | 'ai-vision' | 'simulation';
  scanId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const useAIVision = formData.get('useAIVision') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 파일을 Base64로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    let result: ScanResult;

    // AI Vision 모드: Gemini가 이미지를 직접 분석
    if (useAIVision && process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        const { items, rawText } = await analyzeReceiptImage(base64Image);

        if (items.length === 0) {
          return NextResponse.json(
            { error: '영수증에서 식재료를 찾을 수 없습니다. 영수증 사진을 다시 촬영해주세요.' },
            { status: 400 }
          );
        }

        result = {
          items,
          rawText,
          mode: 'ai-vision',
        };
      } catch (error) {
        console.error('AI Vision error:', error);
        // AI Vision 실패 시 기존 OCR로 폴백
        result = await processWithOCR(base64Image);
      }
    } else {
      // 기존 OCR + AI 파싱 또는 규칙 기반 파싱
      result = await processWithOCR(base64Image);
    }

    // 로그인 사용자의 경우 스캔 기록 저장
    if (user) {
      const { data: scanRecord } = await supabase
        .from('receipt_scans')
        .insert({
          user_id: user.id,
          raw_text: result.rawText,
          parsed_items: result.items,
          status: 'completed',
        })
        .select('id')
        .single();

      if (scanRecord) {
        result.scanId = scanRecord.id;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('OCR Error:', errorMessage);

    return NextResponse.json({
      items: getSimulatedItems(),
      rawText: `[OCR Error: ${errorMessage}]`,
      mode: 'simulation' as const,
      error: errorMessage,
    });
  }
}

async function processWithOCR(base64Image: string): Promise<ScanResult> {
  // Google Cloud Vision 설정 확인
  if (!process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    console.log('OCR credentials not configured, using simulation mode');
    return {
      items: getSimulatedItems(),
      rawText: '[Simulation Mode - Configure GOOGLE_CLOUD_CREDENTIALS_JSON for real OCR]',
      mode: 'simulation',
    };
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
    } catch (error) {
      console.error('AI parsing failed, falling back to rule-based:', error);
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

function getSimulatedItems() {
  const possibleItems = [
    { name: '양파', quantity: 1, unit: 'kg', category: 'vegetables', confidence: 0.9, estimatedExpiryDays: 14 },
    { name: '당근', quantity: 500, unit: 'g', category: 'vegetables', confidence: 0.85, estimatedExpiryDays: 14 },
    { name: '감자', quantity: 1, unit: 'kg', category: 'vegetables', confidence: 0.9, estimatedExpiryDays: 21 },
    { name: '계란', quantity: 30, unit: 'ea', category: 'dairy', confidence: 0.95, estimatedExpiryDays: 21 },
    { name: '우유', quantity: 1, unit: 'L', category: 'dairy', confidence: 0.9, estimatedExpiryDays: 7 },
    { name: '삼겹살', quantity: 500, unit: 'g', category: 'meat', confidence: 0.85, estimatedExpiryDays: 3 },
    { name: '닭가슴살', quantity: 400, unit: 'g', category: 'meat', confidence: 0.8, estimatedExpiryDays: 3 },
    { name: '고등어', quantity: 2, unit: 'ea', category: 'seafood', confidence: 0.75, estimatedExpiryDays: 2 },
    { name: '두부', quantity: 1, unit: 'pack', category: 'dairy', confidence: 0.85, estimatedExpiryDays: 7 },
    { name: '간장', quantity: 500, unit: 'ml', category: 'condiments', confidence: 0.9, estimatedExpiryDays: 365 },
    { name: '쌀', quantity: 5, unit: 'kg', category: 'grains', confidence: 0.95, estimatedExpiryDays: 180 },
    { name: '사과', quantity: 4, unit: 'ea', category: 'fruits', confidence: 0.85, estimatedExpiryDays: 14 },
    { name: '바나나', quantity: 1, unit: 'bunch', category: 'fruits', confidence: 0.8, estimatedExpiryDays: 5 },
  ];

  // 랜덤하게 3-6개 선택
  const count = Math.floor(Math.random() * 4) + 3;
  const shuffled = possibleItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 스캔 히스토리 조회 API
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: scans, error } = await supabase
      .from('receipt_scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({ scans });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    return NextResponse.json({ error: 'Failed to fetch scan history' }, { status: 500 });
  }
}
