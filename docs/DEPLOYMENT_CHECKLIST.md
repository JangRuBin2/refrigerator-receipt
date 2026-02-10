# 밀키퍼 앱인토스 배포 체크리스트

정적 앱 전환 완료 후, 실제 토스 앱 배포까지 남은 작업 목록.

참고 문서: https://developers-apps-in-toss.toss.im/development/test/toss.html

---

## 1단계: Supabase Edge Functions 배포

### 1-1. Supabase CLI 로그인 및 프로젝트 연결

```bash
npx supabase login
npx supabase link --project-ref jkyvgzfpxghywrfifhel
```

### 1-2. 시크릿 설정

기존 Vercel 환경변수를 Supabase Edge Functions 시크릿으로 등록한다.

```bash
npx supabase secrets set \
  TOSS_AUTH_SECRET=<값> \
  TOSS_DISCONNECT_AUTH=<값> \
  GOOGLE_GEMINI_API_KEY=<값> \
  GOOGLE_CLOUD_PROJECT_ID=<값> \
  GOOGLE_CLOUD_PRIVATE_KEY=<값> \
  GOOGLE_CLOUD_CLIENT_EMAIL=<값> \
  YOUTUBE_API_KEY=<값> \
  GOOGLE_CUSTOM_SEARCH_KEY=<값> \
  GOOGLE_CUSTOM_SEARCH_CX=<값> \
  TOSS_MTLS_CERT=<값> \
  TOSS_MTLS_KEY=<값> \
  TOSS_MTLS_CA=<값>
```

> 값은 Vercel Dashboard > Settings > Environment Variables에서 확인 가능

### 1-3. Edge Functions 일괄 배포 (10개)

```bash
npx supabase functions deploy auth-toss
npx supabase functions deploy auth-toss-disconnect
npx supabase functions deploy auth-delete-account
npx supabase functions deploy receipts-scan
npx supabase functions deploy recipes-ai-generate
npx supabase functions deploy recipes-search
npx supabase functions deploy shopping-recommend
npx supabase functions deploy nutrition-analyze
npx supabase functions deploy iap-activate
npx supabase functions deploy iap-status
```

### 1-4. Edge Functions 검증

Supabase Dashboard > Edge Functions에서 10개 함수 모두 Active 상태 확인.

- [ ] auth-toss
- [ ] auth-toss-disconnect
- [ ] auth-delete-account
- [ ] receipts-scan
- [ ] recipes-ai-generate
- [ ] recipes-search
- [ ] shopping-recommend
- [ ] nutrition-analyze
- [ ] iap-activate
- [ ] iap-status

---

## 2단계: CORS 설정

앱인토스 미니앱은 아래 도메인에서 실행된다. Edge Functions와 외부 API에 CORS를 허용해야 한다.

| 환경 | Origin 도메인 |
|------|--------------|
| 실제 서비스 | `https://밀키퍼.apps.tossmini.com` |
| QR 테스트 | `https://밀키퍼.private-apps.tossmini.com` |
| 기존 웹 | `https://refrigerator-receipt.vercel.app` |

### 확인 사항

- [ ] Edge Functions `_shared/cors.ts`에 위 도메인이 허용되어 있는지 확인
- [ ] Supabase Dashboard > Auth > URL Configuration에 리다이렉트 URL 추가
- [ ] appName에 한글이 들어가므로, 실제 도메인은 콘솔에서 확인 필요 (영문 slug일 수 있음)

---

## 3단계: 토스 개발자 콘솔 설정 변경

### 3-1. OAuth 웹훅 URL 변경

| 항목 | 기존 | 변경 |
|------|------|------|
| Disconnect 웹훅 | `https://refrigerator-receipt.vercel.app/api/auth/toss/disconnect` | `https://jkyvgzfpxghywrfifhel.supabase.co/functions/v1/auth-toss-disconnect` |

### 3-2. IAP 콜백 URL 확인

인앱 결제 콜백이 설정되어 있다면 Edge Function URL로 변경 필요.

### 3-3. 앱 정보 확인

콘솔에서 아래 항목이 정확한지 재확인:

- [ ] 앱 이름: 밀키퍼
- [ ] 아이콘 등록 여부
- [ ] 서비스 약관 URL
- [ ] 개인정보 처리방침 URL

---

## 4단계: .ait 번들 생성 및 업로드

### 4-1. 정적 빌드

```bash
pnpm build
```

빌드 결과: `out/` 디렉토리 (현재 약 5MB)

> 앱 번들 용량 제한: 압축 해제 기준 **100MB 이하**
> 대용량 리소스(이미지, 영상)는 외부 CDN에서 로드 권장

### 4-2. .ait 번들 업로드

**방법 A: CLI 배포 (권장)**

```bash
# API 키 발급: 콘솔 > 좌측 메뉴 "키" > API 키 생성
npx ait deploy --api-key {API_KEY}

# 또는 토큰 등록 후 반복 사용
npx ait token add
npx ait deploy
```

**방법 B: 콘솔 직접 업로드**

1. 앱인토스 콘솔 접속
2. 워크스페이스 선택 > 앱 선택 > 좌측 메뉴 "앱 출시"
3. `.ait` 파일 업로드
4. 업로드 완료 시 테스트 QR 코드 자동 생성

> `granite build` 또는 `npx ait deploy`가 동작하지 않을 경우 콘솔 직접 업로드로 우회

---

## 5단계: 샌드박스 테스트

실제 토스앱 테스트 전에 샌드박스에서 먼저 검증한다.

### 5-1. 샌드박스 앱 설치

| 플랫폼 | 지원 OS |
|--------|---------|
| Android | 7 이상 |
| iOS | 16 이상 |

앱인토스 콘솔에서 최신 샌드박스 앱을 다운로드한다.

### 5-2. 샌드박스 테스트 절차

1. 샌드박스 앱 설치 및 실행
2. 토스 비즈니스 계정으로 **개발자 로그인** (필수! 이것 없이는 토스 로그인 테스트 불가)
3. 워크스페이스에서 "밀키퍼" 앱 선택
4. 토스 인증 진행 (토스앱 푸시 알림으로 본인 인증)
5. `intoss://밀키퍼` 스킴으로 접속

### 5-3. 샌드박스에서 테스트 가능한 기능

| 기능 | 가능 여부 |
|------|----------|
| 토스 로그인 | O |
| 인앱 결제 (IAP) | O |
| 토스 페이 | O |
| 인앱 광고 | X (샌드박스 미지원) |
| 분석 | X (샌드박스 미지원) |

### 5-4. 샌드박스 테스트 체크리스트

- [ ] 토스 로그인 플로우 정상 동작
- [ ] 냉장고 재료 CRUD (추가/수정/삭제)
- [ ] 영수증 OCR 스캔
- [ ] AI 레시피 생성
- [ ] 레시피 검색 (YouTube/Google)
- [ ] 쇼핑리스트 관리
- [ ] 영양 분석
- [ ] IAP 구독 결제
- [ ] 계정 삭제
- [ ] 다국어 전환 (ko/en/ja/zh)
- [ ] HTTPS 통신 정상 (샌드박스는 HTTP 허용이지만 라이브는 HTTPS만)

---

## 6단계: 토스앱 실기기 테스트

샌드박스 검증 완료 후, 실제 토스앱에서 번들을 테스트한다.

### 6-1. QR 코드 테스트

1. 콘솔에서 `.ait` 업로드 시 자동 생성되는 QR 코드를 스캔
2. 토스앱 로그인 상태에서 QR 스캔 시 미니앱 자동 실행
3. 워크스페이스 멤버 전체에게 푸시 알림 발송 가능

> 필수 조건: 토스앱 로그인 + 워크스페이스 멤버 권한 + 만 19세 이상

### 6-2. 스킴 테스트

```
intoss-private://appsintoss?_deploymentId={업로드 시 발급된 ID}
```

특정 경로 테스트:
```
intoss-private://appsintoss/ko/scan?_deploymentId={ID}
```

쿼리 파라미터 포함 시 URL 인코딩 필수:
```
intoss-private://appsintoss?_deploymentId={ID}&queryParams=%7B%22key%22%3A%22value%22%7D
```

### 6-3. 실기기 테스트 체크리스트

- [ ] 샌드박스 체크리스트 항목 전체 재검증
- [ ] iOS에서 서드파티 쿠키 차단 문제 없는지 확인 (토큰 기반 인증 사용 중이므로 대부분 괜찮음)
- [ ] 메모리/리소스 부족으로 인한 iOS 흰 화면 없는지 확인
- [ ] 네트워크 지연/실패 시 에러 처리 정상 확인
- [ ] 실제 결제 동작 확인 (테스트 결제)

---

## 7단계: 검토 요청 및 출시

### 7-1. 검토 요청

- 최소 1회 이상 토스앱 테스트 완료 후 "검토 요청하기" 버튼 활성화
- 검토 소요: **영업일 기준 최대 3일**
- 한 번에 하나의 버전만 제출 가능

### 7-2. 검토 반려 시

1. "반려사유 보기"로 사유 확인
2. 문제 수정 후 새 번들 업로드
3. 재검토 요청
4. 추가 문의: 채널톡 상담

### 7-3. 출시

- 승인 시 이메일로 결과 안내
- 콘솔에서 "출시하기" 클릭 시 **즉시 전체 사용자에게 반영**
- 충분한 테스트 후 출시 진행

### 7-4. 출시 후 관리

- 새 버전: 번들 업로드 > 검토 요청 > 승인 > 출시 (동일 프로세스)
- 롤백: "앱 출시" 메뉴에서 이전 버전으로 롤백 가능 (즉시 반영)
- 모니터링 권장: Sentry, API 응답 지연/실패율, 사용자 피드백

---

## 흔한 문제 및 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| iOS 흰 화면 | 메모리/리소스 부족 | 이미지/폰트 용량 축소, 메모리 누수 점검 |
| 통신 안 됨 | CORS 미설정 | Origin 도메인 허용 목록에 tossmini.com 추가 |
| "잠시 문제가 생겼어요" | brand 값 미설정 | `granite.config.ts`에서 brand 항목 모두 채우기 (완료됨) |
| 토스 로그인 안 됨 | 개발자 로그인 미진행 | 샌드박스에서 개발자 로그인 먼저 진행 |
| 약관 화면 안 보임 | 개발자 로그인 없음 | 콘솔 QR 코드로 테스트 |

---

## 현재 완료 상태

| 항목 | 상태 |
|------|------|
| 정적 앱 전환 (SSR -> CSR) | 완료 |
| Next.js static export (`out/`) | 완료 (5MB) |
| 25개 API Routes 제거 | 완료 |
| 10개 Supabase Edge Functions 작성 | 완료 |
| 클라이언트 API 서비스 레이어 | 완료 |
| `granite.config.ts` 설정 | 완료 |
| Git 커밋 | 완료 (`59c186b`) |
| Supabase Edge Functions 배포 | **미완료** |
| 시크릿 설정 | **미완료** |
| 토스 콘솔 URL 변경 | **미완료** |
| CORS 도메인 확인 | **미완료** |
| .ait 번들 업로드 | **미완료** |
| 샌드박스 테스트 | **미완료** |
| 토스앱 실기기 테스트 | **미완료** |
| 검토 요청 | **미완료** |
| 출시 | **미완료** |
