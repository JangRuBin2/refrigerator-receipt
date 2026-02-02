# MealKeeper (밀키퍼)

영수증 스캔 기반 스마트 냉장고 관리 서비스

## Overview

MealKeeper는 영수증 OCR 스캔을 통해 식재료를 자동 등록하고, 유통기한 관리, AI 기반 레시피 추천, 영양 분석까지 제공하는 올인원 냉장고 관리 앱입니다.

## Features

### Core Features (Free)
- **냉장고 관리**: 식재료 수동 등록/수정/삭제, 카테고리별 분류
- **유통기한 알림**: D-day 표시, 임박 재료 대시보드
- **레시피 조회**: 내장 레시피 DB 검색, 재료 일치율 표시
- **메뉴 추천**: 랜덤 룰렛, 입맛 테스트 기반 추천
- **즐겨찾기**: 레시피 북마크

### Premium Features
- **영수증 스캔**: Google Cloud Vision OCR + OpenAI Vision API
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
| Auth | NextAuth + Supabase Auth |
| State | Zustand |
| i18n | next-intl (ko, en, ja, zh) |
| Icons | Lucide React |

## Project Structure

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/               # Authentication callbacks
│   │   ├── ingredients/        # Ingredient CRUD
│   │   ├── recipes/            # Recipe operations
│   │   │   ├── ai-generate/    # AI recipe generation
│   │   │   ├── ai-save/        # Save AI recipes
│   │   │   ├── random/         # Random recipe
│   │   │   ├── recommend/      # Recipe recommendations
│   │   │   ├── search/         # External search (YouTube/Google)
│   │   │   └── taste/          # Taste-based recommendations
│   │   ├── receipts/scan/      # Receipt OCR scanning
│   │   ├── shopping/           # Shopping list management
│   │   ├── nutrition/          # Nutrition analysis
│   │   ├── subscription/       # Premium subscription
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
│   └── premium/                # Premium modal
├── hooks/
│   └── usePremium.ts           # Premium status hook
├── lib/
│   ├── supabase/               # Supabase client setup
│   ├── ocr/                    # OCR utilities
│   ├── recommend/              # Recommendation engine
│   ├── search/                 # YouTube/Google search
│   └── utils.ts                # Utility functions
├── store/
│   └── useStore.ts             # Zustand global store
├── types/
│   ├── index.ts                # Core type definitions
│   ├── supabase.ts             # Database types
│   └── subscription.ts         # Subscription types
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
| `profiles` | User profiles |
| `ingredients` | User's fridge ingredients |
| `recipes` | Recipe database |
| `user_favorites` | Bookmarked recipes |
| `receipt_scans` | OCR scan history |
| `shopping_lists` | Shopping list items |
| `subscriptions` | Premium subscriptions |

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- Google Cloud account (for OCR)
- OpenAI API key (for AI features)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd refrigerator-receipt

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Cloud Vision (OCR)
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_PRIVATE_KEY=
GOOGLE_CLOUD_CLIENT_EMAIL=

# OpenAI (AI features)
OPENAI_API_KEY=

# YouTube Data API (optional)
YOUTUBE_API_KEY=

# Google Custom Search (optional)
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

## Key Features Detail

### Receipt Scanning
영수증 이미지를 업로드하면 Google Cloud Vision OCR로 텍스트를 추출하고, OpenAI Vision API로 식재료를 분석합니다. AI가 카테고리, 수량, 예상 유통기한까지 자동 분류합니다.

### AI Recipe Generation
냉장고에 있는 재료를 기반으로 OpenAI API가 새로운 레시피를 생성합니다. 조리 시간, 난이도, 요리 종류 등 선호도를 설정할 수 있습니다.

### Taste-based Recommendation
5단계 질문(매운맛, 국물, 조리시간, 재료 선호 등)에 답하면 취향에 맞는 레시피를 점수화하여 추천합니다.

### Nutrition Analysis
냉장고 재료 기반 영양소 분석 및 균형 점수(0-100)를 제공합니다. 주간/월간 구매 패턴 분석과 AI 영양 추천도 포함됩니다.

### Smart Shopping List
유통기한 임박 재료, 자주 구매하는 품목 등을 분석하여 AI가 장보기 목록을 추천합니다.

## Subscription Plans

| Feature | Free | Premium (월 3,900원) |
|---------|------|---------------------|
| 식재료 수동 등록 | O | O |
| 유통기한 알림 | O | O |
| 레시피 조회 | O | O |
| 메뉴 추천 (랜덤/입맛) | O | O |
| 영수증 스캔 | X | O (무제한) |
| 외부 레시피 검색 | X | O |
| AI 맞춤 레시피 | X | O |
| 영양 분석 리포트 | X | O |
| 스마트 장보기 | X | O |

## Internationalization

지원 언어: 한국어 (ko), English (en), 日本語 (ja), 中文 (zh)

URL 구조: `/{locale}/page` (예: `/ko/fridge`, `/en/recipes`)

## License

Private - All rights reserved

## Contributing

This is a private project. Please contact the maintainers for contribution guidelines.
