// 영수증 텍스트 파싱 및 재료 추출

export interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  confidence: number;
}

// 카테고리 키워드 매핑
const categoryKeywords: Record<string, string[]> = {
  vegetables: [
    '양파', '당근', '감자', '고구마', '배추', '무', '시금치', '상추', '깻잎',
    '파', '대파', '쪽파', '마늘', '생강', '고추', '피망', '파프리카', '호박',
    '애호박', '오이', '가지', '브로콜리', '콩나물', '숙주', '버섯', '양배추',
    '셀러리', '아스파라거스', '토마토', '방울토마토'
  ],
  fruits: [
    '사과', '배', '귤', '오렌지', '바나나', '포도', '딸기', '수박', '참외',
    '멜론', '복숭아', '자두', '살구', '키위', '망고', '파인애플', '레몬',
    '라임', '자몽', '블루베리', '체리', '감', '석류', '무화과'
  ],
  meat: [
    '소고기', '돼지고기', '닭고기', '오리고기', '양고기', '삼겹살', '목살',
    '안심', '등심', '갈비', '불고기', '닭가슴살', '닭다리', '베이컨', '햄',
    '소시지', '스팸', '육류', '쇠고기'
  ],
  seafood: [
    '고등어', '삼치', '갈치', '조기', '꽁치', '연어', '참치', '오징어',
    '새우', '게', '랍스터', '조개', '홍합', '굴', '전복', '해산물', '생선',
    '멸치', '미역', '다시마', '김', '어묵'
  ],
  dairy: [
    '우유', '치즈', '버터', '요거트', '요구르트', '크림', '생크림', '계란',
    '달걀', '두부', '순두부', '유제품'
  ],
  condiments: [
    '소금', '설탕', '간장', '된장', '고추장', '쌈장', '식초', '참기름',
    '들기름', '올리브유', '식용유', '케첩', '마요네즈', '머스타드', '후추',
    '고춧가루', '카레', '양념'
  ],
  grains: [
    '쌀', '찹쌀', '현미', '보리', '밀가루', '빵', '라면', '국수', '파스타',
    '스파게티', '우동', '떡', '시리얼', '오트밀'
  ],
  beverages: [
    '물', '생수', '탄산수', '콜라', '사이다', '주스', '커피', '녹차', '홍차',
    '보리차', '음료', '맥주', '소주', '와인'
  ],
  snacks: [
    '과자', '초콜릿', '사탕', '젤리', '아이스크림', '케이크', '쿠키', '칩',
    '견과류', '아몬드', '호두', '땅콩'
  ],
};

// 단위 패턴
const unitPatterns = [
  { pattern: /(\d+(?:\.\d+)?)\s*kg/i, unit: 'kg', multiplier: 1 },
  { pattern: /(\d+(?:\.\d+)?)\s*g(?:ram)?/i, unit: 'g', multiplier: 1 },
  { pattern: /(\d+(?:\.\d+)?)\s*L(?:iter)?/i, unit: 'L', multiplier: 1 },
  { pattern: /(\d+(?:\.\d+)?)\s*ml/i, unit: 'ml', multiplier: 1 },
  { pattern: /(\d+)\s*개/i, unit: 'ea', multiplier: 1 },
  { pattern: /(\d+)\s*팩/i, unit: 'pack', multiplier: 1 },
  { pattern: /(\d+)\s*병/i, unit: 'bottle', multiplier: 1 },
  { pattern: /(\d+)\s*박스/i, unit: 'box', multiplier: 1 },
  { pattern: /(\d+)\s*단/i, unit: 'bunch', multiplier: 1 },
  { pattern: /(\d+)\s*봉/i, unit: 'pack', multiplier: 1 },
  { pattern: /(\d+)\s*EA/i, unit: 'ea', multiplier: 1 },
];

// 제외할 키워드 (가격, 할인 등)
const excludePatterns = [
  /합계/i, /소계/i, /부가세/i, /과세/i, /면세/i, /할인/i, /쿠폰/i,
  /포인트/i, /적립/i, /카드/i, /현금/i, /결제/i, /거래/i, /영수증/i,
  /점포/i, /매장/i, /전화/i, /주소/i, /사업자/i, /대표/i, /담당/i,
  /이마트/i, /홈플러스/i, /롯데마트/i, /하나로마트/i, /GS25/i, /CU/i,
  /세븐일레븐/i, /미니스톱/i, /\d{4}[-/.]\d{2}[-/.]\d{2}/, // 날짜
  /\d{2}:\d{2}/, // 시간
  /\d{3}-\d{4}-\d{4}/, // 전화번호
  /총\s*\d+/, /\*{3,}/, /={3,}/, /-{3,}/,
];

export function parseReceiptText(text: string): ParsedItem[] {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const items: ParsedItem[] = [];
  const seenNames = new Set<string>();

  for (const line of lines) {
    // 제외 패턴 확인
    if (excludePatterns.some(pattern => pattern.test(line))) {
      continue;
    }

    // 가격 패턴이 있는 라인에서 상품명 추출
    const priceMatch = line.match(/(.+?)\s+[\d,]+원?$/);
    const productName = priceMatch ? priceMatch[1].trim() : line;

    // 너무 짧거나 숫자만 있는 경우 제외
    if (productName.length < 2 || /^\d+$/.test(productName)) {
      continue;
    }

    // 카테고리 매칭
    const category = findCategory(productName);
    if (!category) {
      continue; // 음식 관련 키워드가 없으면 제외
    }

    // 중복 확인
    const normalizedName = normalizeName(productName);
    if (seenNames.has(normalizedName)) {
      continue;
    }
    seenNames.add(normalizedName);

    // 수량 및 단위 추출
    const { quantity, unit } = extractQuantityAndUnit(productName);

    items.push({
      name: cleanProductName(productName),
      quantity,
      unit,
      category,
      confidence: calculateConfidence(productName, category),
    });
  }

  return items;
}

function findCategory(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return null;
}

function extractQuantityAndUnit(text: string): { quantity: number; unit: string } {
  for (const { pattern, unit, multiplier } of unitPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        quantity: parseFloat(match[1]) * multiplier,
        unit,
      };
    }
  }

  // 기본값
  return { quantity: 1, unit: 'ea' };
}

function cleanProductName(name: string): string {
  // 수량/단위 정보 제거
  let cleaned = name;
  for (const { pattern } of unitPatterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }

  // 가격 정보 제거
  cleaned = cleaned.replace(/[\d,]+원?$/, '').trim();

  // 특수문자 제거
  cleaned = cleaned.replace(/[*#@!]/g, '').trim();

  // 브랜드명 등 접두사 정리
  cleaned = cleaned.replace(/^\[.+?\]/, '').trim();
  cleaned = cleaned.replace(/^【.+?】/, '').trim();

  return cleaned;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '');
}

function calculateConfidence(text: string, category: string): number {
  let confidence = 0.5;

  // 카테고리 키워드가 정확히 매칭되면 신뢰도 증가
  const keywords = categoryKeywords[category] || [];
  for (const keyword of keywords) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      confidence += 0.3;
      break;
    }
  }

  // 단위 정보가 있으면 신뢰도 증가
  if (unitPatterns.some(({ pattern }) => pattern.test(text))) {
    confidence += 0.2;
  }

  return Math.min(confidence, 1.0);
}
