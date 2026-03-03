# Codebase Review Issues - 2026-03-03

## CRITICAL / HIGH

### 1. [SECURITY] IAP 구매 검증 누락
- **파일**: `supabase/functions/iap-activate/index.ts`
- **내용**: 클라이언트가 보낸 orderId/sku를 검증 없이 구독 활성화
- **위험**: 가짜 orderId로 프리미엄 무단 획득 가능
- **수정**: Toss IAP API로 서버측 구매 검증 후 활성화
- **상태**: [x] Toss API 서버측 검증 추가 + Zod 입력 검증

### 2. [SECURITY] CORS 와일드카드
- **파일**: `supabase/functions/_shared/cors.ts`
- **내용**: `Access-Control-Allow-Origin: '*'` 모든 origin 허용
- **수정**: Vercel 도메인으로 제한
- **상태**: [x] 동적 origin 검증 + dev 모드 localhost 허용

### 3. [SECURITY] 에러 메시지 내부 정보 노출
- **파일**: `auth-delete-account`, `receipts-scan`, `recipes-search`, `auth-toss`
- **내용**: catch 블록에서 내부 에러 메시지를 클라이언트에 그대로 반환
- **수정**: 사용자용 일반 메시지로 교체, 서버 로그만 상세 기록
- **상태**: [x] auth-delete-account, receipts-scan, recipes-search 수정

### 4. [SECURITY] Edge function 입력 Zod 검증 누락
- **파일**: `iap-activate`, `iap-status`, `auth-toss`
- **내용**: `as` 타입 단언으로 입력 처리, 런타임 검증 없음
- **수정**: Zod 스키마로 입력 검증
- **상태**: [x] iap-activate, iap-status에 Zod 스키마 추가

### 5. [I18N] 하드코딩 한국어 ~90개
- **파일**: `recommend`, `checkout`, `nutrition`, `pricing`, `scan`, `ConfirmDialog`
- **내용**: t() 호출 없이 한국어 문자열 직접 사용
- **수정**: 번역 키 추가 후 t() 호출로 교체
- **상태**: [x] recommend 컴포넌트 분리 시 ~30개 i18n 키 추가 및 t() 적용 (ko/en)

### 6. [BUG] updateSettings shallow merge
- **파일**: `src/store/useStore.ts:148`
- **내용**: notifications 객체가 통째로 덮어써져 expiryAlertDays 유실 가능
- **수정**: nested object deep merge
- **상태**: [x] notifications deep merge 적용

### 7. [CODE] recommend/page.tsx 917줄 (800줄 초과)
- **파일**: `src/app/[locale]/recommend/page.tsx`
- **수정**: RandomMode, TasteMode, AiMode, RecipeCard 컴포넌트 분리
- **상태**: [x] 4개 컴포넌트로 분리 (page.tsx 120줄로 축소)

## MEDIUM

### 8. [PERF] recipesWithAvailability useMemo 누락
- **파일**: `src/app/[locale]/recipes/page.tsx`
- **상태**: [x] useMemo 적용 (recipes, ingredients, favoriteRecipeIds 의존)

### 9. [PERF] 전체 레시피 테이블 로드
- **파일**: `src/lib/api/recipes.ts` (getRecommendedRecipes, scoreByTaste)
- **상태**: [x] getRecommendedRecipes select('*') -> 필요 컬럼만 조회

### 10. [A11Y] Modal/BottomSheet 접근성
- **파일**: `src/components/ui/Modal.tsx`, `BottomSheet.tsx`
- **내용**: role="dialog", aria-modal, ESC 키 누락
- **상태**: [x] role="dialog", aria-modal="true", aria-label, ESC 키 핸들러 추가

### 11. [A11Y] 아이콘 버튼 aria-label 누락
- **파일**: `fridge/page.tsx`, `recipes/page.tsx`
- **상태**: [x] Edit/Delete/Close/Favorite 버튼에 aria-label 추가

### 12. [CODE] reduce 내부 mutation
- **파일**: `fridge/page.tsx`, `shopping/page.tsx`
- **상태**: [x] 불변 스프레드 패턴으로 교체

### 13. [CODE] totalNutrition 객체 mutation
- **파일**: `supabase/functions/nutrition-analyze/index.ts`
- **상태**: [x] rawTotal -> totalNutrition 불변 패턴

### 14. [CODE] 에러 무시 catch 블록
- **파일**: `recipes/page.tsx`, `recommend/page.tsx`, `shopping/page.tsx`
- **상태**: [x] console.error 로깅 추가

### 15. [CODE] 중복 코드
- CATEGORIES/UNITS 상수 3곳 중복
- getCategoryIcon 3곳 중복
- getDifficultyColor 2곳 중복
- **상태**: [x] src/lib/constants.ts로 추출, 6개 파일에서 import 교체

### 16. [CODE] 미사용 export
- FadeTransition, SlideTransition, IconButton, CardFooter, Skeleton 변형
- **상태**: [x] 8개 미사용 컴포넌트 삭제, index.ts 정리

## LOW

### 17. callEdgeFunction `as T` 런타임 검증 없음
- **상태**: [x] 제네릭 타입 파라미터 제거, 반환 타입 unknown으로 변경

### 18. getRandomRecipes 실제 랜덤 아님
- **상태**: [x] 미사용 getRandomRecipes 함수 삭제 (getRandomRecipe이 올바르게 구현됨)

### 19. gemini.ts parseJsonFromText object 파싱 try-catch 누락
- **상태**: [x] try-catch 추가

### 20. settings 버전 하드코딩
- **상태**: [ ] 우선순위 낮음
