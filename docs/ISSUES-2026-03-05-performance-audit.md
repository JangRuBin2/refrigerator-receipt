# React Performance Audit - 2026-03-05

## CRITICAL (수정 완료)

### 1. RecipeList: fetchRecipes가 ingredients/favoriteRecipeIds에 의존 -> 불필요한 API 재호출

- **파일**: `src/features/recipes/RecipeList.tsx:39-83`
- **문제**: `fetchRecipes`의 useCallback 의존성에 `ingredients`, `favoriteRecipeIds`가 포함되어 있어서 즐겨찾기 토글이나 재료 변경 시마다 서버에서 레시피를 다시 가져옴
- **영향**: 불필요한 네트워크 요청, 페이지 프리징
- **수정**: fetch와 enrichment 분리. `rawRecipes` state로 서버 데이터 저장, `useMemo`로 클라이언트에서 availability/favorite 매핑

### 2. RecipeList: onRecipesLoaded useEffect -> 무한 렌더 루프

- **파일**: `src/features/recipes/RecipeList.tsx:117-119`
- **문제**: `filteredRecipes`가 매 렌더마다 새 배열 생성 -> useEffect 실행 -> 부모 state 업데이트 -> 자식 리렌더 -> 무한 루프
- **영향**: 레시피 페이지에서 다른 페이지로 네비게이션 불가 (페이지 프리징)
- **수정**: `filteredRecipes`를 `useMemo`로 메모이제이션, `onRecipesLoaded`를 ref 패턴으로 안정화

### 3. ShoppingPage: fetchRecommendations가 ingredients에 의존 -> AI API 과호출

- **파일**: `src/app/[locale]/shopping/page.tsx:94-116`
- **문제**: `ingredients` 배열이 Zustand store에서 변경될 때마다 AI 추천 API 호출
- **영향**: 재료 추가/삭제 시마다 AI API 비용 발생, 다중 동시 요청
- **수정**: `useStore.getState()`로 직접 읽어서 의존성 제거, 버튼 클릭 시에만 호출

## HIGH (개선 권장)

### 4. useHaptic: 매 렌더마다 새 함수 객체 반환

- **파일**: `src/hooks/useHaptic.ts:23-43`
- **문제**: `useHaptic()`이 매 렌더마다 새 객체/함수 참조 반환
- **영향**: 이 함수를 useEffect 의존성이나 메모이즈된 자식에 전달하면 불필요한 리렌더 발생
- **권장**: useCallback/useMemo로 감싸기

### 5. useAppsInTossAds: isAvailable 매 렌더마다 재계산

- **파일**: `src/hooks/useAppsInTossAds.ts:22`
- **문제**: `typeof window !== 'undefined' && isAdMobSupported()`가 매 렌더마다 실행
- **권장**: `useState` lazy initializer 사용

### 6. useExpiredCleanup: 불필요한 의존성

- **파일**: `src/hooks/useExpiredCleanup.ts:13-37`
- **문제**: `hasRun` ref로 1회만 실행하면서 `ingredients`가 의존성에 포함됨
- **권장**: 빈 의존성 배열 + `useStore.getState()` 사용

## MEDIUM (참고)

### 7-8. FridgePage, ShoppingPage: 필터/그룹핑 미메모이제이션

- **파일**: `src/app/[locale]/fridge/page.tsx:62-77`, `src/app/[locale]/shopping/page.tsx:205-223`
- **문제**: `filter()` + `reduce()`가 매 렌더마다 실행, reduce에서 spread로 O(n^2)
- **권장**: `useMemo` + mutation 기반 grouping

### 9. ShoppingPage: console.error 잔존

- **파일**: `src/app/[locale]/shopping/page.tsx:166,187,200`
- **권장**: toast 알림으로 교체

### 10-12. 대형 파일 (600줄 이상)

- `src/app/[locale]/scan/page.tsx` (608줄)
- `src/app/[locale]/settings/page.tsx` (648줄)
- `src/app/[locale]/page.tsx` (676줄)
- **권장**: 기능별 컴포넌트 분리 (800줄 제한 접근 중)

## 요약

| # | 심각도 | 파일 | 상태 |
|---|--------|------|------|
| 1 | CRITICAL | RecipeList.tsx | 수정 완료 |
| 2 | CRITICAL | RecipeList.tsx | 수정 완료 |
| 3 | CRITICAL | shopping/page.tsx | 수정 완료 |
| 4 | HIGH | useHaptic.ts | 미수정 |
| 5 | HIGH | useAppsInTossAds.ts | 미수정 |
| 6 | HIGH | useExpiredCleanup.ts | 미수정 |
| 7 | MEDIUM | fridge/page.tsx | 미수정 |
| 8 | MEDIUM | shopping/page.tsx | 미수정 |
| 9 | MEDIUM | shopping/page.tsx | 미수정 |
| 10-12 | MEDIUM | scan, settings, page.tsx | 미수정 |
