// AI 기반 영수증 파싱 (Google Gemini)

import type { Category, Unit } from '@/types/supabase';

export interface AIParsedItem {
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  confidence: number;
  estimatedExpiryDays?: number;
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

const VALID_CATEGORIES: Category[] = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'condiments', 'grains', 'beverages', 'snacks', 'etc'];
const VALID_UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'];

// 카테고리별 기본 유통기한 (일)
const DEFAULT_EXPIRY_DAYS: Record<Category, number> = {
  vegetables: 7,
  fruits: 7,
  meat: 3,
  seafood: 2,
  dairy: 7,
  condiments: 180,
  grains: 90,
  beverages: 30,
  snacks: 60,
  etc: 14,
};

export async function parseReceiptWithAI(rawText: string): Promise<AIParsedItem[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY not configured');
  }

  const prompt = `당신은 영수증 텍스트에서 식재료/식품만 추출하는 전문가입니다.

다음 영수증 텍스트에서 식재료와 식품 항목만 추출해주세요.
가격, 매장 정보, 결제 정보 등은 무시하세요.

영수증 텍스트:
"""
${rawText}
"""

각 항목에 대해 다음 JSON 배열 형식으로 응답해주세요:
[
  {
    "name": "식재료 이름 (한국어, 간결하게)",
    "quantity": 숫자,
    "unit": "g" | "kg" | "ml" | "L" | "ea" | "pack" | "bottle" | "box" | "bunch" 중 하나,
    "category": "vegetables" | "fruits" | "meat" | "seafood" | "dairy" | "condiments" | "grains" | "beverages" | "snacks" | "etc" 중 하나,
    "confidence": 0.0 ~ 1.0 사이의 신뢰도
  }
]

규칙:
1. 식재료/식품이 아닌 것(생활용품, 문구류 등)은 제외
2. 수량 정보가 없으면 quantity: 1, unit: "ea"로 설정
3. 브랜드명은 제거하고 실제 식재료명만 추출 (예: "풀무원 순두부" → "순두부")
4. 중복 항목은 합산
5. JSON 배열만 응답하고, 다른 텍스트는 포함하지 마세요

응답:`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return [];
  }

  // JSON 파싱
  const items = parseJsonResponse(text);

  // 유효성 검증 및 유통기한 추가
  return items.map(item => ({
    ...item,
    category: VALID_CATEGORIES.includes(item.category) ? item.category : 'etc',
    unit: VALID_UNITS.includes(item.unit) ? item.unit : 'ea',
    confidence: Math.max(0, Math.min(1, item.confidence || 0.7)),
    estimatedExpiryDays: DEFAULT_EXPIRY_DAYS[item.category] || 14,
  }));
}

function parseJsonResponse(text: string): AIParsedItem[] {
  try {
    // JSON 배열 추출 (마크다운 코드 블록 제거)
    let jsonStr = text.trim();

    // ```json ... ``` 형태 처리
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // 배열 시작점 찾기
    const arrayStart = jsonStr.indexOf('[');
    const arrayEnd = jsonStr.lastIndexOf(']');

    if (arrayStart !== -1 && arrayEnd !== -1) {
      jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(item =>
      item &&
      typeof item.name === 'string' &&
      item.name.length > 0
    ).map(item => ({
      name: item.name,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      unit: item.unit || 'ea',
      category: item.category || 'etc',
      confidence: item.confidence || 0.7,
    }));
  } catch (error) {
    console.error('JSON parsing error:', error, 'Text:', text);
    return [];
  }
}

// 이미지 분석 결과 타입
export interface ImageAnalysisResult {
  items: AIParsedItem[];
  rawText: string;
  isValid: boolean;
  invalidReason?: 'not_receipt' | 'no_food_items' | 'unreadable';
}

// 이미지를 직접 분석하는 함수 (Vision + Gemini 결합)
export async function analyzeReceiptImage(imageBase64: string): Promise<ImageAnalysisResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY not configured');
  }

  const prompt = `이 이미지를 분석해주세요.

**먼저 이미지가 다음 중 하나인지 판단하세요:**
1. 영수증 (마트, 편의점, 식당 등의 구매 영수증)
2. 식재료/식품 사진 (냉장고 내부, 장본 식재료 등)

**이미지가 영수증이나 식재료 사진이 아닌 경우** (예: 풍경, 사람, 동물, 문서 등):
{
  "isValid": false,
  "invalidReason": "not_receipt",
  "rawText": "",
  "items": []
}

**이미지가 너무 흐리거나 인식이 불가능한 경우:**
{
  "isValid": false,
  "invalidReason": "unreadable",
  "rawText": "",
  "items": []
}

**영수증이나 식재료 사진이지만 식품 항목이 없는 경우:**
{
  "isValid": false,
  "invalidReason": "no_food_items",
  "rawText": "인식된 텍스트",
  "items": []
}

**영수증이나 식재료 사진이고 식품 항목이 있는 경우:**
{
  "isValid": true,
  "rawText": "인식된 전체 텍스트",
  "items": [
    {
      "name": "식재료명 (한국어)",
      "quantity": 숫자,
      "unit": "g" | "kg" | "ml" | "L" | "ea" | "pack" | "bottle" | "box" | "bunch",
      "category": "vegetables" | "fruits" | "meat" | "seafood" | "dairy" | "condiments" | "grains" | "beverages" | "snacks" | "etc",
      "confidence": 0.0 ~ 1.0
    }
  ]
}

규칙:
1. 식재료/식품만 추출 (생활용품, 화장품, 문구류 등 제외)
2. 브랜드명 제거, 실제 식재료명만 (예: "풀무원 순두부" → "순두부")
3. 수량 정보가 없으면 quantity: 1, unit: "ea"
4. JSON만 응답, 다른 텍스트 없이`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini Vision API error:', errorText);
    throw new Error(`Gemini Vision API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return { items: [], rawText: '', isValid: false, invalidReason: 'unreadable' };
  }

  try {
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // JSON 객체 시작점 찾기
    const objStart = jsonStr.indexOf('{');
    const objEnd = jsonStr.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1) {
      jsonStr = jsonStr.slice(objStart, objEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // 유효하지 않은 이미지인 경우
    if (parsed.isValid === false) {
      return {
        items: [],
        rawText: parsed.rawText || '',
        isValid: false,
        invalidReason: parsed.invalidReason || 'not_receipt',
      };
    }

    const items = (parsed.items || []).map((item: AIParsedItem) => ({
      ...item,
      category: VALID_CATEGORIES.includes(item.category) ? item.category : 'etc',
      unit: VALID_UNITS.includes(item.unit) ? item.unit : 'ea',
      confidence: Math.max(0, Math.min(1, item.confidence || 0.7)),
      estimatedExpiryDays: DEFAULT_EXPIRY_DAYS[item.category] || 14,
    }));

    return {
      items,
      rawText: parsed.rawText || '',
      isValid: true,
    };
  } catch (error) {
    console.error('JSON parsing error:', error);
    return { items: [], rawText: text, isValid: false, invalidReason: 'unreadable' };
  }
}
