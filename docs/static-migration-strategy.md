# MealKeeper 정적 앱 전환 전략

## Context

앱인토스 출시 승인 완료. `.ait` 번들 업로드가 필요하나, 현재 Next.js SSR 앱은 `granite build`로 번들링 불가 (`@granite-js/react-native`가 RN 빌드만 지원). 앱인토스 표준 방식은 정적 파일을 `.ait`로 패키징하는 것이므로, SSR → 정적 앱(CSR)으로 전환한다.

## 현재 구조 vs 목표 구조

```
[현재] Client → Next.js API Routes (Vercel) → Supabase
[목표] Client → Supabase 직접 호출 (RLS) + Edge Functions (시크릿 필요 시)
```

## 전환 대상 분석 (25개 API Routes)

### A. 클라이언트 직접 호출로 전환 (13개) - RLS로 보호
| Route | 이유 |
|-------|------|
| `/api/ingredients` (GET/POST) | 단순 CRUD, user_id RLS |
| `/api/ingredients/[id]` (PUT/DELETE) | 단순 CRUD, user_id RLS |
| `/api/favorites` (GET/POST/DELETE) | 단순 CRUD, user_id RLS |
| `/api/recipes` (GET) | 공개 데이터 |
| `/api/recipes/random` (GET) | 공개 데이터 |
| `/api/recipes/taste` (POST) | 스코어링 로직 클라이언트 이동 |
| `/api/recipes/recommend` (GET) | 매칭 로직 클라이언트 이동 |
| `/api/recipes/ai-save` (POST) | insert with RLS |
| `/api/shopping` (GET/POST/PATCH/DELETE) | 단순 CRUD, user_id RLS |
| `/api/subscription` (GET) | user_id RLS |
| `/api/nutrition/report` (GET) | 데이터 집계, 클라이언트 연산 |
| `/api/receipts/ad-reward` (GET/POST) | event_logs RLS |
| `/api/auth/signout` | `supabase.auth.signOut()` 직접 호출 |

### B. Supabase Edge Functions로 이전 (11개) - 시크릿 키 필요
| Route | 시크릿 | Edge Function |
|-------|--------|---------------|
| `/api/auth/toss` | SERVICE_ROLE_KEY, TOSS_AUTH_SECRET | `auth-toss` |
| `/api/auth/toss/disconnect` | SERVICE_ROLE_KEY, TOSS_DISCONNECT_AUTH | `auth-toss-disconnect` |
| `/api/auth/delete-account` | SERVICE_ROLE_KEY | `auth-delete-account` |
| `/api/auth/callback` | Supabase 내장 OAuth로 대체 | 삭제 |
| `/api/receipts/scan` | GOOGLE_CLOUD_*, GEMINI_KEY | `receipts-scan` |
| `/api/recipes/ai-generate` | GEMINI_KEY | `recipes-ai-generate` |
| `/api/recipes/search` | YouTube/Google API keys | `recipes-search` |
| `/api/shopping/recommend` | GEMINI_KEY | `shopping-recommend` |
| `/api/nutrition/analyze` | GEMINI_KEY | `nutrition-analyze` |
| `/api/iap` | SERVICE_ROLE_KEY | `iap-activate` |
| `/api/iap/status` | SERVICE_ROLE_KEY | `iap-status` |
| `/api/crawl` | CRAWL_API_KEY (별도 관리) | `crawl` (관리자용) |

### 서버사이드 블로커 (삭제/대체 대상)
| 파일 | 문제 | 해결 |
|------|------|------|
| `src/middleware.ts` | `cookies()` 사용, static export 불가 | 클라이언트 AuthGuard 컴포넌트로 대체 |
| `src/lib/supabase/server.ts` | `cookies()` from next/headers | API Routes 제거 후 삭제 |
| `src/i18n/request.ts` | `getRequestConfig` 서버 전용 | 정적 메시지 import로 대체 |
| `src/app/[locale]/layout.tsx` | `getMessages()`, `setRequestLocale()` | 클라이언트 컴포넌트로 전환 |
| `src/app/robots.ts`, `src/app/sitemap.ts` | 동적 생성 | `public/`에 정적 파일로 대체 |

---

## Phase 0: 사전 준비 (리스크: LOW)

### 작업
1. 피처 브랜치 생성: `feat/static-export-migration`
2. Supabase Edge Functions 디렉토리 구조 생성
3. 클라이언트 데이터 서비스 레이어 (`src/lib/api/`) 스캐폴딩
4. 환경변수 추가: `NEXT_PUBLIC_SUPABASE_URL` (Edge Function 호출용, 이미 존재)

### 파일 생성
```
supabase/functions/
  _shared/cors.ts          # CORS 헤더 유틸
  _shared/auth.ts          # Supabase 클라이언트 생성 유틸
  _shared/gemini.ts        # Gemini API 공통 유틸

src/lib/api/
  ingredients.ts           # getIngredients, createIngredient, updateIngredient, deleteIngredient
  favorites.ts             # getFavorites, addFavorite, removeFavorite
  recipes.ts               # getRecipes, getRandomRecipes, scoreByTaste, getRecommended, saveAiRecipe
  shopping.ts              # getShoppingList, addItems, updateItem, deleteItem
  subscription.ts          # getSubscription
  nutrition.ts             # getNutritionReport
  scan.ts                  # scanReceipt (Edge Function 호출), adRewardStatus, claimAdReward
  auth.ts                  # tossLogin (Edge Function 호출), signOut, deleteAccount
  edge.ts                  # Edge Function 호출 공통 래퍼
```

### 검증
- 기존 `pnpm dev` 정상 동작 확인

---

## Phase 1: i18n + Auth 탈서버화 (리스크: MEDIUM)

### 1.1 i18n 정적 로딩 전환
- `src/i18n/request.ts` 삭제
- `src/i18n/messages.ts` 생성 (ko/en/ja/zh JSON 정적 import)
- `src/app/[locale]/layout.tsx`에서 `getMessages()` → `messages[locale]` 직접 사용
- `next.config.mjs`에서 `withNextIntl` 래퍼 제거

### 1.2 미들웨어 → 클라이언트 AuthGuard
- `src/middleware.ts` 삭제
- `src/components/layout/AuthGuard.tsx` 생성
  - `supabase.auth.getUser()`로 인증 확인
  - 미인증 시 `/{locale}/login`으로 리다이렉트
  - 공개 경로(`/login`, `/terms`) 예외 처리
- `layout.tsx`에서 `{children}`을 `<AuthGuard>`로 래핑

### 1.3 루트 리다이렉트
- `src/app/page.tsx` 생성 (localStorage에서 locale 읽어 `/{locale}`으로 리다이렉트)

### 1.4 SEO 파일 정적화
- `src/app/robots.ts` → `public/robots.txt`
- `src/app/sitemap.ts` → `public/sitemap.xml`

### 검증
- 4개 locale 모두 페이지 정상 렌더링
- 미인증 시 로그인 페이지 리다이렉트 동작
- `pnpm dev` 정상 동작

---

## Phase 2: Group A API Routes → 클라이언트 직접 호출 (리스크: MEDIUM)

### 2.1 데이터 서비스 레이어 구현
`src/lib/api/*.ts` 각 파일에서 `createClient()` (브라우저용)로 Supabase 직접 쿼리.

패턴:
```typescript
import { createClient } from '@/lib/supabase/client';

export async function getIngredients() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('user_id', user.id)
    .order('expiry_date', { ascending: true });
  if (error) throw error;
  return data;
}
```

### 2.2 페이지 컴포넌트 업데이트
`fetch('/api/...')` 호출을 `src/lib/api/` 함수 호출로 교체:

| 페이지 | 변경 |
|--------|------|
| `src/app/[locale]/fridge/page.tsx` | `fetch('/api/ingredients')` → `getIngredients()` |
| `src/app/[locale]/recommend/page.tsx` | `fetch('/api/recipes')` → `getRecipes()` 등 |
| `src/app/[locale]/shopping/page.tsx` | `fetch('/api/shopping')` → `getShoppingList()` 등 |
| `src/hooks/usePremium.ts` | `fetch('/api/subscription')` → `getSubscription()` |

### 2.3 Group A API 라우트 삭제 (13개 파일)

### 검증
- 모든 CRUD 동작 정상 (재료 추가/수정/삭제, 즐겨찾기, 쇼핑리스트)
- 다른 사용자 데이터 접근 불가 (RLS 검증)

---

## Phase 3: Group B API Routes → Supabase Edge Functions (리스크: HIGH)

### 3.1 Edge Function 공통 유틸 구현
- `_shared/cors.ts`: CORS 헤더
- `_shared/auth.ts`: `createSupabaseClient(authHeader)`, `createAdminClient()`
- `_shared/gemini.ts`: Gemini API 호출 공통 로직

### 3.2 Edge Function 구현 (11개)
각 Next.js API Route 로직을 Deno 런타임으로 포팅.

주요 차이점:
- `process.env` → `Deno.env.get()`
- `crypto.createHmac` → Web Crypto API
- `cookies()` → `Authorization: Bearer` 헤더
- `Buffer` → `Uint8Array` / `TextEncoder`

### 3.3 클라이언트 Edge Function 래퍼
`src/lib/api/edge.ts`: Bearer token 자동 첨부 + 에러 핸들링

### 3.4 OAuth 콜백 변경
- `/api/auth/callback` → Supabase 내장 OAuth 사용
- 로그인 페이지에서 `supabase.auth.signInWithOAuth({ redirectTo })` 사용
- 토스 콘솔 + Supabase 대시보드에서 콜백 URL 업데이트

### 3.5 Edge Function 배포
```bash
supabase functions deploy auth-toss
supabase secrets set TOSS_AUTH_SECRET=... GOOGLE_GEMINI_API_KEY=...
```

### 3.6 Group B API 라우트 삭제 (11개 파일)
- `src/app/api/` 디렉토리 전체 삭제
- `src/lib/supabase/server.ts` 삭제

### 검증
- 토스 로그인 플로우 E2E 테스트
- 영수증 OCR 스캔 동작
- AI 레시피 생성 동작
- IAP 결제 플로우 동작

---

## Phase 4: Static Export 활성화 (리스크: HIGH)

### 4.1 `next.config.mjs` 변경
```javascript
const nextConfig = {
  output: 'export',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
};
export default nextConfig;
```

### 4.2 `next/image` → unoptimized
모든 `<Image>` 컴포넌트에 `unoptimized` prop 추가 (또는 `<img>` 전환)

### 4.3 빌드 검증
```bash
pnpm build          # out/ 디렉토리에 정적 파일 생성
npx serve out       # 로컬에서 정적 서빙 테스트
```

### 검증
- `out/` 디렉토리에 ko/en/ja/zh 각 locale 페이지 존재
- 정적 서버에서 모든 기능 동작 확인

---

## Phase 5: .ait 번들 생성 및 앱인토스 배포 (리스크: MEDIUM)

### 5.1 `granite.config.ts` 업데이트
```typescript
export default defineConfig({
  appName: '밀키퍼',
  brand: { displayName: '밀키퍼', icon: './public/icon-512.png', primaryColor: '#3182F6' },
  permissions: [],
  web: {
    port: 3000,
    commands: { dev: 'next dev', build: 'next build' },
  },
  outdir: 'out',   // 정적 export 출력 디렉토리
});
```

### 5.2 `package.json` 스크립트 추가
```json
"build:ait": "next build",
"deploy:ait": "npx ait deploy"
```

### 5.3 번들 생성 및 배포
```bash
pnpm build:ait                    # out/ 생성
npx ait deploy --api-key {KEY}    # .ait 업로드
```

> `granite build`가 여전히 RN 빌드를 시도하는 경우, 앱인토스 콘솔에서 직접 업로드하거나 개발자 지원팀에 문의.

### 5.4 토스 콘솔 설정 업데이트
- 토스 OAuth disconnect 웹훅 URL → Edge Function URL로 변경
- IAP 콜백 URL 확인

### 검증
- 토스 앱 WebView에서 전체 E2E 테스트
- 로그인 → 영수증 스캔 → 레시피 추천 → 쇼핑리스트 → IAP 결제

---

## 듀얼 배포 전략 (마이그레이션 기간)

전환 기간 동안 Vercel과 앱인토스 동시 운영:

```typescript
// src/lib/api/edge.ts
const isInToss = typeof window !== 'undefined' &&
  navigator.userAgent.toLowerCase().includes('toss');

const getApiBase = (functionName: string) =>
  isInToss
    ? `${SUPABASE_URL}/functions/v1/${functionName}`
    : `/api/${functionName}`;
```

이를 통해 동일 코드베이스로 웹(Vercel) + 토스(정적) 모두 지원.

---

## 리스크 요약

| Phase | 리스크 | 핵심 우려 | 완화 방법 |
|-------|--------|-----------|-----------|
| 0 | LOW | 설정만, 기존 기능 영향 없음 | 피처 브랜치 |
| 1 | MEDIUM | i18n 시스템 변경 시 번역 깨질 수 있음 | 4개 locale 전체 테스트 |
| 2 | MEDIUM | RLS 정책 누락 시 데이터 노출 | 다중 사용자 테스트 |
| 3 | HIGH | Deno 런타임 차이, mTLS 호환성 | 점진적 배포, Vercel 폴백 유지 |
| 4 | HIGH | 숨은 SSR 의존성 | 빌드 후 정적 서버 테스트 |
| 5 | MEDIUM | granite build 도구 이슈 | 콘솔 직접 업로드 폴백 |
