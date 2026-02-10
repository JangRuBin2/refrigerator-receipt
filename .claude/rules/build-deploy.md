# Build & Deploy

## Architecture

MealKeeper는 Next.js SSR 앱으로 두 가지 환경에서 동작:
- **Vercel**: Next.js 서버 호스팅 (SSR + API Routes)
- **토스 앱인토스**: WebView로 Vercel URL 로딩 (SSR 지원됨)

> 토스 자체도 Next.js SSR 아키텍처를 사용함.
> WebView는 URL을 로딩하므로 SSR/CSR 무관하게 동작.

## Build Commands

```bash
pnpm dev           # Next.js dev server (port 3000)
pnpm build         # next build
pnpm lint          # next lint
```

## Apps-in-Toss SDK

- Package: `@apps-in-toss/web-framework`
- Config: `granite.config.ts`
- CLI: `ait` (init, deploy, token, migrate)

### granite.config.ts 설정

```typescript
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: '밀키퍼',
  brand: {
    displayName: '밀키퍼',
    icon: './public/icon-512.png',
    primaryColor: '#3182F6',
  },
  permissions: [],
  web: {
    host: 'https://refrigerator-receipt.vercel.app',
    port: 3000,
    commands: {
      dev: 'next dev',
      build: 'next build',
    },
  },
});
```

## .ait 번들 생성

`granite build` 정상 동작 확인됨 (2026-02, `@apps-in-toss/cli@1.9.4`).
이전 `pluginHooks` 에러는 해결됨.

```bash
pnpm build:ait          # npx granite build 실행
pnpm build:ait:debug    # AIT_DEBUG=true npx granite build
```

빌드 플로우:
1. `next build` + `fix-root-html.mjs` → `out/` 생성
2. RN 래퍼 번들 생성 (iOS/Android)
3. `out/` → `web/` + `app.json` 패키징
4. `acorn.ait` 생성 (deploymentId는 UUIDv7 자동 생성)

### 토스 콘솔 업로드

```bash
# API 키 등록 (최초 1회)
npx ait token add

# .ait 파일은 콘솔에서 직접 업로드
# 콘솔 > 워크스페이스 > 앱 > 앱 출시 > .ait 업로드
```

## Vercel Deployment

- main 브랜치 push 시 자동 배포
- Production URL: https://refrigerator-receipt.vercel.app

## Pre-Deploy Checklist

- [ ] `pnpm build` 성공
- [ ] 환경 변수 Vercel에 설정 완료
- [ ] CORS 헤더 확인 (토스 WebView 요청)
- [ ] 테스트/실제 환경 CORS 차이 검증
- [ ] IAP 샌드박스 테스트 완료
- [ ] OAuth 플로우 정상 동작 확인
- [ ] 번들 크기 100MB 이하

## Permissions (granite.config.ts)

필요 시 `permissions` 배열에 추가:

| Permission | Access |
|-----------|--------|
| clipboard | 'read' / 'write' |
| geolocation | 'access' |
| contacts | 'read' / 'write' |
| photos | 'read' / 'write' |
| camera | 'access' |

## References

- 앱인토스 개발자센터: https://developers-apps-in-toss.toss.im/
- 앱인토스 콘솔: https://apps-in-toss.toss.im/
- 미니앱 출시 가이드: https://developers-apps-in-toss.toss.im/development/deploy.html
- WebView 개발 가이드: https://developers-apps-in-toss.toss.im/tutorials/webview.html
- 토스 SSR 최적화: https://toss.tech/article/ssr-server
