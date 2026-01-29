# Premium 기능 구현 TODO

## 현재 상태
- [x] 프리미엄 게이팅 로직 (`usePremium` 훅, `PremiumModal`)
- [x] 구독 API (`/api/subscription`)
- [x] DB 스키마 (`subscriptions` 테이블)
- [x] 결제 페이지 UI (`/checkout`)

---

## 구현 순서

### 1. 영수증 스캔 (OCR) 개선
**상태**: 기본 구조 있음, API 연동 필요
**우선순위**: 높음 (핵심 유료 기능)

- [ ] Google Cloud Vision API 연동
- [ ] 영수증 텍스트 파싱 로직 개선
- [ ] 식재료 자동 분류 (카테고리, 유통기한 추정)
- [ ] 스캔 히스토리 저장 (`receipt_scans` 테이블 활용)

**관련 파일**:
- `src/app/api/receipts/scan/route.ts`
- `src/app/[locale]/scan/page.tsx`

---

### 2. AI 맞춤 레시피 생성
**상태**: ✅ 완료
**우선순위**: 높음 (차별화 기능)

- [x] Google Gemini API 연동 설정
- [x] AI 레시피 생성 API (`/api/recipes/ai-generate`)
- [x] 프롬프트 설계 (냉장고 재료 기반)
- [x] AI 레시피 UI (추천 페이지에 'AI 모드' 탭 추가)
- [ ] 생성된 레시피 저장 기능 (즐겨찾기)

**구현 내용**:
```
입력: 냉장고 재료 목록 + 선호도 (조리시간, 난이도, 요리 스타일)
출력: 레시피 이름, 재료, 조리법, 예상 조리시간
API: Google Gemini 1.5 Flash
```

**관련 파일**:
- `src/app/api/recipes/ai-generate/route.ts`
- `src/app/[locale]/recommend/page.tsx` (AI 모드 탭)

---

### 3. 외부 레시피 검색 (YouTube/Google)
**상태**: 기본 구조 있음, API 키 필요
**우선순위**: 중간

- [ ] YouTube Data API v3 연동
- [ ] Google Custom Search API 연동 (선택)
- [ ] 검색 결과 캐싱 (비용 절감)
- [ ] 검색 UI 개선 (필터, 정렬)

**관련 파일**:
- `src/app/api/recipes/search/route.ts`
- `src/app/[locale]/recipes/page.tsx`

---

### 4. 스마트 장보기 목록
**상태**: 미구현
**우선순위**: 중간 (실용적 기능)

- [ ] 장보기 목록 DB 테이블 (`shopping_lists`)
- [ ] 장보기 API (`/api/shopping`)
- [ ] 소진 예측 알고리즘 (사용 패턴 분석)
- [ ] 자주 사는 재료 추천
- [ ] 장보기 목록 UI 페이지 (`/shopping`)
- [ ] 체크리스트 기능

**DB 스키마**:
```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT,
  items JSONB, -- [{name, quantity, unit, checked}]
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

---

### 5. 영양 분석 리포트
**상태**: 미구현
**우선순위**: 중간

- [ ] 식재료별 영양 정보 DB (또는 외부 API)
- [ ] 섭취 기록 테이블 (`consumption_logs`)
- [ ] 영양 분석 API (`/api/nutrition/analyze`)
- [ ] 주간/월간 리포트 생성
- [ ] 영양 분석 UI 페이지 (`/nutrition`)
- [ ] 차트/그래프 시각화

**분석 항목**:
- 칼로리, 단백질, 탄수화물, 지방
- 비타민, 미네랄 (선택)
- 영양 균형 점수

---

### 6. 음식 낭비 분석
**상태**: 미구현
**우선순위**: 낮음

- [ ] 버린 재료 기록 기능
- [ ] 낭비 통계 API (`/api/waste/stats`)
- [ ] 낭비 분석 UI 페이지 (`/waste`)
- [ ] 절약 팁 제공
- [ ] 월간 낭비 리포트

**DB 스키마**:
```sql
CREATE TABLE waste_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  ingredient_id UUID,
  ingredient_name TEXT,
  quantity DECIMAL,
  unit TEXT,
  reason TEXT, -- 'expired', 'spoiled', 'other'
  wasted_at TIMESTAMPTZ
);
```

---

### 7. 광고 제거
**상태**: 보류 (광고 시스템 없음)
**우선순위**: 낮음

- [ ] 광고 배너 컴포넌트 구현 (Free 유저용)
- [ ] 프리미엄 유저 광고 숨김 처리

---

## 환경 변수 필요 목록

```env
# OCR
GOOGLE_CLOUD_VISION_API_KEY=

# AI 레시피 (✅ 구현됨)
GOOGLE_GEMINI_API_KEY=

# 외부 검색
YOUTUBE_API_KEY=
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_CX=
```

---

## 우선순위 요약

| 순서 | 기능 | 난이도 | 사용자 가치 |
|------|------|--------|------------|
| 1 | 영수증 스캔 (OCR) | 중 | 높음 |
| 2 | AI 맞춤 레시피 | 중 | 매우 높음 |
| 3 | 외부 레시피 검색 | 낮음 | 중간 |
| 4 | 스마트 장보기 | 중 | 높음 |
| 5 | 영양 분석 | 높음 | 중간 |
| 6 | 음식 낭비 분석 | 중 | 낮음 |
| 7 | 광고 제거 | 낮음 | 낮음 |

---

## 작업 시작 명령어

```bash
# 1번 작업 시작
"영수증 스캔 OCR 기능 구현해줘"

# 2번 작업 시작
"AI 맞춤 레시피 생성 기능 구현해줘"

# 순차적으로 진행
```
