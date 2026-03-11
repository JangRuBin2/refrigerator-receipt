# 프리미엄/광고 시스템 리팩토링

**작성일**: 2026-03-11
**우선순위**: 높음

---

## 현재 문제점

### 1. 보상형 광고가 안 뜸 (스캔 페이지)
- 스캔 페이지에서 무료 사용자가 광고 시청 후 이용하는 플로우가 실제 동작하지 않음
- `GoogleAdMob.loadAppsInTossAdMob` 호출 시 광고 로드 실패 가능성
- 광고 SDK 환경(토스 앱 WebView)에서만 동작 → 웹 브라우저에서는 `isAdMobSupported()` = false
- 광고 로드 실패 시 사용자에게 피드백 없이 조용히 실패함

### 2. 페이지 접근 자체가 차단됨 (PremiumGate)
- **현재**: `PremiumGate`가 페이지 전체를 감싸서 비프리미엄 사용자는 페이지 자체에 접근 불가
- **요청**: 페이지 이동은 자유롭게 허용하되, **기능 실행 시점**에만 결제 여부를 확인
- 영향 범위:
  - `/fridge` → `fridge_management`
  - `/shopping` → `smart_shopping`
  - `/recipes` → `recipe_browsing`
  - `/nutrition` → `nutrition_analysis`

### 3. 배너 광고 크기가 너무 작음
- `BannerAd` 컴포넌트에 고정 높이가 없어 TossAds SDK가 반환하는 크기 그대로 노출
- 최소 높이 미지정 → 광고가 말도 안 되게 작게 렌더링될 수 있음
- `rounded-xl`로 잘림 → 광고 영역이 더 작아 보이는 효과

---

## 수정 계획

### Phase 1: PremiumGate → 함수 레벨 게이팅으로 변경

#### 1-1. `PremiumGate` 제거 (4개 페이지)

| 페이지 | 파일 | 현재 | 변경 후 |
|--------|------|------|---------|
| `/fridge` | `src/app/[locale]/fridge/page.tsx` | `<PremiumGate feature="fridge_management">` 전체 래핑 | 제거 |
| `/shopping` | `src/app/[locale]/shopping/page.tsx` | `<PremiumGate feature="smart_shopping">` 전체 래핑 | 제거 |
| `/recipes` | `src/app/[locale]/recipes/page.tsx` | `<PremiumGate feature="recipe_browsing">` 전체 래핑 | 제거 |
| `/nutrition` | `src/app/[locale]/nutrition/page.tsx` | `<PremiumGate feature="nutrition_analysis">` 전체 래핑 | 제거 |

#### 1-2. 함수 실행 시점에 프리미엄 체크 + 광고 시청 옵션

각 페이지에서 핵심 기능 실행 시:
1. 프리미엄 사용자 → 바로 실행
2. 비프리미엄 + 광고 가능 → 보상형 광고 시청 후 실행
3. 비프리미엄 + 광고 불가 → PremiumModal 표시 (구독 유도)

**게이팅 대상 함수 (페이지별)**:

| 페이지 | 게이팅 대상 함수 | 설명 |
|--------|-----------------|------|
| `/fridge` | `handleSubmit` (추가/수정) | 재료 추가/수정 시 체크 |
| `/shopping` | `fetchRecommendations`, `addItem` | AI 추천 조회, 항목 추가 시 |
| `/recipes` | 레시피 검색/조회 | 검색 실행 시 |
| `/nutrition` | 영양 분석 실행 | 분석 버튼 클릭 시 |
| `/scan` | `handleFileSelect` | 이미 구현됨 (유지) |

#### 1-3. `usePremiumAction` 커스텀 훅 생성

```typescript
// src/hooks/usePremiumAction.ts
interface UsePremiumActionReturn {
  /** 프리미엄 체크 후 액션 실행. 광고 시청 또는 PremiumModal 표시 */
  executeWithPremiumCheck: (action: () => Promise<void> | void) => Promise<void>;
  /** PremiumModal 표시 여부 */
  showPremiumModal: boolean;
  /** PremiumModal 닫기 */
  closePremiumModal: () => void;
  /** 광고 시청 중 여부 */
  isWatchingAd: boolean;
}
```

플로우:
```
executeWithPremiumCheck(action)
  ├─ isPremium → action() 즉시 실행
  ├─ !isPremium + isAdsAvailable → watchAdForReward → action()
  └─ !isPremium + !isAdsAvailable → setShowPremiumModal(true)
```

---

### Phase 2: 보상형 광고 수정

#### 2-1. 광고 로드 실패 핸들링 개선

**현재 문제**: `loadRewardedAd` 실패 시 사용자에게 알림 없음

**수정**:
- 광고 로드 실패 시 토스트 메시지 표시
- 로드 타임아웃 추가 (10초)
- 재시도 로직 (1회)
- 광고 불가 환경(브라우저)에서는 바로 PremiumModal 표시

#### 2-2. `loadRewardedAd`에 타임아웃 추가

```typescript
// src/lib/apps-in-toss/ads.ts
export function loadRewardedAd(adGroupId: string, timeout = 10000): Promise<AdLoadResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ type: 'error', adType: 'rewarded', errorCode: 'NETWORK_ERROR', errorMessage: 'Ad load timed out' });
    }, timeout);

    GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          clearTimeout(timer);
          resolve({ type: 'success', adType: 'rewarded' });
        }
      },
      onError: (error) => {
        clearTimeout(timer);
        resolve({ type: 'error', ... });
      },
    });
  });
}
```

---

### Phase 3: 배너 광고 크기 수정

#### 3-1. 최소 높이 지정

```typescript
// src/components/ads/BannerAd.tsx
<div
  ref={containerRef}
  className={cn(
    'w-full overflow-hidden rounded-xl',
    isRendered ? 'min-h-[80px]' : 'min-h-0',
    className
  )}
/>
```

#### 3-2. 광고 영역 배경색 추가
- 로딩 중/렌더 전: 배경색 표시하여 영역 확보
- 렌더 후: SDK가 관리하는 광고 노출

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/usePremiumAction.ts` | **신규** - 프리미엄 체크 + 광고 + fallback 통합 훅 |
| `src/app/[locale]/fridge/page.tsx` | PremiumGate 제거, handleSubmit에 usePremiumAction 적용 |
| `src/app/[locale]/shopping/page.tsx` | PremiumGate 제거, fetchRecommendations/addItem에 적용 |
| `src/app/[locale]/recipes/page.tsx` | PremiumGate 제거, 검색/조회에 적용 |
| `src/app/[locale]/nutrition/page.tsx` | PremiumGate 제거, 분석 실행에 적용 |
| `src/lib/apps-in-toss/ads.ts` | loadRewardedAd 타임아웃 추가 |
| `src/hooks/useAppsInTossAds.ts` | 에러 메시지 개선 |
| `src/components/ads/BannerAd.tsx` | 최소 높이 80px, 배경색 추가 |
| `src/hooks/usePremium.ts` | PREMIUM_FEATURES 조정 (필요 시) |
| `src/messages/*.json` | 광고 관련 i18n 키 추가 |

---

## 검증 항목

- [ ] 비프리미엄 사용자가 각 페이지에 자유롭게 접근 가능
- [ ] 핵심 기능 실행 시 광고 시청 팝업 노출
- [ ] 광고 시청 완료 후 기능 정상 실행
- [ ] 광고 로드 실패 시 PremiumModal로 fallback
- [ ] 프리미엄 사용자는 광고 없이 즉시 실행
- [ ] 배너 광고 최소 80px 높이로 노출
- [ ] 토스 앱 WebView 환경에서 보상형 광고 정상 노출
