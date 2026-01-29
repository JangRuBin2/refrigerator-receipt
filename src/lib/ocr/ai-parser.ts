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

// 이미지를 직접 분석하는 함수 (Vision + Gemini 결합)
export async function analyzeReceiptImage(imageBase64: string): Promise<{
  items: AIParsedItem[];
  rawText: string;
}> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY not configured');
  }

  const prompt = `이 영수증 이미지를 분석하여 식재료/식품 항목만 추출해주세요.

각 항목에 대해 다음 JSON 형식으로 응답해주세요:
{
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
1. 식재료/식품만 추출 (생활용품 제외)
2. 브랜드명 제거, 실제 식재료명만
3. JSON만 응답`;

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
    return { items: [], rawText: '' };
  }

  try {
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

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
    };
  } catch (error) {
    console.error('JSON parsing error:', error);
    return { items: [], rawText: text };
  }
}
