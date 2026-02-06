# 코드베이스 전체 점검 결과

> 점검일: 2026-02-06
> 점검자: Claude Code

---

## 목차

1. [구현되지 않은 기능](#1-구현되지-않은-기능)
2. [ES6 문법 개선 필요 항목](#2-es6-문법-개선-필요-항목)
3. [가짜 UI 요소 (미구현인데 구현된 것처럼 보이는 것)](#3-가짜-ui-요소)
4. [MVP 개선 계획](#4-mvp-개선-계획)

---

## 1. 구현되지 않은 기능

### 1.1 설정 페이지 (Settings)

| 위치 | 기능 | 상태 | 우선순위 |
|------|------|------|----------|
| `settings/page.tsx:278` | 백업 기능 | UI 버튼만 존재, onClick 핸들러 없음 | MVP-1 |
| `settings/page.tsx:279` | 복원 기능 | UI 버튼만 존재, onClick 핸들러 없음 | MVP-1 |
| `settings/page.tsx:227-267` | 유통기한 알림 | 토글만 작동, 실제 Push Notification 없음 | MVP-3 |

### 1.2 프리미엄 기능

| 위치 | 기능 | 상태 | 우선순위 |
|------|------|------|----------|
| `pricing/page.tsx:53-58` | 음식 낭비 분석 | 프리미엄 혜택에 표시되지만 API/UI 없음 | MVP-1 (제거) |
| `pricing/page.tsx:66-69` | 광고 제거 | 앱에 광고가 없어서 무의미 | MVP-1 (제거) |
| `PremiumModal.tsx:22` | waste_analysis | 아이콘 매핑만 있고 실제 구현 없음 | MVP-1 (제거) |

### 1.3 데이터 동기화

| 위치 | 기능 | 상태 | 우선순위 |
|------|------|------|----------|
| `useStore.ts:56-60` | 즐겨찾기 동기화 | localStorage만 사용, DB 미연동 | MVP-2 |
| `fridge/page.tsx` | 재료 DB 동기화 | Zustand만 사용, Supabase 미연동 | MVP-2 |

### 1.4 기타

| 위치 | 기능 | 상태 | 우선순위 |
|------|------|------|----------|
| `scan/page.tsx` | 스캔 히스토리 보기 | API 존재, UI 없음 | MVP-3 |
| `recipes/page.tsx:720` | instructions fallback | 비어있으면 빈 화면 | MVP-1 |

---

## 2. ES6 문법 개선 필요 항목

### 2.1 TypeScript any 타입 사용

```typescript
// 문제: Supabase 타입 정의에 event_logs 테이블 누락

// recipes/search/route.ts:129
await (supabase.from('event_logs') as any).insert({...})

// recipes/ai-generate/route.ts:126
await (supabase.from('event_logs') as any).insert({...})

// receipts/scan/route.ts:156
await (supabase.from('event_logs') as any).insert({...})

// shopping/recommend/route.ts:46
await (supabase.from('event_logs') as any)
```

**해결방안**: `src/types/supabase.ts`에 `event_logs` 테이블 타입 추가

### 2.2 useEffect 의존성 배열 문제

```typescript
// recipes/page.tsx:214-218
useEffect(() => {
  if (meal && filteredRecipes.length > 0) {
    spinRoulette();
  }
}, [meal]);  // filteredRecipes, spinRoulette 누락
```

**해결방안**: ESLint exhaustive-deps 경고 해결 또는 의도적 무시 주석 추가

---

## 3. 가짜 UI 요소

### 3.1 CRITICAL (즉시 수정 필요)

사용자가 클릭하면 동작할 것으로 기대하지만 아무 일도 일어나지 않음

| 위치 | UI 요소 | 문제점 | 해결방안 |
|------|---------|--------|----------|
| `settings/page.tsx:278` | 백업 버튼 | 클릭해도 아무 동작 없음 | 기능 구현 또는 UI 제거/비활성화 |
| `settings/page.tsx:279` | 복원 버튼 | 클릭해도 아무 동작 없음 | 기능 구현 또는 UI 제거/비활성화 |
| `settings/page.tsx:238-260` | 알림 토글 | 토글 작동하지만 실제 알림 없음 | "준비 중" 표시 또는 기능 구현 |
| `pricing/page.tsx:53-58` | 음식 낭비 분석 | 프리미엄에 표시되지만 기능 없음 | 목록에서 제거 |
| `pricing/page.tsx:66-69` | 광고 제거 | 광고 자체가 없음 | 목록에서 제거 |

### 3.2 HIGH (기능 미완성)

기능은 일부 작동하지만 표시와 실제가 다름

| 위치 | UI 요소 | 문제점 | 해결방안 |
|------|---------|--------|----------|
| `shopping/page.tsx:317-364` | AI 추천 | API 키 없으면 규칙 기반인데 "AI" 표시 | 실제 모드 표시 |
| `nutrition/page.tsx:452-476` | AI 추천 | API 키 없으면 기본 추천인데 "AI" 배지 | 실제 모드 표시 |
| `page.tsx:234-249` | 영양 분석 카드 | 프리미엄인데 무료처럼 보임 | 프리미엄 배지 추가 |

### 3.3 MEDIUM (UX 개선 필요)

| 위치 | UI 요소 | 문제점 | 해결방안 |
|------|---------|--------|----------|
| `recipes/page.tsx:717-727` | 조리 방법 | instructions 비면 빈 화면 | "데이터 없음" 메시지 |
| `fridge/page.tsx` | 재료 관리 | 로컬 저장 명시 없음 | 안내 문구 추가 |
| `checkout/page.tsx:107-112` | 웹 결제 | 에러 메시지만 표시 | 대안 안내 |

---

## 4. MVP 개선 계획

### MVP-1: 가짜 UI 제거 (Critical Fix)

**목표**: 사용자 혼란을 유발하는 가짜 UI 즉시 제거/수정

**작업 목록**:
- [ ] Settings 페이지 백업/복원 버튼 "준비 중" 표시 또는 제거
- [ ] Settings 페이지 알림 토글에 "준비 중" 표시
- [ ] Pricing 페이지에서 "음식 낭비 분석" 제거
- [ ] Pricing 페이지에서 "광고 제거" 제거
- [ ] PremiumModal에서 waste_analysis 관련 코드 제거
- [ ] usePremium에서 waste_analysis, no_ads 제거
- [ ] Recipe 모달에서 instructions 없을 때 fallback UI 추가

**예상 시간**: 2시간

---

### MVP-2: 데이터 동기화 (Core Fix)

**목표**: 로컬 데이터와 서버 데이터 동기화

**작업 목록**:
- [ ] ingredients를 Supabase와 동기화
- [ ] favoriteRecipeIds를 Supabase와 동기화
- [ ] 오프라인 지원 (낙관적 업데이트)

**예상 시간**: 8시간

---

### MVP-3: 미구현 기능 구현

**목표**: 표시된 기능 실제 구현

**작업 목록**:
- [ ] Push Notification 구현 (Service Worker)
- [ ] 데이터 백업/복원 기능 (JSON export/import)
- [ ] 스캔 히스토리 UI

**예상 시간**: 16시간

---

### MVP-4: 타입 안정성 개선

**목표**: TypeScript 타입 강화

**작업 목록**:
- [ ] `event_logs` 테이블 타입 추가
- [ ] `subscriptions` 테이블 타입 추가
- [ ] `shopping_lists` 테이블 타입 확인
- [ ] any 타입 캐스팅 제거

**예상 시간**: 4시간

---

## 부록: 데이터 불일치 현황

### A. Zustand Store vs Supabase

| 데이터 | Zustand (localStorage) | Supabase | 동기화 |
|--------|------------------------|----------|--------|
| ingredients | O | O (미사용) | X |
| favoriteRecipeIds | O | O (미사용) | X |
| settings | O | X | - |

### B. API 라우트 사용 현황

| API | 프론트엔드 사용 |
|-----|-----------------|
| `/api/favorites` | X (미사용) |
| `/api/ingredients` | X (Zustand 사용) |
| `/api/crawl` | X (미사용) |
| `/api/recipes/*` | O |
| `/api/shopping/*` | O |
| `/api/nutrition/*` | O |
| `/api/receipts/scan` | O |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-02-06 | 1.0 | 최초 작성 |
