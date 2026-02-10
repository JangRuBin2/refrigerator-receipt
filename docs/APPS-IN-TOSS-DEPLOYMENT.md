# Apps-in-Toss 배포 가이드

MealKeeper를 토스 앱인토스(Apps-in-Toss) 플랫폼에 배포하면서 겪은 설정과 유의사항을 정리한 문서입니다.

---

## 1. 아키텍처 개요

```
[토스 앱 (네이티브)]
  └── WebView
       └── 우리 웹앱 (Static HTML/JS)
            ├── @apps-in-toss/web-framework (SDK)
            │    └── @apps-in-toss/web-bridge
            │         └── @apps-in-toss/bridge-core
            │              └── ReactNativeWebView.postMessage()
            └── Supabase Edge Functions (서버)
                 └── Toss Partner API (mTLS)
```

### 핵심 포인트
- SDK는 **`window.AppsInToss`가 아님** — `@apps-in-toss/web-framework`에서 import
- 네이티브 통신: `window.ReactNativeWebView.postMessage()` + `window.__GRANITE_NATIVE_EMITTER`
- 빌드 도구: `@apps-in-toss/cli` (`granite` CLI)
- 출력: `.ait` 파일 → 토스 콘솔에 수동 업로드

---

## 2. 프로젝트 설정

### granite.config.ts

```typescript
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'acorn',        // 토스 콘솔의 앱 이름과 일치해야 함
  brand: {
    displayName: '밀키퍼',
    icon: './public/icon-512.png',
    primaryColor: '#3182F6',
  },
  permissions: [],
  webViewProps: { type: 'partner' },
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'next build && node scripts/fix-root-html.mjs',
    },
  },
  outdir: 'out',
});
```

### next.config.mjs 필수 설정

```javascript
output: 'export',       // 정적 HTML 출력 (필수)
trailingSlash: true,     // URL 끝에 / 추가 (필수)
images: { unoptimized: true },  // static export에서 이미지 최적화 불가
```

### package.json 스크립트

```json
{
  "build": "next build && node scripts/fix-root-html.mjs",
  "build:ait": "npx granite build",
  "build:ait:debug": "AIT_DEBUG=true npx granite build"
}
```

---

## 3. SPA 라우팅 (중요!)

### 문제
토스 WebView는 **모든 경로에 대해 root `index.html`을 서빙** (SPA fallback). Next.js의 `[locale]` 라우팅과 충돌.

### 해결: `scripts/fix-root-html.mjs`

빌드 후 `ko/index.html`을 root `index.html`로 복사하고, URL 정규화 스크립트를 주입:

```javascript
// 빌드 후 실행되는 스크립트
// 1. ko/index.html → index.html 복사
// 2. URL 정규화 스크립트 주입:
//    - / 또는 /index.html → history.replaceState('/ko/')
//    - 다른 경로 → window.__MK_ACTUAL_PATH__에 저장 후 /ko/로 이동
// 3. DeepLinkHandler 컴포넌트가 hydration 후 실제 경로로 네비게이션
```

### DeepLinkHandler 컴포넌트

```typescript
// src/components/layout/DeepLinkHandler.tsx
// hydration 후 window.__MK_ACTUAL_PATH__가 있으면 해당 경로로 router.replace()
```

### 토스 WebView 환경 정보
- Origin: `https://acorn.private-apps.tossmini.com`
- Protocol: `https:`
- 모든 경로가 root index.html로 서빙됨

---

## 4. document.write() 절대 금지!

**`document.write()`를 사용하면 토스 SDK 브릿지가 파괴됩니다.**

토스 WebView는 페이지 로드 시 SDK 브릿지를 초기화하는데, `document.write()`가 DOM을 완전히 교체하면서 브릿지가 사라집니다. 초기에 SPA 라우팅을 `document.write()`로 구현했다가 SDK를 찾지 못하는 문제가 발생했습니다.

해결: `history.replaceState()`로 URL만 변경하고, React hydration 후 네비게이션 처리.

---

## 5. 토스 로그인 (OAuth2 Flow)

### 클라이언트 (SDK)

```typescript
import { appLogin } from '@apps-in-toss/web-framework';

const result = await appLogin();
// result: { authorizationCode: string, referrer: string }
```

### 전체 Flow

```
1. 클라이언트: appLogin() 호출 → 토스 네이티브 인증 화면
2. 사용자 동의 → { authorizationCode, referrer } 반환
3. 클라이언트 → Supabase Edge Function (auth-toss)로 전달
4. Edge Function:
   a. POST /api-partner/v1/apps-in-toss/user/oauth2/generate-token
      → { accessToken, refreshToken }
   b. GET /api-partner/v1/apps-in-toss/user/oauth2/login-me
      → { userKey } (영구 식별자)
   c. userKey로 Supabase 유저 생성/로그인
   d. Supabase 세션 토큰 반환
5. 클라이언트: supabase.auth.setSession() 으로 세션 설정
```

### Toss API 응답 형식

```json
{
  "resultType": "SUCCESS",
  "success": {
    "accessToken": "...",
    "userKey": "835914608"
  }
}
```

> `data.success.userKey` 형태로 래핑됨 — `data.userKey`가 아님!

---

## 6. mTLS 인증서 (가장 많이 삽질한 부분)

토스 Partner API는 **mTLS (상호 TLS) 인증**을 요구합니다.

### 인증서 발급
1. 토스 Partner Console → mTLS 인증서 탭
2. 인증서(cert.pem)와 개인키(key.pem) 다운로드

### Supabase 시크릿 저장 (Base64 인코딩!)

```bash
# PEM 파일을 Base64로 인코딩해서 저장
# macOS:
base64 -i cert.pem | tr -d '\n' | pbcopy
npx supabase secrets set APPS_IN_TOSS_MTLS_CERT=<붙여넣기>

base64 -i key.pem | tr -d '\n' | pbcopy
npx supabase secrets set APPS_IN_TOSS_MTLS_KEY=<붙여넣기>
```

### Edge Function에서 PEM 복원

Supabase 시크릿은 PEM을 그대로 저장하면 개행이 깨집니다. Base64로 인코딩 후 저장하고, 런타임에 디코딩해야 합니다:

```typescript
function fixPem(raw: string): string {
  let pem = raw.trim();

  // Base64로 이중 인코딩된 경우 (LS0t = "---")
  if (pem.startsWith('LS0t')) {
    try { pem = atob(pem); } catch { /* not base64 */ }
  }

  // 리터럴 \n을 실제 개행으로 변환
  pem = pem.replace(/\\n/g, '\n').replace(/\\r/g, '').trim();

  // 이미 정상적인 PEM이면 그대로 반환
  if (pem.startsWith('-----BEGIN') && pem.includes('\n')) {
    return pem;
  }

  // PEM 헤더/푸터 재구성 (필요시)
  // ...
}
```

### Deno에서 mTLS 클라이언트

```typescript
const httpClient = (Deno as any).createHttpClient({
  cert: fixPem(rawCert),     // Deno 2.x API
  key: fixPem(rawKey),
  certChain: fixPem(rawCert), // Deno 1.x API (호환용)
  privateKey: fixPem(rawKey),
});

const response = await fetch(url, { ...options, client: httpClient } as any);
```

### 삽질 히스토리 & 해결

| 에러 | 원인 | 해결 |
|------|------|------|
| `Invalid URL: 'APPS_IN_TOSS_API_URL/...'` | 시크릿 값이 URL이 아닌 변수명 그대로 저장 | `npx supabase secrets set` 올바른 값으로 재설정 |
| `CertificateRequired` | Deno 1.x API 파라미터명 불일치 | `cert`/`key` (Deno 2.x) + `certChain`/`privateKey` (1.x) 둘 다 전달 |
| `No certificates found in certificate data` | PEM의 `\n`이 리터럴 문자열로 저장됨 | `replace(/\\n/g, '\n')` 적용 |
| `No keys found in key data` | PEM이 **Base64로 이중 인코딩**됨 → fixPem이 CERTIFICATE로 잘못 감쌈 | `LS0t`로 시작하면 `atob()` 디코딩 먼저 수행 |
| `failed to fetch` (500) | fixPem의 RSA 키 타입 감지 로직 버그로 헤더/푸터 불일치 | 헤더 제거 전에 키 타입을 먼저 감지 |
| `Failed to get user info` | Toss API 응답이 `{ success: { userKey } }` 래핑 | `data.success?.userKey ?? data.userKey` |

---

## 7. Supabase Edge Functions

### 배포 명령

```bash
# 개별 배포 (--no-verify-jwt 필수: 토스에서 직접 호출)
npx supabase functions deploy auth-toss --no-verify-jwt

# 전체 배포
npx supabase functions deploy --no-verify-jwt
```

### 필수 시크릿

```bash
npx supabase secrets set APPS_IN_TOSS_API_URL=https://apps-in-toss-api.toss.im
npx supabase secrets set APPS_IN_TOSS_MTLS_CERT=<base64-encoded-cert>
npx supabase secrets set APPS_IN_TOSS_MTLS_KEY=<base64-encoded-key>
npx supabase secrets set TOSS_AUTH_SECRET=<random-secret>
npx supabase secrets set GOOGLE_GEMINI_API_KEY=<gemini-key>
npx supabase secrets set GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### CORS 설정

Edge Function은 토스 WebView 오리진에서 직접 호출됩니다:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## 8. 빌드 & 배포 플로우

```
npm run build:ait
  │
  ├── 1. next build (정적 HTML 출력 → out/)
  ├── 2. scripts/fix-root-html.mjs (root index.html 생성)
  └── 3. granite build (out/ → .ait 파일 패키징)

.ait 파일 → 토스 Partner Console에 수동 업로드
```

### 디버그 빌드

```bash
npm run build:ait:debug
# AIT_DEBUG=true → 진단 페이지 + 에러 오버레이 주입
```

---

## 9. 토스 검수 체크리스트

| 항목 | 상태 | 설명 |
|------|------|------|
| 핀치줌 비활성화 | 완료 | `user-scalable=no` viewport meta |
| 44px 터치 영역 | 완료 | 모든 버튼/링크에 `min-h-[44px] min-w-[44px]` |
| 다크 모드 | 완료 | Tailwind CSS dark: 클래스 |
| 이용약관 | 완료 | `/[locale]/terms` 페이지 |
| 사업자 정보 | 완료 | 설정 페이지에 대표자/사업자번호/연락처 |
| AI 콘텐츠 고지 | 완료 | AI 생성 레시피에 표시 |
| 연결 끊기 콜백 | 완료 | `auth-toss-disconnect` Edge Function |

---

## 10. 자주 발생하는 문제

### "토스 SDK를 찾을 수 없음"
- `window.AppsInToss`는 존재하지 않음
- `@apps-in-toss/web-framework`에서 import해야 함
- `document.write()` 사용 시 SDK 브릿지 파괴됨

### Edge Function에서 "failed to fetch"
- Edge Function 내부 에러로 크래시 → CORS 헤더 없는 응답
- Supabase Dashboard → Functions → Logs에서 에러 확인
- `callEdgeFunction`에서 `response.text()` → `JSON.parse()` 패턴 사용하여 안전 처리

### 로그인 후 "Guest User" 표시
- `auth-toss`에서 `user_metadata`에 `name` 필드를 안 넣음
- `profiles` 테이블에서 이름을 조회하거나, `auth_provider === 'toss'`이면 "토스 사용자" 표시

### 하단 네비게이션 바에 콘텐츠 잘림
- 페이지 콘텐츠에 `pb-24` (96px) 하단 패딩 추가
- 레이아웃의 `<main className="pb-20">`과 합산

---

## 11. 참고 링크

- [토스 Partner Console](https://console.apps-in-toss.toss.im/)
- [토스 개발자 문서](https://developers-apps-in-toss.toss.im/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Toss Partner API](https://apps-in-toss-api.toss.im) (mTLS 필요)
