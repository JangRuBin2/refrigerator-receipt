# 밀키퍼 (MealKeeper) 출시노트

**버전**: 0.2.0
**기간**: 2026.02.26 ~ 2026.03.10
**SDK**: apps-in-toss 2.0.1

---

## 신규 기능

### AI 레시피 공유
- AI 추천 레시피를 다른 사용자에게 공유할 수 있는 기능 추가
- 저장되지 않은 레시피 공유 시 자동 저장 후 URL 공유
- 공유 링크를 통해 비로그인 사용자도 레시피 조회 가능
- 이미지 공유 지원 (레시피 카드를 이미지로 생성하여 공유)

### AI 레시피 재료 선택
- AI 레시피 생성 시 사용할 재료를 직접 선택하는 기능 추가
- 냉장고 재료 목록에서 원하는 재료만 골라서 레시피 추천 요청 가능

### 맞춤형 영양 분석
- 성별/연령 기반 개인 맞춤 영양 분석 기능 추가
- 1일 권장 섭취량 대비 비교 UI 제공
- 영양분석 주간 필터 기능 추가

### 영수증 스캔 개선
- OCR + AI 토글 방식으로 스캔 모드 리팩토링
- Gemini responseSchema 기반 구조화된 응답으로 인식률 향상
- 디버그 패널 추가 (개발용)
- 스캔 결과에서 유통기한 직접 수정 기능 추가

### 배너 광고 확대 적용
- 홈, 냉장고, 레시피, 추천, 스캔 등 5개 페이지에 배너 광고 추가
- 광고 ID 업데이트 (ait.v2.live.9c28c530c14a4b96)

---

## 개선사항

### 다국어(i18n) 전면 감사
- 10개 이상 파일에서 하드코딩된 한국어 약 60개를 useTranslations()으로 전환
- 4개 로케일(ko/en/ja/zh)에 120개 이상 i18n 키 추가
- ja.json, zh.json에 누락된 번역 키 51개 보충
- YouTube 검색 로케일별 키워드 지원

### 프리미엄 UX 개선
- 프리미엄 기능 접근 시 로그인 우선 리다이렉트 (PremiumGate)
- 프리미엄 서비스 소개 BottomSheet 추가
- IAP 구독 중복 방지 처리
- 홈 화면에 트라이얼 배너 및 만료 배너 표시

### 홈 화면 개선
- 사용자 이름을 포함한 개인화 인사 메시지 (Supabase auth/profiles 연동)
- 만료 임박 식재료 자동 삭제 기능 (설정에서 토글)

### 설정 페이지 구조 개선
- 섹션 헤더로 구분 (계정/환경설정/구독/앱 정보)

### 레시피 UI 통일
- 추천 모드별 버튼 레이아웃 통일
- 조리방법 번호 중복 표시 문제 수정

---

## 버그 수정

- **장보기 AI 추천**: 냉장고에 재료가 있는데 "재료를 먼저 등록해주세요" 표시되는 버그 수정
  - Zustand 스토어 동기화 전 상태 참조 문제 → DB 직접 조회 fallback 추가
- **AI 레시피 즐겨찾기 저장**: DB 저장 및 즐겨찾기 연동 수정
- **레시피 사용자 격리**: 다른 사용자 레시피가 노출되는 보안 이슈 수정
- **광고 SDK**: GoogleAdMob 이벤트 기반 API로 재작성 (기존 콜백 방식 호환 문제 해결)
- **PremiumGate 인증**: Next.js 라우터 사용 및 에러 핸들링 추가
- **네비게이션/구독 UI**: 하단 네비게이션 및 구독 화면 버그 수정

---

## 기술 변경

### apps-in-toss SDK 2.0.1 마이그레이션
- SDK 1.9.4 → 2.0.1 업그레이드
- `ait build` 명령 제거에 따른 빌드 스크립트 수정
- `@apps-in-toss/web-framework` CLI를 직접 호출하도록 변경

### 코드 품질 개선
- God Component 분리: 대형 페이지 파일을 feature 모듈로 분리
  - `src/features/home/` (DashboardStats, ExpiryTimeline, ExpiringAlert 등)
  - `src/features/shopping/` (AiRecommendations, ShoppingItemGroup, AddItemModal)
  - `src/features/recipe/` (RecipeResult 등)
- 코드 리뷰 19/20건 반영
- 데드코드 제거 및 중복 코드 통합
- Tailwind content paths에 `src/features/` 추가

### 보안
- 레시피 RLS 정책 강화 (사용자 격리)
- Supabase Edge Function CORS 설정 업데이트 (toss 도메인)

---

## 빌드 및 배포

- `pnpm build` → Next.js 정적 빌드 (Vercel 배포)
- `pnpm build:ait` → .ait 번들 생성 (토스 앱인토스 배포)
- Supabase Edge Functions 10개 배포 완료

---

## 영향 범위

| 영역 | 변경 파일 수 | 주요 변경 |
|------|-------------|----------|
| 페이지 | 10+ | 홈, 냉장고, 레시피, 추천, 스캔, 설정, 장보기, 영양분석 |
| 컴포넌트 | 15+ | PremiumGate, BannerAd, BottomNav, Toast 등 |
| API/Edge Functions | 5+ | 영양분석, 장보기 추천, 레시피 저장, 스캔 |
| i18n | 4 | ko.json, en.json, ja.json, zh.json |
| 설정 | 3 | package.json, granite.config.ts, tailwind.config |
