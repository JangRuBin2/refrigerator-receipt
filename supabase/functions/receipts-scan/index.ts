import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { callGemini, callGeminiWithImage, parseJsonFromText } from '../_shared/gemini.ts';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DAILY_LIMIT_FREE = 5;
const DAILY_LIMIT_PREMIUM = 50;
const AD_REWARD_SCANS = 1;

const VALID_CATEGORIES = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'condiments', 'grains', 'beverages', 'snacks', 'etc'];
const VALID_UNITS = ['g', 'kg', 'ml', 'L', 'ea', 'pack', 'bottle', 'box', 'bunch'];

const DEFAULT_EXPIRY_DAYS: Record<string, number> = {
  vegetables: 7, fruits: 7, meat: 3, seafood: 2, dairy: 7,
  condiments: 180, grains: 90, beverages: 30, snacks: 60, etc: 14,
};

// Receipt indicator patterns
const receiptIndicators = [
  /[\d,]+\s*원/,
  /합계|소계|총액|결제|거스름/i,
  /카드|현금|계좌/i,
  /\d{4}[-/.]\d{2}[-/.]\d{2}/,
  /\d{2}:\d{2}/,
  /이마트|홈플러스|롯데마트|하나로마트|GS25|CU|세븐일레븐|미니스톱|코스트코|트레이더스|노브랜드|다이소|편의점|마트|슈퍼/i,
  /사업자.*번호|대표자|점포|매장|TEL|전화/i,
  /영수증|거래명세/i,
  /부가세|과세|면세|부가가치세/i,
  /수량|단가|금액/i,
];

function isReceiptText(text: string): boolean {
  let matchCount = 0;
  for (const pattern of receiptIndicators) {
    if (pattern.test(text)) matchCount++;
  }
  return matchCount >= 2;
}

interface ProfileRow {
  is_premium: boolean | null;
  subscription_end_date: string | null;
}

// deno-lint-ignore no-explicit-any
async function getUsageInfo(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, subscription_end_date')
    .eq('id', userId)
    .single() as { data: ProfileRow | null };

  const isPremium = profile?.is_premium &&
    (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date());
  const dailyLimit = isPremium ? DAILY_LIMIT_PREMIUM : DAILY_LIMIT_FREE;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const { count: todayCount } = await supabase
    .from('event_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'receipt_scan')
    .gte('created_at', todayISO);

  const { count: adWatchCount } = await supabase
    .from('event_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'ad_watch_scan_reward')
    .gte('created_at', todayISO);

  const used = todayCount || 0;
  const bonusScans = (adWatchCount || 0) * AD_REWARD_SCANS;
  const effectiveLimit = dailyLimit + bonusScans;

  return { isPremium, dailyLimit, bonusScans, effectiveLimit, used, adWatchCount: adWatchCount || 0 };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET: usage and scan history
    if (req.method === 'GET') {
      const usage = await getUsageInfo(supabase, user.id);

      const { data: events } = await supabase
        .from('event_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_type', 'receipt_scan')
        .order('created_at', { ascending: false })
        .limit(20);

      // deno-lint-ignore no-explicit-any
      const scans = (events || []).map((e: any) => ({
        id: e.id,
        user_id: e.user_id,
        raw_text: e.metadata?.raw_text,
        parsed_items: e.metadata?.parsed_items,
        status: e.metadata?.status || 'completed',
        created_at: e.created_at,
      }));

      return new Response(
        JSON.stringify({
          scans,
          usage: {
            dailyLimit: usage.dailyLimit,
            bonusScans: usage.bonusScans,
            effectiveLimit: usage.effectiveLimit,
            used: usage.used,
            remaining: Math.max(0, usage.effectiveLimit - usage.used),
            isPremium: usage.isPremium,
            canWatchAd: !usage.isPremium && usage.adWatchCount < 3,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST: scan receipt
    const usage = await getUsageInfo(supabase, user.id);

    if (usage.used >= usage.effectiveLimit) {
      return new Response(
        JSON.stringify({
          error: `일일 업로드 제한(${usage.effectiveLimit}회)에 도달했습니다.`,
          limitReached: true,
          dailyLimit: usage.dailyLimit,
          bonusScans: usage.bonusScans,
          effectiveLimit: usage.effectiveLimit,
          currentCount: usage.used,
          isPremium: usage.isPremium,
          canWatchAd: !usage.isPremium && usage.adWatchCount < 3,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { image, useAIVision = true } = body as { image: string; useAIVision?: boolean };

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check base64 size (rough estimate)
    const estimatedSize = (image.length * 3) / 4;
    if (estimatedSize > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: '이미지 용량이 너무 큽니다. 10MB 이하의 이미지를 업로드해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const visionCredentials = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS_JSON');

    // deno-lint-ignore no-explicit-any
    let result: { items: any[]; rawText: string; mode: string; scanId?: string };

    if (useAIVision && geminiKey) {
      // AI Vision mode: Gemini analyzes image directly
      try {
        const analysisResult = await analyzeReceiptImage(image);

        if (!analysisResult.isValid) {
          const errorMessages: Record<string, string> = {
            not_receipt: '영수증이나 식재료 사진이 아닙니다.',
            no_food_items: '이미지에서 식재료를 찾을 수 없습니다.',
            unreadable: '이미지를 인식할 수 없습니다.',
          };
          return new Response(
            JSON.stringify({ error: errorMessages[analysisResult.invalidReason || 'not_receipt'] }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (analysisResult.items.length === 0) {
          return new Response(
            JSON.stringify({ error: '영수증에서 식재료를 찾을 수 없습니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = {
          items: analysisResult.items,
          rawText: analysisResult.rawText,
          mode: 'ai-vision',
        };
      } catch {
        // Fallback to OCR
        result = await processWithOCR(image, visionCredentials, geminiKey);
      }
    } else if (!useAIVision && visionCredentials) {
      result = await processWithOCR(image, visionCredentials, geminiKey);
    } else {
      return new Response(
        JSON.stringify({ error: 'OCR 서비스가 설정되지 않았습니다.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save event log
    const { data: eventRecord } = await supabase
      .from('event_logs')
      .insert({
        user_id: user.id,
        event_type: 'receipt_scan',
        metadata: {
          raw_text: result.rawText,
          parsed_items: result.items,
          status: 'completed',
          mode: result.mode,
        },
      })
      .select('id')
      .single();

    if (eventRecord) {
      result.scanId = (eventRecord as { id: string }).id;
    }

    return new Response(
      JSON.stringify({
        ...result,
        usage: {
          dailyLimit: usage.dailyLimit,
          bonusScans: usage.bonusScans,
          effectiveLimit: usage.effectiveLimit,
          used: usage.used + 1,
          remaining: usage.effectiveLimit - usage.used - 1,
          isPremium: usage.isPremium,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage || '스캔 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// --- Helper functions ---

interface AnalysisResult {
  // deno-lint-ignore no-explicit-any
  items: any[];
  rawText: string;
  isValid: boolean;
  invalidReason?: string;
}

async function analyzeReceiptImage(imageBase64: string): Promise<AnalysisResult> {
  const prompt = `이 이미지를 분석해주세요.

**먼저 이미지가 다음 중 하나인지 판단하세요:**
1. 영수증 (마트, 편의점, 식당 등의 구매 영수증)
2. 식재료/식품 사진 (냉장고 내부, 장본 식재료 등)

**이미지가 영수증이나 식재료 사진이 아닌 경우:**
{"isValid": false, "invalidReason": "not_receipt", "rawText": "", "items": []}

**이미지가 너무 흐리거나 인식이 불가능한 경우:**
{"isValid": false, "invalidReason": "unreadable", "rawText": "", "items": []}

**영수증이나 식재료 사진이지만 식품 항목이 없는 경우:**
{"isValid": false, "invalidReason": "no_food_items", "rawText": "인식된 텍스트", "items": []}

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
2. 브랜드명 제거, 실제 식재료명만
3. 수량 정보가 없으면 quantity: 1, unit: "ea"
4. JSON만 응답`;

  const text = await callGeminiWithImage(prompt, imageBase64, {
    maxTokens: 4096,
    temperature: 0.1,
  });

  if (!text) {
    return { items: [], rawText: '', isValid: false, invalidReason: 'unreadable' };
  }

  try {
    const parsed = parseJsonFromText(text) as Record<string, unknown>;

    if (parsed.isValid === false) {
      return {
        items: [],
        rawText: (parsed.rawText as string) || '',
        isValid: false,
        invalidReason: (parsed.invalidReason as string) || 'not_receipt',
      };
    }

    // deno-lint-ignore no-explicit-any
    const items = ((parsed.items as any[]) || []).map((item: any) => ({
      ...item,
      category: VALID_CATEGORIES.includes(item.category) ? item.category : 'etc',
      unit: VALID_UNITS.includes(item.unit) ? item.unit : 'ea',
      confidence: Math.max(0, Math.min(1, item.confidence || 0.7)),
      estimatedExpiryDays: DEFAULT_EXPIRY_DAYS[item.category] || 14,
    }));

    return {
      items,
      rawText: (parsed.rawText as string) || '',
      isValid: true,
    };
  } catch {
    return { items: [], rawText: text, isValid: false, invalidReason: 'unreadable' };
  }
}

async function processWithOCR(
  imageBase64: string,
  visionCredentials: string | undefined,
  geminiKey: string | undefined
// deno-lint-ignore no-explicit-any
): Promise<{ items: any[]; rawText: string; mode: string }> {
  if (!visionCredentials) {
    throw new Error('OCR 서비스가 설정되지 않았습니다.');
  }

  const rawText = await extractTextFromImage(imageBase64, visionCredentials);

  if (!isReceiptText(rawText)) {
    throw new Error('영수증 형태의 이미지가 아닙니다.');
  }

  // Try AI parsing with Gemini
  if (geminiKey) {
    try {
      const items = await parseReceiptWithAI(rawText);
      if (items.length > 0) {
        return { items, rawText, mode: 'ai' };
      }
    } catch {
      // Fall through to rule-based
    }
  }

  // Rule-based fallback
  const items = parseReceiptTextRuleBased(rawText);
  return { items, rawText, mode: 'ocr' };
}

// Google Cloud Vision OCR
async function extractTextFromImage(imageBase64: string, credentialsJson: string): Promise<string> {
  const credentials = JSON.parse(credentialsJson);
  const accessToken = await getGoogleAccessToken(credentials);

  const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        image: { content: imageBase64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        imageContext: { languageHints: ['ko', 'en'] },
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.responses[0]?.error) {
    throw new Error(data.responses[0].error.message);
  }

  return data.responses[0]?.fullTextAnnotation?.text || '';
}

async function getGoogleAccessToken(credentials: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-vision',
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await signRS256(signatureInput, credentials.private_key);
  const jwt = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return uint8ArrayToBase64Url(bytes);
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signRS256(input: string, privateKey: string): Promise<string> {
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryString = atob(pemContents);
  const binaryKey = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    binaryKey[i] = binaryString.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(input)
  );

  return uint8ArrayToBase64Url(new Uint8Array(signature));
}

// AI receipt text parsing
// deno-lint-ignore no-explicit-any
async function parseReceiptWithAI(rawText: string): Promise<any[]> {
  const prompt = `당신은 영수증 텍스트에서 식재료/식품만 추출하는 전문가입니다.

다음 영수증 텍스트에서 식재료와 식품 항목만 추출해주세요.

영수증 텍스트:
"""
${rawText}
"""

각 항목에 대해 JSON 배열 형식으로 응답:
[
  {
    "name": "식재료 이름",
    "quantity": 숫자,
    "unit": "g" | "kg" | "ml" | "L" | "ea" | "pack" | "bottle" | "box" | "bunch",
    "category": "vegetables" | "fruits" | "meat" | "seafood" | "dairy" | "condiments" | "grains" | "beverages" | "snacks" | "etc",
    "confidence": 0.0 ~ 1.0
  }
]

규칙: 식재료/식품만 추출, 브랜드명 제거, JSON만 응답`;

  const text = await callGemini(prompt, { temperature: 0.1, maxTokens: 2048 });

  if (!text) return [];

  const parsed = parseJsonFromText(text);
  if (!Array.isArray(parsed)) return [];

  // deno-lint-ignore no-explicit-any
  return parsed.filter((item: any) => item?.name && typeof item.name === 'string').map((item: any) => ({
    name: item.name,
    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
    unit: VALID_UNITS.includes(item.unit) ? item.unit : 'ea',
    category: VALID_CATEGORIES.includes(item.category) ? item.category : 'etc',
    confidence: Math.max(0, Math.min(1, item.confidence || 0.7)),
    estimatedExpiryDays: DEFAULT_EXPIRY_DAYS[item.category] || 14,
  }));
}

// Rule-based receipt parsing (fallback)
const categoryKeywords: Record<string, string[]> = {
  vegetables: ['양파', '당근', '감자', '고구마', '배추', '무', '시금치', '상추', '깻잎', '파', '대파', '마늘', '생강', '고추', '피망', '파프리카', '호박', '오이', '가지', '브로콜리', '콩나물', '버섯', '양배추', '토마토'],
  fruits: ['사과', '배', '귤', '오렌지', '바나나', '포도', '딸기', '수박', '참외', '멜론', '복숭아', '키위', '망고', '블루베리', '체리', '감'],
  meat: ['소고기', '돼지고기', '닭고기', '삼겹살', '목살', '안심', '등심', '갈비', '불고기', '닭가슴살', '베이컨', '햄', '소시지', '스팸'],
  seafood: ['고등어', '삼치', '갈치', '연어', '참치', '오징어', '새우', '조개', '홍합', '굴', '전복', '생선', '멸치', '미역', '다시마', '김', '어묵'],
  dairy: ['우유', '치즈', '버터', '요거트', '요구르트', '크림', '계란', '달걀', '두부', '순두부'],
  condiments: ['소금', '설탕', '간장', '된장', '고추장', '식초', '참기름', '들기름', '올리브유', '식용유', '케첩', '마요네즈', '후추', '고춧가루', '카레'],
  grains: ['쌀', '찹쌀', '현미', '밀가루', '빵', '라면', '국수', '파스타', '떡', '시리얼', '오트밀'],
  beverages: ['물', '생수', '콜라', '사이다', '주스', '커피', '녹차', '홍차', '보리차', '맥주', '소주', '와인'],
  snacks: ['과자', '초콜릿', '사탕', '젤리', '아이스크림', '케이크', '쿠키', '견과류', '아몬드', '호두', '땅콩'],
};

const excludePatterns = [
  /합계/i, /소계/i, /부가세/i, /과세/i, /면세/i, /할인/i, /쿠폰/i,
  /포인트/i, /적립/i, /카드/i, /현금/i, /결제/i, /거래/i, /영수증/i,
  /점포/i, /매장/i, /전화/i, /주소/i, /사업자/i, /대표/i,
  /\d{4}[-/.]\d{2}[-/.]\d{2}/, /\d{2}:\d{2}/, /\d{3}-\d{4}-\d{4}/,
  /총\s*\d+/, /\*{3,}/, /={3,}/, /-{3,}/,
];

// deno-lint-ignore no-explicit-any
function parseReceiptTextRuleBased(text: string): any[] {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  // deno-lint-ignore no-explicit-any
  const items: any[] = [];
  const seenNames = new Set<string>();

  for (const line of lines) {
    if (excludePatterns.some(pattern => pattern.test(line))) continue;

    const priceMatch = line.match(/(.+?)\s+[\d,]+원?$/);
    const productName = priceMatch ? priceMatch[1].trim() : line;

    if (productName.length < 2 || /^\d+$/.test(productName)) continue;

    const category = findCategory(productName);
    if (!category) continue;

    const normalizedName = productName.toLowerCase().replace(/\s+/g, '');
    if (seenNames.has(normalizedName)) continue;
    seenNames.add(normalizedName);

    items.push({
      name: productName.replace(/[\d,]+원?$/, '').replace(/[*#@!]/g, '').trim(),
      quantity: 1,
      unit: 'ea',
      category,
      confidence: 0.5,
      estimatedExpiryDays: DEFAULT_EXPIRY_DAYS[category] || 14,
    });
  }

  return items;
}

function findCategory(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) return category;
    }
  }
  return null;
}
