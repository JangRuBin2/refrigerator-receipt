# Fridge Mate 비즈니스 모델 설계

## 요금제 구조

### Free (무료)
| 기능 | 제한 |
|------|------|
| 식재료 수동 등록 | 무제한 |
| 냉장고 관리 (조회/수정/삭제) | 무제한 |
| 유통기한 알림 | 무제한 |
| 레시피 조회 (내장 DB) | 무제한 |
| 메뉴 추천 (랜덤/입맛 기반) | 무제한 |
| 다국어 지원 | 무제한 |

### Premium (유료)
| 기능 | 설명 |
|------|------|
| 영수증 스캔 (OCR) | 카메라/갤러리로 영수증 촬영 → 자동 식재료 등록 |
| 외부 레시피 검색 | YouTube/Google 연동 레시피 검색 |

## 요금 정책 (안)

| 플랜 | 가격 | 비고 |
|------|------|------|
| Free | 0원 | 기본 냉장고 관리 |
| Premium 월간 | 2,900원/월 | 영수증 스캔 + 외부 검색 |
| Premium 연간 | 24,900원/년 (2,075원/월) | 28% 할인 |

> 가격은 Google Vision API 비용(1,000건당 $1.50)과 YouTube/Google Search API 비용을 고려하여 설정.
> 월 평균 사용량: 영수증 스캔 20~30회 예상 → API 비용 약 $0.05/유저/월

## 구현 방향

### 1. DB 스키마 (Supabase)

```sql
-- 유저 구독 정보 테이블
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',        -- 'free' | 'premium'
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  payment_provider TEXT,                     -- 'google_play' | 'app_store' | 'stripe'
  payment_id TEXT,                           -- 외부 결제 ID
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### 2. 프리미엄 체크 로직

```
영수증 스캔 요청
  → 서버에서 user_id로 subscriptions 조회
  → plan = 'premium' AND expires_at > now()
    → YES: OCR 진행
    → NO: 403 응답 + "프리미엄 구독이 필요합니다" 메시지
```

### 3. 결제 연동 옵션

| 방식 | 적합한 경우 | 수수료 |
|------|------------|--------|
| Google Play 인앱결제 | Android 앱 (PWA→TWA) | 15~30% |
| Apple 인앱결제 | iOS 앱 | 15~30% |
| Stripe | 웹 직접 결제 | 2.9% + 30¢ |
| 토스페이먼츠 | 한국 웹 결제 | 3.3% |

**권장**: 웹 앱이므로 초기에는 **Stripe** 또는 **토스페이먼츠**로 시작.
앱스토어 출시 시 인앱결제 추가.

### 4. 클라이언트 UX 흐름

```
[스캔 버튼 클릭]
  → 구독 상태 확인 (캐시 또는 API)
  → Free 유저:
      모달 표시 "프리미엄 기능입니다"
      - 구독하기 버튼 → 결제 페이지
      - 닫기 버튼
  → Premium 유저:
      정상적으로 카메라/업로드 진행
```

## 수익 시뮬레이션

| 지표 | 수치 |
|------|------|
| MAU | 10,000명 |
| 프리미엄 전환율 | 3~5% |
| 유료 유저 수 | 300~500명 |
| 월 매출 (2,900원 기준) | 87만~145만원 |
| API 비용 (유료 유저당 ~50원/월) | 1.5만~2.5만원 |
| 결제 수수료 (3.3%) | 2.9만~4.8만원 |
| **월 순수익** | **약 83만~138만원** |

## 향후 확장

- **Premium Plus**: AI 기반 식단 추천, 영양 분석 (GPT API 연동)
- **가족 공유**: 하나의 구독으로 가족 구성원 냉장고 공유
- **마트 연동**: 부족한 식재료 자동 장보기 목록 → 마트 배달 연동 (제휴 수수료)
