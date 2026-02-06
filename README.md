# MealKeeper (밀키퍼)

영수증 스캔 기반 스마트 냉장고 관리 서비스

## Overview

MealKeeper는 영수증 OCR 스캔을 통해 식재료를 자동 등록하고, 유통기한 관리, AI 기반 레시피 추천, 영양 분석까지 제공하는 올인원 냉장고 관리 앱입니다.

**Toss Apps-in-Toss** 플랫폼에서 서비스됩니다.

## Features

### Core Features (Free)
- **냉장고 관리**: 식재료 수동 등록/수정/삭제, 카테고리별 분류
- **유통기한 알림**: D-day 표시, 임박 재료 대시보드
- **레시피 조회**: 내장 레시피 DB 검색, 재료 일치율 표시
- **메뉴 추천**: 랜덤 룰렛, 입맛 테스트 기반 추천
- **즐겨찾기**: 레시피 북마크
- **영수증 스캔**: 일 3회 무료 (광고 시청으로 추가 가능 - 준비 중)

### Premium Features
- **무제한 영수증 스캔**: Google Cloud Vision OCR + OpenAI Vision API
- **AI 맞춤 레시피**: 냉장고 재료 기반 신규 레시피 생성
- **외부 레시피 검색**: YouTube/Google 연동 검색
- **스마트 장보기**: AI 추천 기반 자동 장보기 목록
- **영양 분석**: 현재/주간/월간 영양 균형 리포트

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Toss Login |
| State | Zustand |
| i18n | next-intl (ko, en, ja, zh) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Platform | Toss Apps-in-Toss |

## Toss Apps-in-Toss Integration

### 지원 기능
| 기능 | 상태 | 설명 |
|------|------|------|
| 토스 로그인 | 구현 완료 | 토스 앱 환경에서 자동 인증 |
| 인앱결제 (IAP) | 구현 완료 | Premium 구독 결제 |
| 보상형 광고 | 준비 중 | Partner Center 설정 필요 |

### 검수 체크리스트 준수사항
- 핀치줌 비활성화 (`user-scalable=no`)
- 라이트/다크 모드 네비게이션 바 색상
- 44px 최소 터치 영역 (접근성)
- AI 생성 콘텐츠 고지 문구
- 토스 앱 환경에서 Google 로그인 숨김

### IAP 상품 SKU
| SKU | 상품명 | 가격 |
|-----|--------|------|
| `premium_monthly` | Premium 월간 | ₩3,900 |
| `premium_yearly` | Premium 연간 | ₩33,900 |

> Toss Partner Center에서 SKU 등록 필요

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/       # OAuth callback
│   │   │   ├── signout/        # Sign out
│   │   │   └── toss/           # Toss login API
│   │   ├── ingredients/        # Ingredient CRUD
│   │   ├── recipes/
│   │   │   ├── ai-generate/    # AI recipe generation
│   │   │   ├── ai-save/        # Save AI recipes
│   │   │   ├── random/         # Random recipe
│   │   │   ├── recommend/      # Recipe recommendations
│   │   │   ├── search/         # External search
│   │   │   └── taste/          # Taste-based recommendations
│   │   ├── receipts/
│   │   │   ├── scan/           # Receipt OCR scanning
│   │   │   └── ad-reward/      # Ad reward for scans
│   │   ├── shopping/           # Shopping list
│   │   ├── nutrition/          # Nutrition analysis
│   │   ├── subscription/       # Premium subscription
│   │   ├── iap/                # Toss IAP integration
│   │   └── favorites/          # Recipe favorites
│   └── [locale]/               # Localized pages
│       ├── page.tsx            # Home dashboard
│       ├── fridge/             # Fridge management
│       ├── scan/               # Receipt scanning
│       ├── recipes/            # Recipe browser
│       ├── recommend/          # Menu recommendations
│       ├── shopping/           # Shopping list
│       ├── nutrition/          # Nutrition analysis
│       ├── pricing/            # Pricing plans
│       ├── checkout/           # Payment checkout
│       ├── login/              # Authentication
│       └── settings/           # User settings
├── components/
│   ├── layout/                 # Header, BottomNav
│   ├── ui/                     # Reusable UI components
│   ├── premium/                # Premium modal
│   └── seo/                    # JSON-LD structured data
├── hooks/
│   ├── usePremium.ts           # Premium status hook
│   ├── useAppsInToss.ts        # Toss IAP hook
│   └── useAppsInTossAds.ts     # Toss Ads hook
├── lib/
│   ├── supabase/               # Supabase client setup
│   ├── apps-in-toss/           # Toss SDK wrappers
│   │   ├── sdk.ts              # IAP SDK
│   │   └── ads.ts              # Ads SDK
│   ├── ocr/                    # OCR utilities
│   ├── recommend/              # Recommendation engine
│   ├── search/                 # YouTube/Google search
│   └── utils.ts                # Utility functions
├── store/
│   ├── useStore.ts             # Zustand global store
│   └── useToastStore.ts        # Toast notifications
├── types/
│   ├── index.ts                # Core type definitions
│   ├── supabase.ts             # Database types
│   ├── apps-in-toss.ts         # Toss IAP types
│   └── apps-in-toss-ads.ts     # Toss Ads types
├── messages/                   # i18n translation files
│   ├── ko.json
│   ├── en.json
│   ├── ja.json
│   └── zh.json
└── i18n/                       # i18n configuration
```

## Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (includes `toss_user_key`) |
| `ingredients` | User's fridge ingredients |
| `recipes` | Recipe database |
| `user_favorites` | Bookmarked recipes |
| `receipt_scans` | OCR scan history |
| `shopping_lists` | Shopping list items |
| `subscriptions` | Premium subscriptions |
| `event_logs` | Usage tracking (scans, ad watches, etc.) |

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Supabase account
- Google Cloud account (for OCR)
- OpenAI API key (for AI features)
- Toss Partner Center account (for IAP/Ads)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd refrigerator-receipt

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
```

### Environment Variables

```bash
# ===================
# Required
# ===================

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Cloud Vision (OCR)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CLOUD_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com

# OpenAI (AI features)
OPENAI_API_KEY=sk-...

# ===================
# Toss Apps-in-Toss
# ===================

# Toss Login (자체 생성 - 임의의 시크릿 키)
TOSS_AUTH_SECRET=your-random-secret-key

# Toss Ads (Partner Center에서 발급)
NEXT_PUBLIC_TOSS_AD_SCAN_REWARDED=ait-ad-xxx

# ===================
# Optional
# ===================

# YouTube Data API (외부 레시피 검색)
YOUTUBE_API_KEY=AIza...

# Google Custom Search (외부 레시피 검색)
GOOGLE_SEARCH_API_KEY=AIza...
GOOGLE_SEARCH_ENGINE_ID=abc123...

# Site Verification
GOOGLE_SITE_VERIFICATION=xxx
NAVER_SITE_VERIFICATION=xxx
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Key Features Detail

### Receipt Scanning
영수증 이미지를 업로드하면 Google Cloud Vision OCR로 텍스트를 추출하고, OpenAI Vision API로 식재료를 분석합니다. AI가 카테고리, 수량, 예상 유통기한까지 자동 분류합니다.

- 무료 사용자: 일 3회 제한
- 프리미엄 사용자: 무제한
- 광고 시청: +1회 (준비 중)

### AI Recipe Generation
냉장고에 있는 재료를 기반으로 OpenAI API가 새로운 레시피를 생성합니다. 조리 시간, 난이도, 요리 종류 등 선호도를 설정할 수 있습니다.

> AI 생성 콘텐츠에는 고지 문구가 표시됩니다.

### Taste-based Recommendation
5단계 질문(매운맛, 국물, 조리시간, 재료 선호 등)에 답하면 취향에 맞는 레시피를 점수화하여 추천합니다.

### Nutrition Analysis
냉장고 재료 기반 영양소 분석 및 균형 점수(0-100)를 제공합니다. 주간/월간 구매 패턴 분석과 AI 영양 추천도 포함됩니다.

### Smart Shopping List
유통기한 임박 재료, 자주 구매하는 품목 등을 분석하여 AI가 장보기 목록을 추천합니다.

## Subscription Plans

| Feature | Free | Premium (월 ₩3,900) |
|---------|------|---------------------|
| 식재료 수동 등록 | O | O |
| 유통기한 알림 | O | O |
| 레시피 조회 | O | O |
| 메뉴 추천 (랜덤/입맛) | O | O |
| 영수증 스캔 | 일 3회 | 무제한 |
| 외부 레시피 검색 | X | O |
| AI 맞춤 레시피 | 일 1회 | 무제한 |
| 영양 분석 리포트 | X | O |
| 스마트 장보기 | X | O |

## Internationalization

지원 언어: 한국어 (ko), English (en), 日本語 (ja), 中文 (zh)

URL 구조: `/{locale}/page` (예: `/ko/fridge`, `/en/recipes`)

## Accessibility

- 최소 터치 영역 44px 확보
- 라이트/다크 모드 지원
- 스크린 리더 지원 (aria-label)

## Deployment

### Vercel (권장)

```bash
# Vercel CLI로 배포
vercel --prod
```

환경변수는 Vercel Dashboard → Settings → Environment Variables에서 설정

### Toss Apps-in-Toss 배포

1. Vercel에 배포
2. Toss Partner Center에서 앱 등록
3. IAP 상품 SKU 등록 (`premium_monthly`, `premium_yearly`)
4. 광고 그룹 ID 등록 (선택)
5. 검수 요청

## License

Private - All rights reserved

## Contributing

This is a private project. Please contact the maintainers for contribution guidelines.
