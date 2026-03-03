# Task: AI 즐겨찾기 저장 버그 + 영양분석 주간 버그

**Date**: 2026-03-03
**Status**: In Progress

---

## 1. AI 레시피 생성 후 즐겨찾기 저장 안됨

### 현상
- AI 맞춤 레시피 생성 후 "즐겨찾기에 저장" 클릭 시 recipes 테이블에만 저장됨
- user_favorites 테이블에 추가되지 않음
- Zustand store의 favoriteRecipeIds에도 반영되지 않음
- 레시피 목록 페이지의 즐겨찾기 필터에서 AI 생성 레시피가 보이지 않음

### 원인
- `src/app/[locale]/recommend/page.tsx` line 277-289의 `saveAiRecipe()`
- `saveAiRecipeApi()`는 `recipes` 테이블에 INSERT만 수행
- `addFavorite()` 호출 누락 -> `user_favorites` 테이블에 미등록
- Zustand `toggleFavorite()` 호출 누락 -> 로컬 상태 미반영

### 수정 방안
1. `saveAiRecipeApi()` 호출 후 반환된 recipe.id로 `addFavorite(recipe.id)` 호출
2. Zustand store의 `toggleFavorite(recipe.id)` 호출하여 로컬 상태 동기화

### 수정 파일
- `src/app/[locale]/recommend/page.tsx`

---

## 2. 영양분석 주간 뷰 안됨

### 현상
- 영양분석 페이지에서 "주간" 탭 클릭 시 데이터 없음 표시
- "현재 상태" 탭은 정상 동작

### 원인
- Edge function `nutrition-analyze`에서 `purchase_date` 기반 필터링 사용
- `purchase_date`가 NULL인 재료는 PostgreSQL `.gte()` 필터에서 제외됨
- 수동 추가 재료 등 purchase_date 미설정 재료가 모두 누락

### 수정 방안
- Edge function에서 `purchase_date` IS NULL인 경우 `created_at`으로 fallback
- Supabase `.or()` 필터 사용

### 수정 파일
- `supabase/functions/nutrition-analyze/index.ts`

---

## Checklist
- [ ] AI 레시피 즐겨찾기 저장 수정
- [ ] 영양분석 주간 필터 수정
- [ ] 빌드 확인
