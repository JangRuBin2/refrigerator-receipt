# 토스 앱인토스 개발 인수인계 - SDK & Supabase 패턴

---

## 1. SDK 환경 감지

```typescript
export function isAppsInTossEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('toss') || ua.includes('appintoss');
}
```

모든 SDK 호출은 `isAppsInTossEnvironment()` 체크 후 사용. 웹 브라우저에서 SDK 호출하면 에러.

---

## 2. SDK import 패턴

```typescript
// 기본 SDK (로그인, 공유, 파일 저장)
import { appLogin, saveBase64Data, getTossShareLink, share } from '@apps-in-toss/web-framework';

// 네이티브 이벤트 (뒤로가기, 앱 종료)
import { graniteEvent, closeView } from '@apps-in-toss/web-bridge';

// IAP는 dynamic import (토스 환경에서만 사용)
const { IAP } = await import('@apps-in-toss/web-framework');
```

### SDK 통신 방식
내부적으로 `window.ReactNativeWebView.postMessage()` 브릿지 사용.
`window.AppsInToss` 같은 전역 객체는 존재하지 않음.

---

## 3. IAP (인앱결제) 패턴

SDK의 IAP API는 **이벤트 콜백 기반**이라 Promise로 래핑해야 사용하기 편하다.

```typescript
export function createOneTimePurchaseOrder(
  sku: string,
  onGrantProduct: (orderId: string) => Promise<boolean>
): Promise<IapPurchaseResult> {
  return new Promise(async (resolve) => {
    const { IAP } = await import('@apps-in-toss/web-framework');
    IAP.createOneTimePurchaseOrder({
      options: {
        sku,
        processProductGrant: async ({ orderId }) => {
          // 서버에서 구독 활성화 후 결과 반환
          return onGrantProduct(orderId);
        },
      },
      onEvent: (event) => resolve({ type: 'success', orderId: event.data.orderId, sku }),
      onError: (error) => resolve({ type: 'error', errorCode: error.code, errorMessage: error.message }),
    });
  });
}
```

### IAP 서버 검증 (iap-activate Edge Function)
1. 클라이언트에서 `processProductGrant` 콜백 호출됨
2. Edge Function으로 `orderId`, `sku`, `tossUserKey` 전달
3. **Toss IAP API로 주문 검증** (mTLS, status === 'PAID' or 'COMPLETED')
4. 기존 구독이 있으면 만료일부터 연장, 없으면 현재부터 연장
5. `subscriptions` 테이블 upsert

### 미결 주문 복구
앱 시작 시 `IAP.getPendingOrders()`로 미완료 주문 조회 → 자동 완료 처리.
결제는 됐는데 서버 검증이 실패한 경우를 처리한다.

---

## 4. 광고 SDK 패턴

### GoogleAdMob (보상형/전면형)
이벤트 콜백 기반 → Promise 래핑 필수.

```typescript
import { GoogleAdMob } from '@apps-in-toss/web-framework';

// 로드
GoogleAdMob.loadAppsInTossAdMob({
  options: { adGroupId },
  onEvent: (event) => { /* event.type === 'loaded' */ },
  onError: (error) => { /* 로드 실패 */ },
});

// 표시 (보상형)
GoogleAdMob.showAppsInTossAdMob({
  options: { adGroupId },
  onEvent: (event) => {
    // 'userEarnedReward' → 보상 지급
    // 'dismissed' → 광고 닫힘
    // 'failedToShow' → 표시 실패
  },
});
```

### TossAds (배너)
```typescript
import { TossAds } from '@apps-in-toss/web-framework';

TossAds.initialize({ callbacks: { onInitialized: () => {}, onInitializationFailed: () => {} } });
TossAds.attach(adGroupId, targetElement, { theme: 'light', callbacks: { ... } });
// 정리: TossAds.destroyAll();
```

### 테스트용 광고 ID
```
전면형: ait-ad-test-interstitial-id
보상형: ait-ad-test-rewarded-id
배너(리스트): ait-ad-test-banner-id
배너(피드): ait-ad-test-native-image-id
```

> 실제 광고 ID로 테스트하면 정책 위반. 반드시 테스트 ID 사용.

---

## 5. Supabase Edge Function 구조

```
supabase/functions/
  _shared/
    cors.ts         # CORS 헤더 (동적 origin 매칭)
    supabase.ts     # createAdminClient() (service role)
    gemini.ts       # Gemini API 래퍼
    types.ts        # 공유 타입
  auth-toss/        # OAuth2 인증
  iap-activate/     # IAP 검증 & 활성화
  receipts-scan/    # OCR 스캔
  recipes-ai-generate/  # AI 레시피
  ...
```

### Edge Function 기본 패턴
```typescript
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  // 1. CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 2. 인증 확인 (JWT가 있는 경우)
    const authHeader = req.headers.get('Authorization');
    // ... supabase.auth.getUser()

    // 3. 비즈니스 로직

    // 4. 응답 (CORS 헤더 필수!)
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
```

> 에러 응답에도 CORS 헤더를 반드시 포함해야 한다! 없으면 클라이언트에서 "Failed to fetch" CORS 에러로 보임.

---

## 6. 클라이언트 -> Edge Function 호출 패턴

```typescript
// src/lib/api/edge.ts
export async function callEdgeFunction(functionName: string, options?: {
  method?: string;
  body?: unknown;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`;
  const response = await fetch(url, {
    method: options?.method || 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  // 안전한 JSON 파싱 (Edge Function 크래시 시 HTML 응답 올 수 있음)
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Edge function error: ${text.slice(0, 200)}`);
  }
}
```

---

## 7. 상태 관리 (Zustand)

```typescript
// Optimistic update 패턴
// 1. 로컬 Zustand 상태 즉시 업데이트 (빠른 UI 반응)
// 2. 백그라운드에서 DB 동기화
// 3. DB 실패 시 silent fail (다음 앱 로드 시 DB에서 복구)

const addIngredient = (ingredient) => {
  set((state) => ({ ingredients: [...state.ingredients, ingredient] }));
  // 비동기 DB sync (실패해도 UI 블로킹 안 함)
  if (get()._dbSyncEnabled) {
    createIngredientApi(ingredient).catch(() => {});
  }
};
```

- `localStorage` persist (`fridge-mate-storage` 키)
- `_dbSyncEnabled`: 로그인 상태일 때만 DB 동기화
- 로그아웃 시 `auth-cleanup.ts`로 모든 클라이언트 데이터 정리

---

## 8. i18n 설정 (next-intl + static export)

```typescript
// src/i18n/routing.ts
export const locales = ['ko', 'en', 'ja', 'zh'] as const;
export const defaultLocale = 'ko';

// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
```

모든 사용자 노출 텍스트는 `src/messages/{locale}.json`에 정의.
`useTranslations('Namespace')` 훅으로 사용.

---

## 9. SSR -> Static Export 전환 시 주의점

MealKeeper에서 SSR -> Static Export로 전환한 경험 기반:

| SSR 코드 | Static Export 대체 |
|-----------|-------------------|
| `cookies()` from next/headers | 클라이언트 `supabase.auth.getSession()` |
| `middleware.ts` | 클라이언트 `AuthGuard` 컴포넌트 |
| `getServerSideProps` | 클라이언트 `useEffect` + fetch |
| `src/app/robots.ts` | `public/robots.txt` 정적 파일 |
| `next/image` 최적화 | `images: { unoptimized: true }` |
| API Routes | Supabase Edge Function |

### RLS (Row Level Security) 필수
서버 API가 없으므로 클라이언트가 Supabase에 직접 접근한다.
모든 테이블에 RLS 정책을 반드시 설정해야 한다.

```sql
-- 예: 본인 데이터만 접근
CREATE POLICY "Users can only access own data"
  ON ingredients FOR ALL
  USING (auth.uid() = user_id);
```

---

## 10. 공유 링크 패턴

```typescript
import { getTossShareLink, share } from '@apps-in-toss/web-framework';

// 딥링크 생성
const deepLink = `intoss://${appName}/${locale}/recipe?id=${recipeId}`;
const ogImageUrl = 'https://...'; // 1200x600, https 필수

// 공유 링크 생성 & 공유
const tossLink = await getTossShareLink(deepLink, ogImageUrl);
await share({ message: tossLink });
```

### OG 이미지
- 크기: 1200 x 600px
- URL: 반드시 `https://` 절대 경로
- 호스팅: Supabase Storage public 버킷에 수동 업로드 권장

---

## 11. 새 프로젝트 시작 시 최소 설정

```bash
# 1. 프로젝트 생성
pnpm create next-app --typescript
pnpm add @apps-in-toss/web-framework @apps-in-toss/cli
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add next-intl zustand zod

# 2. next.config.mjs 필수 설정
# output: 'export', trailingSlash: true, images: { unoptimized: true }

# 3. granite.config.ts 생성 (앱인토스 설정)

# 4. fix-root-html.mjs 복사 (SPA 라우팅 fix)

# 5. supabase/functions/_shared/cors.ts 설정 (origin 목록)

# 6. BackButtonHandler, DeepLinkHandler 컴포넌트 추가

# 7. SDK 래퍼 구현 (환경 감지, OAuth, IAP 등)
```

---

## 12. 참고 링크

- 토스 개발자센터: https://developers-apps-in-toss.toss.im/
- 토스 콘솔: https://apps-in-toss.toss.im/
- 미니앱 출시 가이드: https://developers-apps-in-toss.toss.im/development/deploy.html
- WebView 디버깅: https://developers-apps-in-toss.toss.im/learn-more/debugging-webview.md
