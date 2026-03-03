# 영수증 스캔 개선 (Receipt Scan Improvement)

> 작성일: 2026-03-03
> 상태: 진행 중

## 문제 요약

영수증 이미지를 스캔하면 식재료가 인식되지 않는 현상 발생.

## 근본 원인

### 1. `parseJsonFromText` JSON 파싱 순서 버그 (Critical)

Gemini가 `{"isValid": true, "items": [...]}` 형태의 JSON을 반환할 때,
`parseJsonFromText`가 **배열(`[...]`)을 먼저 매칭**하여 내부 `items` 배열만 추출.

```
Gemini 응답: {"isValid": true, "rawText": "...", "items": [{"name": "우유"}]}

parseJsonFromText 실행:
1. indexOf('[') → items 배열의 '[' 발견
2. lastIndexOf(']') → items 배열의 ']' 발견
3. JSON.parse('[{"name": "우유"}]') → 성공! → 배열 반환

결과: isValid, rawText 등 외부 객체 정보 소실
```

이후 `analyzeReceiptImage`에서:
- `parsed`가 배열 → `result.items`는 undefined → `rawItems = []`
- items 0개 → **"영수증에서 식재료를 찾을 수 없습니다" 에러**

### 2. MIME 타입 하드코딩

`callGeminiWithImage`의 기본 MIME 타입이 `image/jpeg`로 하드코딩.
PNG, HEIC 등 다른 형식의 이미지는 잘못된 MIME 타입으로 전송됨.

### 3. Gemini 응답 비규격화

Gemini API 응답은 규격화되어 있지 않음:
- 마크다운 코드 블록으로 감싸는 경우
- 설명 텍스트가 JSON 앞뒤에 붙는 경우
- 토큰 한도로 JSON이 잘리는 경우

## 모드별 데이터 흐름

```
[공통 반환 타입]
ScanResult { items: ScannedItem[], rawText: string, mode: string }
```

### Mode 1: AI Vision (`mode: 'ai-vision'`)
```
이미지 → Gemini Vision (직접 이미지 분석) → JSON → parseJsonFromText
```
- 가장 정확하지만 Gemini 응답 파싱에 의존

### Mode 2: OCR + AI (`mode: 'ai'`)
```
이미지 → Google Cloud Vision OCR → rawText
  → isReceiptText() 확인 (패턴 2개 이상)
  → rawText → Gemini 텍스트 모델 → JSON → parseJsonFromText
```
- 동일한 `parseJsonFromText` 취약점 존재

### Mode 3: Rule-based (`mode: 'ocr'`)
```
이미지 → Google Cloud Vision OCR → rawText
  → parseReceiptTextRuleBased() → 키워드 사전 매칭
```
- AI 미사용, 규격화된 출력 보장
- 키워드 사전에 없는 식재료 인식 불가

| 모드 | 반환값 규격화 | 정확도 | 약점 |
|------|:---:|:---:|------|
| AI Vision | X | 높음 | JSON 파싱 실패 가능 |
| OCR + AI | X | 중간 | OCR 품질 + JSON 파싱 |
| Rule-based | O | 낮음 | 키워드 사전 한계 |

## 적용된 수정사항

### Fix 1: `parseJsonFromText` 파싱 순서 변경
- **전체 문자열 파싱 → 객체 추출 → 배열 추출** 순서로 변경
- 전체 JSON이 유효하면 즉시 반환 (가장 안전)
- 객체를 배열보다 먼저 시도 (내부 배열 오추출 방지)

### Fix 2: 배열 fallback 처리
- `analyzeReceiptImage`에서 `parseJsonFromText`가 배열을 반환하는 경우 대비
- 배열이면 직접 items로 처리

### Fix 3: MIME 타입 감지
- 클라이언트에서 `file.type`을 전달
- Edge Function → Gemini API까지 실제 MIME 타입 전파

### Fix 4: `responseMimeType: "application/json"` 추가
- Gemini API에 JSON 출력 강제 옵션 추가
- 마크다운 감싸기, 설명 텍스트 등 방지

## 추가 개선사항 (진행 중)

### `responseSchema` 적용
Gemini API의 `responseSchema` 기능을 사용하여 응답 구조를 스키마 수준에서 강제.

```typescript
// generationConfig에 추가
{
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'object',
    properties: {
      isValid: { type: 'boolean' },
      invalidReason: { type: 'string', enum: ['not_receipt', 'unreadable', 'no_food_items'] },
      rawText: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string', enum: ['g','kg','ml','L','ea','pack','bottle','box','bunch'] },
            category: { type: 'string', enum: ['vegetables','fruits','meat','seafood','dairy','condiments','grains','beverages','snacks','etc'] },
            confidence: { type: 'number' }
          },
          required: ['name', 'quantity', 'unit', 'category']
        }
      }
    },
    required: ['isValid', 'items']
  }
}
```

이렇게 하면:
- `responseMimeType`만으로는 JSON 구조를 보장 못 함
- `responseSchema`가 **필드명, 타입, enum 값**까지 강제
- Gemini가 스키마에 맞지 않는 응답을 생성하지 않음

## 파일 위치

| 파일 | 역할 |
|------|------|
| `supabase/functions/_shared/gemini.ts` | Gemini API 호출 유틸 |
| `supabase/functions/receipts-scan/index.ts` | 영수증 스캔 Edge Function |
| `src/lib/api/scan.ts` | 클라이언트 → Edge Function 호출 |
| `src/app/[locale]/scan/page.tsx` | 스캔 UI 페이지 |

## 사용자 선택/수정 기능

스캔 결과는 `scan/page.tsx`의 confirm 단계에서 수정 가능:
- 항목별 체크박스 (선택/해제)
- 이름 편집 (Input)
- 수량 편집 (number Input)
- 단위 선택 (Select: g, kg, ml, L, ea, pack, bottle, box, bunch)
- 카테고리 선택 (Select: vegetables ~ etc)
- 유통기한 수정 (date picker)
- 선택된 항목만 냉장고에 추가
