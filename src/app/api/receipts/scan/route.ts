import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage } from '@/lib/ocr/vision';
import { parseReceiptText } from '@/lib/ocr/parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 파일을 Base64로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Google Cloud Vision 설정 확인
    if (!process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
      // 환경 변수가 없으면 시뮬레이션 모드
      console.log('OCR credentials not configured, using simulation mode');
      return NextResponse.json({
        items: getSimulatedItems(),
        rawText: '[Simulation Mode - Configure GOOGLE_CLOUD_CREDENTIALS_JSON for real OCR]',
        mode: 'simulation',
      });
    }

    // OCR 실행
    const rawText = await extractTextFromImage(base64Image);

    // 텍스트 파싱
    const items = parseReceiptText(rawText);

    return NextResponse.json({
      items,
      rawText,
      mode: 'ocr',
    });
  } catch (error) {
    console.error('OCR Error:', error);

    // 에러 시 시뮬레이션 결과 반환
    return NextResponse.json({
      items: getSimulatedItems(),
      rawText: '[OCR Error - Using simulation data]',
      mode: 'simulation',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getSimulatedItems() {
  const possibleItems = [
    { name: '양파', quantity: 1, unit: 'kg', category: 'vegetables', confidence: 0.9 },
    { name: '당근', quantity: 500, unit: 'g', category: 'vegetables', confidence: 0.85 },
    { name: '감자', quantity: 1, unit: 'kg', category: 'vegetables', confidence: 0.9 },
    { name: '계란', quantity: 30, unit: 'ea', category: 'dairy', confidence: 0.95 },
    { name: '우유', quantity: 1, unit: 'L', category: 'dairy', confidence: 0.9 },
    { name: '삼겹살', quantity: 500, unit: 'g', category: 'meat', confidence: 0.85 },
    { name: '닭가슴살', quantity: 400, unit: 'g', category: 'meat', confidence: 0.8 },
    { name: '고등어', quantity: 2, unit: 'ea', category: 'seafood', confidence: 0.75 },
    { name: '두부', quantity: 1, unit: 'pack', category: 'dairy', confidence: 0.85 },
    { name: '간장', quantity: 500, unit: 'ml', category: 'condiments', confidence: 0.9 },
    { name: '쌀', quantity: 5, unit: 'kg', category: 'grains', confidence: 0.95 },
    { name: '사과', quantity: 4, unit: 'ea', category: 'fruits', confidence: 0.85 },
    { name: '바나나', quantity: 1, unit: 'bunch', category: 'fruits', confidence: 0.8 },
  ];

  // 랜덤하게 3-6개 선택
  const count = Math.floor(Math.random() * 4) + 3;
  const shuffled = possibleItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
