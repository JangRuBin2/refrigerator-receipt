# 냉장고 식재료 관리 서비스 - 프로젝트 기획서

## 1. 프로젝트 개요

### 1.1 서비스명
**Fridge Mate (프리지메이트)** - 나만의 똑똑한 냉장고 비서

### 1.2 서비스 소개
영수증 사진을 찍어 식재료를 자동 등록하고, 유통기한을 관리하며,
보유한 재료로 만들 수 있는 레시피를 추천하는 웹/앱 서비스

### 1.3 핵심 가치
- **낭비 감소**: 유통기한 알림으로 식재료 폐기 최소화
- **편의성**: 영수증 OCR로 간편한 재료 등록
- **창의성**: 보유 재료 기반 랜덤 레시피 추천
- **접근성**: 다국어 지원으로 글로벌 사용자 타겟

---

## 2. 주요 기능

### 2.1 영수증 OCR 스캔
- 영수증 사진 촬영/업로드
- AI 기반 텍스트 인식 (Google Cloud Vision / Tesseract)
- 식재료 자동 분류 및 등록
- 수동 수정/추가 기능

### 2.2 냉장고 재료 관리
- 카테고리별 재료 목록 (채소, 과일, 육류, 유제품, 양념 등)
- 재료별 수량 관리
- 냉장/냉동/실온 구분
- 검색 및 필터링

### 2.3 유통기한 관리
- 식재료별 기본 유통기한 DB
  - 채소류: 7-14일
  - 과일류: 5-14일
  - 육류: 3-5일 (냉장), 3-6개월 (냉동)
  - 유제품: 7-14일
  - 양념류: 1-6개월
- 사용자 커스텀 유통기한 설정
- D-day 표시
- 푸시 알림 (D-3, D-1, D-day)
- 유통기한 임박 재료 하이라이트

### 2.4 레시피 추천
- "오늘 점심 뭐먹지?" 기능
- "오늘 저녁 뭐먹지?" 기능
- 보유 재료 기반 레시피 매칭
- 랜덤 레시피 룰렛
- 부족한 재료 표시
- 레시피 즐겨찾기
- 조리 난이도/시간 필터

### 2.5 사용자 인증
- Google OAuth 2.0 로그인
- 프로필 관리
- 기기간 데이터 동기화

### 2.6 설정
- 다국어 지원
  - 한국어 (기본)
  - English
  - 日本語
  - 中文 (简体/繁體)
- 알림 설정
- 테마 설정 (라이트/다크)
- 데이터 백업/복원

---

## 3. 기술 스택

### 3.1 Frontend (Web)
```
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- UI Library: Tailwind CSS + shadcn/ui
- State Management: Zustand
- i18n: next-intl
- PWA: next-pwa
```

### 3.2 Frontend (Mobile App)
```
- Framework: React Native + Expo
- Language: TypeScript
- Navigation: React Navigation
- i18n: i18next
```

### 3.3 Backend
```
- Runtime: Node.js
- Framework: Express.js / Fastify
- Language: TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Cache: Redis
- Auth: Firebase Auth (Google OAuth)
```

### 3.4 AI/ML Services
```
- OCR: Google Cloud Vision API / Tesseract.js
- Recipe AI: OpenAI GPT API (레시피 생성/추천)
```

### 3.5 Infrastructure
```
- Hosting: Vercel (Web) / AWS (Backend)
- Database: Supabase / PlanetScale
- Storage: AWS S3 / Cloudflare R2
- CDN: Cloudflare
```

---

## 4. 데이터베이스 스키마

### 4.1 Users (사용자)
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(100),
  avatar_url    TEXT,
  locale        VARCHAR(10) DEFAULT 'ko',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Ingredients (식재료)
```sql
CREATE TABLE ingredients (
  id            UUID PRIMARY KEY,
  user_id       UUID REFERENCES users(id),
  name          VARCHAR(100) NOT NULL,
  category      VARCHAR(50),
  quantity      DECIMAL(10,2),
  unit          VARCHAR(20),
  storage_type  VARCHAR(20), -- refrigerated, frozen, room_temp
  purchase_date DATE,
  expiry_date   DATE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

### 4.3 Default Expiry (기본 유통기한)
```sql
CREATE TABLE default_expiry (
  id            UUID PRIMARY KEY,
  ingredient_name VARCHAR(100),
  category      VARCHAR(50),
  storage_type  VARCHAR(20),
  expiry_days   INT,
  locale        VARCHAR(10)
);
```

### 4.4 Recipes (레시피)
```sql
CREATE TABLE recipes (
  id            UUID PRIMARY KEY,
  title         JSONB, -- {"ko": "김치찌개", "en": "Kimchi Stew"}
  description   JSONB,
  ingredients   JSONB, -- [{name, quantity, unit}]
  instructions  JSONB,
  cooking_time  INT, -- minutes
  difficulty    VARCHAR(20),
  image_url     TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### 4.5 User Favorites (즐겨찾기)
```sql
CREATE TABLE user_favorites (
  id            UUID PRIMARY KEY,
  user_id       UUID REFERENCES users(id),
  recipe_id     UUID REFERENCES recipes(id),
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### 4.6 Receipt Scans (영수증 스캔 기록)
```sql
CREATE TABLE receipt_scans (
  id            UUID PRIMARY KEY,
  user_id       UUID REFERENCES users(id),
  image_url     TEXT,
  raw_text      TEXT,
  parsed_items  JSONB,
  scanned_at    TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API 엔드포인트

### 5.1 인증
```
POST   /api/auth/google          - Google 로그인
POST   /api/auth/logout          - 로그아웃
GET    /api/auth/me              - 현재 사용자 정보
```

### 5.2 식재료
```
GET    /api/ingredients          - 식재료 목록 조회
POST   /api/ingredients          - 식재료 추가
PUT    /api/ingredients/:id      - 식재료 수정
DELETE /api/ingredients/:id      - 식재료 삭제
GET    /api/ingredients/expiring - 유통기한 임박 재료
```

### 5.3 영수증 스캔
```
POST   /api/receipts/scan        - 영수증 이미지 OCR
POST   /api/receipts/confirm     - OCR 결과 확인 및 등록
GET    /api/receipts/history     - 스캔 기록
```

### 5.4 레시피
```
GET    /api/recipes              - 레시피 목록
GET    /api/recipes/:id          - 레시피 상세
GET    /api/recipes/recommend    - 보유 재료 기반 추천
GET    /api/recipes/random       - 랜덤 레시피
POST   /api/recipes/generate     - AI 레시피 생성
```

### 5.5 즐겨찾기
```
GET    /api/favorites            - 즐겨찾기 목록
POST   /api/favorites/:recipeId  - 즐겨찾기 추가
DELETE /api/favorites/:recipeId  - 즐겨찾기 삭제
```

### 5.6 설정
```
GET    /api/settings             - 사용자 설정 조회
PUT    /api/settings             - 사용자 설정 변경
GET    /api/settings/locales     - 지원 언어 목록
```

---

## 6. 화면 구성

### 6.1 메인 화면 (홈)
```
┌─────────────────────────────┐
│  🍳 Fridge Mate      [설정] │
├─────────────────────────────┤
│                             │
│  📸 영수증 스캔하기         │
│  ┌─────────────────────┐   │
│  │   + 사진 촬영/업로드  │   │
│  └─────────────────────┘   │
│                             │
│  ⏰ 유통기한 임박 (3)       │
│  ┌─────────────────────┐   │
│  │ 🥛 우유    D-1      │   │
│  │ 🥬 양배추  D-2      │   │
│  │ 🍖 돼지고기 D-3      │   │
│  └─────────────────────┘   │
│                             │
│  🎲 오늘 뭐먹지?            │
│  ┌──────────┬──────────┐   │
│  │  🌞 점심  │  🌙 저녁  │   │
│  └──────────┴──────────┘   │
│                             │
├─────────────────────────────┤
│  🏠    📋    📸    ❤️    ⚙️  │
└─────────────────────────────┘
```

### 6.2 냉장고 재료 목록
```
┌─────────────────────────────┐
│  ← 내 냉장고         [검색] │
├─────────────────────────────┤
│  [냉장] [냉동] [실온]       │
├─────────────────────────────┤
│  🥬 채소류 (5)              │
│  ├─ 양배추     300g   D-2  │
│  ├─ 당근       2개    D-5  │
│  └─ ...                    │
│                             │
│  🥩 육류 (3)                │
│  ├─ 돼지고기   500g   D-3  │
│  └─ ...                    │
│                             │
│  🥛 유제품 (2)              │
│  └─ ...                    │
│                             │
│        [+ 재료 추가]        │
└─────────────────────────────┘
```

### 6.3 레시피 추천 화면
```
┌─────────────────────────────┐
│  ← 오늘 점심 추천           │
├─────────────────────────────┤
│                             │
│      🎰 룰렛 돌리기         │
│                             │
│  ┌─────────────────────┐   │
│  │    [레시피 이미지]    │   │
│  │                      │   │
│  │    김치찌개 🌶️      │   │
│  │    ⏱️ 30분 | ⭐ 쉬움  │   │
│  │                      │   │
│  │  ✅ 김치, 돼지고기    │   │
│  │  ❌ 두부 (없음)       │   │
│  └─────────────────────┘   │
│                             │
│  [다시 추천] [레시피 보기]  │
│                             │
└─────────────────────────────┘
```

### 6.4 설정 화면
```
┌─────────────────────────────┐
│  ← 설정                     │
├─────────────────────────────┤
│                             │
│  👤 프로필                  │
│  ├─ 이름: 홍길동            │
│  └─ 이메일: hong@gmail.com  │
│                             │
│  🌐 언어 설정               │
│  └─ 한국어 ▼               │
│     ┌─────────────────┐    │
│     │ ✓ 한국어         │    │
│     │   English       │    │
│     │   日本語         │    │
│     │   中文          │    │
│     └─────────────────┘    │
│                             │
│  🔔 알림 설정               │
│  ├─ 유통기한 알림  [ON]    │
│  └─ 알림 시간     09:00    │
│                             │
│  🎨 테마                    │
│  └─ 다크 모드      [OFF]   │
│                             │
│  📤 데이터 백업             │
│  📥 데이터 복원             │
│                             │
│  🚪 로그아웃                │
│                             │
└─────────────────────────────┘
```

---

## 7. 개발 마일스톤

### Phase 1: MVP (4주)
- [ ] 프로젝트 초기 설정
- [ ] Google 로그인 구현
- [ ] 기본 UI 레이아웃
- [ ] 식재료 CRUD
- [ ] 기본 유통기한 DB 구축
- [ ] 다국어 기본 구조 (한/영)

### Phase 2: 핵심 기능 (4주)
- [ ] 영수증 OCR 연동
- [ ] OCR 결과 파싱 및 재료 매칭
- [ ] 유통기한 알림 시스템
- [ ] 레시피 DB 구축
- [ ] 레시피 추천 알고리즘

### Phase 3: 고도화 (4주)
- [ ] AI 레시피 생성
- [ ] "오늘 뭐먹지" 룰렛 기능
- [ ] 추가 언어 지원 (일/중)
- [ ] PWA 구현
- [ ] 성능 최적화

### Phase 4: 앱 출시 (4주)
- [ ] React Native 앱 개발
- [ ] 푸시 알림 구현
- [ ] 앱스토어/플레이스토어 배포
- [ ] 베타 테스트
- [ ] 정식 출시

---

## 8. 폴더 구조

```
refrigerator-receipt/
├── apps/
│   ├── web/                    # Next.js 웹 앱
│   │   ├── app/
│   │   │   ├── [locale]/       # 다국어 라우팅
│   │   │   │   ├── page.tsx
│   │   │   │   ├── fridge/
│   │   │   │   ├── recipes/
│   │   │   │   ├── scan/
│   │   │   │   └── settings/
│   │   │   └── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── messages/           # i18n 메시지
│   │   │   ├── ko.json
│   │   │   ├── en.json
│   │   │   ├── ja.json
│   │   │   └── zh.json
│   │   └── public/
│   │
│   └── mobile/                 # React Native 앱
│       ├── src/
│       │   ├── screens/
│       │   ├── components/
│       │   ├── navigation/
│       │   └── i18n/
│       └── app.json
│
├── packages/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── middleware/
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   ├── shared/                 # 공유 타입/유틸
│   │   ├── types/
│   │   └── utils/
│   │
│   └── ocr/                    # OCR 서비스
│       └── src/
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 9. 다국어 지원 구조

### 9.1 메시지 파일 예시 (ko.json)
```json
{
  "common": {
    "appName": "Fridge Mate",
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "수정"
  },
  "home": {
    "scanReceipt": "영수증 스캔하기",
    "expiringItems": "유통기한 임박",
    "whatToEat": "오늘 뭐먹지?",
    "lunch": "점심",
    "dinner": "저녁"
  },
  "fridge": {
    "title": "내 냉장고",
    "refrigerated": "냉장",
    "frozen": "냉동",
    "roomTemp": "실온",
    "addIngredient": "재료 추가",
    "dDay": "D-{days}"
  },
  "recipe": {
    "recommend": "추천 레시피",
    "random": "랜덤 추천",
    "cookingTime": "조리시간",
    "difficulty": "난이도",
    "ingredients": "재료",
    "missing": "부족한 재료"
  },
  "settings": {
    "title": "설정",
    "profile": "프로필",
    "language": "언어 설정",
    "notifications": "알림 설정",
    "theme": "테마",
    "darkMode": "다크 모드",
    "logout": "로그아웃"
  },
  "auth": {
    "loginWithGoogle": "Google로 로그인",
    "logout": "로그아웃"
  }
}
```

### 9.2 영어 메시지 (en.json)
```json
{
  "common": {
    "appName": "Fridge Mate",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "home": {
    "scanReceipt": "Scan Receipt",
    "expiringItems": "Expiring Soon",
    "whatToEat": "What to Eat Today?",
    "lunch": "Lunch",
    "dinner": "Dinner"
  }
}
```

---

## 10. 식재료 기본 유통기한 데이터

| 카테고리 | 식재료 | 냉장 | 냉동 | 실온 |
|---------|-------|------|------|------|
| 채소 | 양배추 | 14일 | 60일 | - |
| 채소 | 당근 | 21일 | 90일 | - |
| 채소 | 양파 | 30일 | - | 14일 |
| 채소 | 시금치 | 5일 | 30일 | - |
| 과일 | 사과 | 30일 | - | 7일 |
| 과일 | 바나나 | 7일 | 30일 | 5일 |
| 육류 | 소고기 | 5일 | 180일 | - |
| 육류 | 돼지고기 | 5일 | 180일 | - |
| 육류 | 닭고기 | 3일 | 180일 | - |
| 해산물 | 생선 | 2일 | 90일 | - |
| 유제품 | 우유 | 10일 | - | - |
| 유제품 | 치즈 | 30일 | 180일 | - |
| 유제품 | 계란 | 30일 | - | - |
| 양념 | 간장 | 365일 | - | 180일 |
| 양념 | 고추장 | 365일 | - | 90일 |

---

## 11. 비즈니스 모델 (향후)

### 11.1 프리미엄 기능
- 무제한 OCR 스캔
- AI 맞춤 레시피 생성
- 광고 제거
- 가족 공유 기능

### 11.2 제휴
- 마트/식료품점 쿠폰 연동
- 식재료 배송 서비스 연동
- 레시피 컨텐츠 제휴

---

## 12. 참고사항

### 12.1 유사 서비스 분석
- 만개의레시피 - 레시피 중심
- 냉장고를 부탁해 - TV 프로그램
- Supercook - 재료 기반 레시피 검색

### 12.2 차별점
- 영수증 OCR로 자동 재료 등록
- 유통기한 자동 설정 및 알림
- 다국어 지원
- "오늘 뭐먹지" 랜덤 추천 컨텐츠
