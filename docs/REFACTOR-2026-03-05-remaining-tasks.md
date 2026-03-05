# Refactoring Remaining Tasks - 2026-03-05

## Completed (Committed: 6159a2e)

- [x] Recipe user isolation (migration 006, created_by column, RLS)
- [x] getSession() -> getUser() (edge.ts, PremiumGate, usePremium)
- [x] Supabase client placeholder fallback 제거
- [x] Recipe query user_id 필터 추가 (getRecipes, getRecommended, scoreByTaste, getRandomRecipe)
- [x] RecipeList 무한루프 수정 (useMemo + ref pattern)
- [x] 반응형 UI 수정 (grid-cols-2 sm:grid-cols-4, Toast 너비, overflow-x-hidden)
- [x] 미사용 패키지 삭제 (next-auth, html-to-image, sharp, cheerio)
- [x] 미사용 파일 9개 삭제

---

## Task 13: 중복 함수 통합

### getDifficultyColor() - 3곳 중복
- `src/lib/constants.ts:29-34` (유지)
- `src/features/recipes/utils.ts:4-15` (constants에서 import로 변경)
- `src/features/recommend/utils.ts:24-29` (constants에서 import로 변경)

### getDifficultyLabel() - 3곳 중복
- `src/lib/constants.ts:36-44` (유지)
- `src/features/recommend/utils.ts:14-22` (constants에서 import로 변경)
- `src/app/[locale]/favorites/page.tsx:80-87` (constants에서 import로 변경)

---

## Task 14: console.error/log 제거

### 파일 목록:
- `src/app/[locale]/shopping/page.tsx:162,183,196` - console.error 3곳 -> toast로 교체 또는 제거
- `src/lib/apps-in-toss/server.ts` - console.warn/error 5곳 -> 제거 (미사용 파일이면 파일 자체 삭제)

---

## Task 15: Dead state 제거 + SettingsItem 분리

### scan/page.tsx:
- `scanMode` state (line 54) - 설정만 되고 읽히지 않음 -> 제거
- `setScanMode` 호출 (line 160) 도 제거

### settings/page.tsx:
- `SettingsItem` 컴포넌트 (line 144-191) - 부모 컴포넌트 내부에 정의되어 매 렌더마다 재생성
- `src/features/settings/SettingsItem.tsx`로 추출
- 5개 modal boolean state -> 단일 `activeModal` discriminated union으로 통합

---

## Task 16: 대형 파일 컴포넌트 분리

### 16-1. `src/app/[locale]/page.tsx` (675줄)
| 추출 대상 | 파일 | 내용 |
|-----------|------|------|
| TrialBanner | `src/features/home/TrialBanner.tsx` | Trial 배너 |
| DashboardStats | `src/features/home/DashboardStats.tsx` | 4개 통계 카드 |
| EmptyState | `src/features/home/EmptyState.tsx` | 빈 냉장고 상태 |
| ExpiryTimeline | `src/features/home/ExpiryTimeline.tsx` | 유통기한 타임라인 |
| ExpiringAlert | `src/features/home/ExpiringAlert.tsx` | 임박 재료 알림 |
| StorageBreakdown | `src/features/home/StorageBreakdown.tsx` | 보관방식 분포 |
| CategoryBreakdown | `src/features/home/CategoryBreakdown.tsx` | 카테고리 분포 |
| RecentItems | `src/features/home/RecentItems.tsx` | 최근 등록 재료 |
| FeatureCards | `src/features/home/FeatureCards.tsx` | 기능 카드 링크 |
| useDashboardStats | `src/hooks/useDashboardStats.ts` | 통계 계산 커스텀 훅 |

### 16-2. `src/app/[locale]/settings/page.tsx` (647줄)
| 추출 대상 | 파일 |
|-----------|------|
| SettingsItem | `src/features/settings/SettingsItem.tsx` |
| ProfileSection | `src/features/settings/ProfileSection.tsx` |
| ThemeSelector | `src/features/settings/ThemeSelector.tsx` |
| PremiumStatusSheet | `src/features/settings/PremiumStatusSheet.tsx` |
| DeleteAccountModal | `src/features/settings/DeleteAccountModal.tsx` |
| AppInfoCard | `src/features/settings/AppInfoCard.tsx` |
| useUserProfile | `src/hooks/useUserProfile.ts` |

### 16-3. `src/app/[locale]/scan/page.tsx` (608줄)
| 추출 대상 | 파일 |
|-----------|------|
| UploadStep | `src/features/scan/UploadStep.tsx` |
| ScanningStep | `src/features/scan/ScanningStep.tsx` |
| ConfirmStep | `src/features/scan/ConfirmStep.tsx` |
| ResultsSheet | `src/features/scan/ResultsSheet.tsx` |
| useScanFlow | `src/hooks/useScanFlow.ts` |

### 16-4. `src/app/[locale]/shopping/page.tsx` (539줄)
| 추출 대상 | 파일 |
|-----------|------|
| ProgressCard | `src/features/shopping/ProgressCard.tsx` |
| RecommendationsCard | `src/features/shopping/RecommendationsCard.tsx` |
| ShoppingItemGroup | `src/features/shopping/ShoppingItemGroup.tsx` |
| AddItemModal | `src/features/shopping/AddItemModal.tsx` |
| useShoppingList | `src/hooks/useShoppingList.ts` |

### 16-5. `src/features/recommend/AiRecipeMode.tsx` (499줄)
| 추출 대상 | 파일 |
|-----------|------|
| IngredientSelector | `src/features/recommend/IngredientSelector.tsx` |
| PreferencesForm | `src/features/recommend/PreferencesForm.tsx` |
| RecipeResult | `src/features/recommend/RecipeResult.tsx` |
| useAiRecipeGeneration | `src/hooks/useAiRecipeGeneration.ts` |

### 16-6. `src/app/[locale]/nutrition/page.tsx` (491줄)
| 추출 대상 | 파일 |
|-----------|------|
| ScoreCard | `src/features/nutrition/ScoreCard.tsx` |
| MacroNutrients | `src/features/nutrition/MacroNutrients.tsx` |
| CategoryBalance | `src/features/nutrition/CategoryBalance.tsx` |
| NutritionRecommendations | `src/features/nutrition/NutritionRecommendations.tsx` |
| useNutritionReport | `src/hooks/useNutritionReport.ts` |

### 16-7. `src/app/[locale]/checkout/page.tsx` (459줄)
| 추출 대상 | 파일 |
|-----------|------|
| PlanSelector | `src/features/checkout/PlanSelector.tsx` |
| ValueProposition | `src/features/checkout/ValueProposition.tsx` |
| OrderSummary | `src/features/checkout/OrderSummary.tsx` |
| PaymentMethod | `src/features/checkout/PaymentMethod.tsx` |

### 16-8. `src/lib/shareImage.ts` (329줄)
| 추출 대상 | 파일 |
|-----------|------|
| recipeRenderer | `src/lib/canvas/recipeRenderer.ts` |
| imageShare | `src/lib/share/imageShare.ts` |

---

## Task 17: 최종 빌드 확인

각 Task 완료 후 `pnpm build` 실행하여 빌드 성공 확인

---

## 추가 개선 사항 (중기)

| # | 내용 | 우선도 |
|---|------|--------|
| A | callEdgeFunction에 timeout + 제네릭 타입 추가 | HIGH |
| B | Store DB sync 실패 알림/재시도 구현 | HIGH |
| C | Zod validation을 API 함수에 적용 | MEDIUM |
| D | favorites store DB sync 추가 | MEDIUM |
| E | useMemo 추가 (shopping groupedItems, fridge filteredIngredients) | MEDIUM |
| F | Shopping list race condition (atomic DB operation) | MEDIUM |
