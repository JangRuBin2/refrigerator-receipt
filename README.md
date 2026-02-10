# MealKeeper (밀키퍼)

영수증 스캔 기반 스마트 냉장고 관리 서비스

## Overview

MealKeeper는 영수증 OCR 스캔을 통해 식재료를 자동 등록하고, 유통기한 관리, AI 기반 레시피 추천까지 제공하는 올인원 냉장고 관리 앱입니다.

**Toss Apps-in-Toss** 플랫폼에서 서비스됩니다.

## Features

### Core Features (Free)
- **냉장고 관리**: 식재료 수동 등록/수정/삭제, 카테고리별 분류
- **유통기한 알림**: D-day 표시, 임박 재료 대시보드
- **레시피 조회**: 내장 레시피 DB 검색, 재료 일치율 표시
- **메뉴 추천**: 랜덤 룰렛, 입맛 테스트 기반 추천
- **즐겨찾기**: 레시피 북마크
- **영수증 스캔**: 일 5회 무료 (AI Vision / OCR)

### Premium Features (준비 중)
- **무제한 영수증 스캔**: 일 50회
- **AI 맞춤 레시피**: 냉장고 재료 기반 신규 레시피 생성
- **외부 레시피 검색**: YouTube/Google 연동 검색 (준비 중)
- **스마트 장보기**: AI 추천 기반 자동 장보기 목록
- **영양 분석**: 현재/주간/월간 영양 균형 리포트

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router, Static Export) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + Edge Functions) |
| Auth | Toss OAuth2 + Supabase Auth |
| State | Zustand |
| i18n | next-intl (ko, en, ja, zh) |
| Animation | Framer Motion |
| AI/OCR | Google Gemini + Cloud Vision |
| Platform | Toss Apps-in-Toss (`@apps-in-toss/web-framework`) |

## Project Structure

```
src/
├── app/[locale]/          # Localized pages
│   ├── page.tsx           # Home dashboard
│   ├── fridge/            # 냉장고 관리
│   ├── scan/              # 영수증 스캔
│   ├── recipes/           # 레시피
│   ├── shopping/          # 장보기 목록
│   ├── login/             # 토스 로그인
│   ├── settings/          # 설정
│   └── terms/             # 이용약관
├── components/
│   ├── layout/            # Header, BottomNav, AuthGuard, DeepLinkHandler
│   ├── ui/                # Card, Button, Modal, Badge, Input, Toast 등
│   ├── premium/           # PremiumModal
│   └── seo/               # JSON-LD 구조화 데이터
├── hooks/
│   ├── usePremium.ts      # 프리미엄 상태
│   ├── useAppsInToss.ts   # 토스 IAP
│   └── useAppsInTossAds.ts # 토스 광고
├── lib/
│   ├── supabase/          # Supabase 클라이언트
│   ├── apps-in-toss/      # 토스 SDK 래퍼 (sdk.ts, ads.ts)
│   ├── api/               # Edge Function 호출 (auth, scan, recipes 등)
│   └── utils.ts           # 유틸리티
├── store/                 # Zustand 스토어
├── types/                 # TypeScript 타입
├── messages/              # 번역 파일 (ko, en, ja, zh)
└── i18n/                  # i18n 설정

supabase/functions/        # Supabase Edge Functions (Deno)
├── _shared/               # 공용 모듈 (cors, supabase, gemini)
├── auth-toss/             # 토스 OAuth2 로그인
├── auth-delete-account/   # 회원 탈퇴
├── auth-toss-disconnect/  # 토스 연결 끊기 콜백
├── receipts-scan/         # 영수증 OCR 스캔
├── recipes-ai-generate/   # AI 레시피 생성
├── recipes-search/        # 외부 레시피 검색
├── nutrition-analyze/     # 영양 분석
├── shopping-recommend/    # 장보기 추천
├── iap-activate/          # IAP 구독 활성화
└── iap-status/            # IAP 상태 조회

scripts/
└── fix-root-html.mjs      # SPA fallback용 root index.html 생성
```

## Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | 사용자 프로필 (`toss_user_key` 포함) |
| `ingredients` | 냉장고 식재료 |
| `recipes` | 레시피 DB |
| `user_favorites` | 즐겨찾기 레시피 |
| `event_logs` | 사용 이력 (스캔, 광고 등) |
| `shopping_lists` | 장보기 목록 |
| `subscriptions` | 프리미엄 구독 |

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Supabase 프로젝트
- Google Cloud 계정 (Gemini API + Cloud Vision)
- Toss Partner Center 계정

### Installation

```bash
git clone <repository-url>
cd refrigerator-receipt
npm install
cp .env.example .env.local
# .env.local에 환경변수 설정
```

### Development

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # Next.js 빌드 (static export)
npm run build:ait    # 토스 .ait 파일 빌드
npm run lint         # ESLint
```

### Supabase Edge Functions

```bash
# 개별 함수 배포
npx supabase functions deploy auth-toss --no-verify-jwt
npx supabase functions deploy receipts-scan --no-verify-jwt

# 시크릿 설정
npx supabase secrets set GOOGLE_GEMINI_API_KEY=xxx
npx supabase secrets set APPS_IN_TOSS_API_URL=https://apps-in-toss-api.toss.im
npx supabase secrets set APPS_IN_TOSS_MTLS_CERT=<base64-encoded-pem>
npx supabase secrets set APPS_IN_TOSS_MTLS_KEY=<base64-encoded-pem>
```

## Deployment

### Toss Apps-in-Toss 배포

1. `npm run build:ait` → `.ait` 파일 생성
2. [Toss Partner Console](https://console.apps-in-toss.toss.im/) → 앱 업로드
3. Supabase Edge Functions 배포
4. 검수 요청

> 상세 배포 가이드: [docs/APPS-IN-TOSS-DEPLOYMENT.md](docs/APPS-IN-TOSS-DEPLOYMENT.md)

## Business Info

- 대표: 장루빈
- 사업자등록번호: 790-39-01572

## License

Private - All rights reserved
