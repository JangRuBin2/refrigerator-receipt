# 토스 앱인토스 인수인계 - 공유 파일 체크리스트

새 토스앱 프로젝트에 전달해야 할 파일 목록.

---

## 신규 작성 인수인계 문서 (2개)

| 파일 | 내용 |
|------|------|
| `docs/handover/01-toss-app-architecture.md` | 아키텍처, SPA 라우팅 삽질, mTLS 인증서, 빌드, 디버그 |
| `docs/handover/02-sdk-and-supabase-patterns.md` | SDK 연동 패턴, IAP, 광고, Edge Function, 상태관리 |

---

## 토스 공식 문서 (그대로 전달, 4개)

| 파일 | 내용 |
|------|------|
| `docs/토스앱 개발 가이드.md` | 인앱 광고 개발 가이드 (정책, 유형, 테스트 ID) |
| `docs/공유 링크 만들기.md` | `getTossShareLink` API 문서 |
| `docs/파일 저장하기.md` | `saveBase64Data` API 문서 |
| `docs/OG 이미지 규칙.md` | OG 이미지 규격/정책 |

---

## 프로젝트 실전 문서 (그대로 전달, 2개)

| 파일 | 내용 |
|------|------|
| `docs/APPS-IN-TOSS-DEPLOYMENT.md` | 배포 가이드 (mTLS 삽질, OAuth 플로우, 검수 체크리스트) |
| `docs/static-migration-strategy.md` | SSR -> Static Export 전환 전략 (API Route -> Edge Function 매핑표) |

---

## Claude Code 설정 (새 프로젝트에 재사용 가능, 5개)

| 파일 | 내용 |
|------|------|
| `.claude/rules/build-deploy.md` | 빌드/배포 룰 |
| `.claude/rules/coding-style.md` | 코딩 스타일 가이드 |
| `.claude/rules/security.md` | 보안 체크리스트 |
| `.claude/rules/patterns.md` | API 응답, 훅, 레포지토리 패턴 |
| `.claude/rules/testing.md` | TDD 워크플로우 |

---

## 참고용 (필요 시, 2개)

| 파일 | 내용 |
|------|------|
| `docs/business-model.md` | 비즈니스 모델 (프리미엄/광고) |
| `docs/ux-premium-auth-improvement.md` | UX 개선 사항 |

---

**총 15개 파일** (신규 2 + 토스 공식 4 + 실전 2 + Claude 설정 5 + 참고 2)
