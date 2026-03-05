# 토스 앱인토스 개발 인수인계 - 아키텍처 & 삽질 노하우

MealKeeper 프로젝트에서 얻은 실전 경험 정리. 토스 공식 문서에 없는 내용 위주.

---

## 1. 핵심 멘탈 모델

**토스 앱인토스 = 정적 빌드 파일(.ait)을 토스에 업로드하는 것**

- Vercel 같은 서버 호스팅이 아님
- Next.js API Route (서버사이드) 사용 불가
- 서버 로직은 전부 **Supabase Edge Function** (Deno) 으로 처리
- `next.config.mjs`에 반드시 `output: 'export'`, `trailingSlash: true` 설정

### 앱 실행 Origin (Edge Function CORS에 반드시 추가)

| 환경 | Origin |
|------|--------|
| 프로덕션 | `https://{appName}.apps.tossmini.com` |
| QR 테스트 | `https://{appName}.private-apps.tossmini.com` |
| 로컬 개발 | `http://localhost:3000` |

> `appName`은 `granite.config.ts`의 `appName` 값

---

## 2. SPA 라우팅 문제 (가장 중요한 삽질)

### 문제
토스 WebView는 **모든 URL에 대해 root index.html을 서빙**한다 (SPA fallback).
Next.js static export는 라우트별로 다른 HTML을 생성한다.
-> root에서 잘못된 RSC payload가 로드되면 hydration 에러 발생.

### 해결: fix-root-html.mjs
1. `ko/index.html`을 root `index.html`로 복사
2. `<head>`에 URL 정규화 스크립트 주입
3. React hydration 후 `DeepLinkHandler` 컴포넌트가 실제 경로로 라우팅

```javascript
// 주입되는 스크립트 핵심 로직
var p = window.location.pathname;
if (p === '/' || p === '/index.html') {
  history.replaceState(null, '', '/ko/');
} else if (p !== '/ko/' && p !== '/ko/index.html') {
  window.__MK_ACTUAL_PATH__ = p;  // 실제 경로 저장
  history.replaceState(null, '', '/ko/');  // hydration 호환 URL로 변경
}
```

```typescript
// DeepLinkHandler.tsx - hydration 후 실제 경로로 이동
useEffect(() => {
  const actualPath = (window as any).__MK_ACTUAL_PATH__;
  if (actualPath) {
    delete (window as any).__MK_ACTUAL_PATH__;
    router.replace(actualPath);
  }
}, [router]);
```

### document.write() 절대 금지!
`document.write()`를 쓰면 **토스 SDK 브릿지가 파괴**된다.
토스 WebView가 페이지 로드 시 `window.ReactNativeWebView.postMessage()` 브릿지를 주입하는데,
`document.write()`가 DOM을 교체하면서 브릿지가 사라진다.
반드시 `history.replaceState()`만 사용.

---

## 3. mTLS 인증서 삽질 (가장 오래 걸린 부분)

토스 Partner API는 mTLS(상호 TLS) 인증을 요구한다.

### PEM 저장 문제
Supabase secrets에 PEM을 그대로 저장하면 **개행이 깨진다**.
Base64로 인코딩 후 저장하고, 런타임에 디코딩해야 한다.

```bash
# PEM -> Base64 인코딩해서 저장
base64 -i cert.pem | tr -d '\n' | pbcopy
npx supabase secrets set APPS_IN_TOSS_MTLS_CERT=<값>
```

### fixPem 함수 (필수)
```typescript
function fixPem(raw: string): string {
  let pem = raw.trim();
  // Base64 이중 인코딩 감지 (LS0t = "---")
  if (pem.startsWith('LS0t')) {
    try { pem = atob(pem); } catch { }
  }
  // 리터럴 \n -> 실제 개행
  pem = pem.replace(/\\n/g, '\n').replace(/\\r/g, '').trim();
  // 이미 정상 PEM이면 반환
  if (pem.startsWith('-----BEGIN') && pem.includes('\n')) return pem;
  // PEM 재구성 (헤더/푸터 + 64자 줄바꿈)
  // ... (전체 코드는 supabase/functions/auth-toss/index.ts 참조)
}
```

### Deno mTLS 클라이언트 (1.x/2.x 호환)
```typescript
const httpClient = (Deno as any).createHttpClient({
  cert: fixPem(rawCert),      // Deno 2.x
  key: fixPem(rawKey),
  certChain: fixPem(rawCert), // Deno 1.x (호환용)
  privateKey: fixPem(rawKey),
});
const response = await fetch(url, { ...options, client: httpClient } as any);
```

### 삽질 히스토리

| 에러 | 원인 | 해결 |
|------|------|------|
| `CertificateRequired` | Deno 1.x/2.x 파라미터명 다름 | 양쪽 파라미터 다 전달 |
| `No certificates found` | PEM `\n`이 리터럴로 저장됨 | `replace(/\\n/g, '\n')` |
| `No keys found` | Base64 이중 인코딩 | `LS0t` 감지 후 `atob()` |
| `Failed to get user info` | Toss API 응답 래핑 구조 | `data.success?.userKey ?? data.userKey` |

---

## 4. 토스 OAuth2 인증 플로우

```
1. 클라이언트: appLogin() → 토스 네이티브 인증
2. { authorizationCode, referrer } 반환
3. Edge Function (auth-toss) 호출:
   a. POST /oauth2/generate-token → { accessToken, refreshToken }
   b. GET /oauth2/login-me → { userKey } (영구 식별자)
   c. userKey → deterministic email/password 생성
   d. Supabase signIn or createUser
   e. 세션 토큰 반환
4. 클라이언트: supabase.auth.setSession()
```

### 주의사항
- **Toss API 응답 형식**: `{ resultType: "SUCCESS", success: { accessToken, userKey } }` 래핑됨
- 신규 유저 생성 후 즉시 로그인 시도하면 실패할 수 있음 → **200ms 딜레이 + 1회 재시도** 필요
- 로그인 전에 **이전 세션을 반드시 정리** (auth-cleanup.ts)
- `appLogin()` SDK 호출 시 "signal is aborted" 에러 → **500ms 후 1회 재시도** 로직 추가

---

## 5. `granite build` (pnpm 환경 이슈)

### 문제
pnpm strict mode에서 `npx granite build` 실행 시
`@granite-js/react-native`의 `granite` 바이너리가 선택되어 RN 빌드를 시도함.

### 해결
```json
{
  "build:ait": "node node_modules/@apps-in-toss/web-framework/bin.js build"
}
```
web-framework의 bin.js를 직접 호출한다. `@apps-in-toss/cli`도 직접 의존성으로 추가해야 함.

### Windows EPERM 문제
`out/` 디렉토리 삭제 시 Windows에서 EPERM 에러 발생.
`prebuild:ait` 스크립트로 미리 정리:
```json
{
  "prebuild:ait": "node -e \"const fs=require('fs');const p='out';if(fs.existsSync(p)){fs.rmSync(p,{recursive:true,force:true})}\""
}
```

---

## 6. 토스 WebView에서 안 되는 것들

| 안 되는 것 | 대안 |
|-----------|------|
| `document.write()` | `history.replaceState()` |
| `html-to-image` 라이브러리 | **Canvas API 직접 렌더링** |
| `<a download>` 파일 다운로드 | `saveBase64Data()` SDK |
| Next.js Image 최적화 | `images: { unoptimized: true }` |
| Server-side API Routes | Supabase Edge Function |
| `intoss://` 딥링크 (출시 전) | `intoss-private://` |

### 이미지 캡처/저장 패턴
```typescript
// Canvas API로 직접 렌더링 (html-to-image 안 됨)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
// ... 직접 그리기

// 파일 저장 (토스 환경)
import { saveBase64Data } from '@apps-in-toss/web-framework';
const base64 = canvas.toDataURL('image/png').split(',')[1];
await saveBase64Data({ data: base64, fileName: 'image.png', mimeType: 'image/png' });
```

---

## 7. 디버그 빌드

```bash
AIT_DEBUG=true pnpm build:ait
```

- root index.html이 **진단 페이지**로 대체됨 (환경 정보, fetch 테스트, UA 확인)
- 모든 HTML에 **JS 에러 오버레이** 주입됨
- 토스 앱 WebView에서 문제 파악할 때 필수

---

## 8. CORS 디버깅

### "Failed to fetch" (status: null) = 거의 100% CORS 문제

Edge Function이 내부 에러로 크래시하면 CORS 헤더 없는 응답이 돌아오고,
브라우저는 이를 CORS 에러로 처리한다.

### 확인 방법
1. **Supabase Dashboard > Functions > Logs** 에서 실제 에러 확인
2. preflight 테스트:
```bash
curl -s -D - -X OPTIONS "<supabase-url>/functions/v1/<function>" \
  -H "Origin: https://{appName}.private-apps.tossmini.com" \
  -H "Access-Control-Request-Method: POST" | grep "Allow-Origin"
```

### 동적 CORS 패턴 (정적 `*` 사용 금지)
```typescript
function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // 토스 WebView는 Origin 없이 요청할 수 있음
  return ALLOWED_ORIGINS[0];
}
```

---

## 9. 토스 검수 체크리스트

| 항목 | 설명 |
|------|------|
| 핀치줌 비활성화 | viewport `user-scalable=no` |
| 44px 터치 영역 | 모든 버튼/링크 최소 44x44px |
| 이용약관 페이지 | 필수 (Terms of Service) |
| 사업자 정보 | 대표자/사업자번호/연락처 |
| AI 콘텐츠 고지 | AI 생성 콘텐츠에 명시 |
| 연결 끊기 콜백 | `auth-toss-disconnect` 웹훅 구현 (JWT 검증 비활성화) |

---

## 10. 뒤로가기 핸들러

토스 네이티브 뒤로가기 버튼은 `backEvent` 이벤트로 전달된다.

```typescript
import { graniteEvent, closeView } from '@apps-in-toss/web-bridge';

graniteEvent.addEventListener('backEvent', {
  onEvent: async () => {
    const isHome = /^\/[a-z]{2}\/?$/.test(pathname);
    if (isHome) {
      await closeView(); // 미니앱 종료
    } else {
      window.history.back();
    }
  },
});
```

---

## 11. Edge Function 배포 주의

```bash
# 일반 함수
npx supabase functions deploy auth-toss

# 토스 웹훅 (JWT 검증 비활성화 필수!)
npx supabase functions deploy auth-toss-disconnect --no-verify-jwt
```

- 웹훅 함수에는 반드시 `--no-verify-jwt` 옵션
- 배포 후 **CORS preflight 테스트** 필수
- `supabase link --project-ref {ref}` 프로젝트 링크 확인

---

## 12. 환경별 딥링크 스킴

| 환경 | 스킴 |
|------|------|
| 정식 출시 후 | `intoss://{appName}/path` |
| 테스트 (출시 전) | `intoss-private://appsintoss?_deploymentId={id}` |

- `intoss://`는 앱이 정식 출시된 후에만 동작
- 테스트 시 `.ait` 업로드할 때마다 새 `deploymentId` 발급됨
