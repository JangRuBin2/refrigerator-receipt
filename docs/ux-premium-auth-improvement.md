# UX 개선: 인증 우선 리다이렉트 + 프리미엄 서비스 상세 표시

## 문제

비로그인 유저가 프리미엄 전용 페이지(`/fridge`, `/recipes`, `/nutrition`, `/shopping`)에 접근하면,
`PremiumGate`의 `PremiumModal`이 먼저 표시된 후 `AuthGuard`의 로그인 리다이렉트가 실행되면서 UX가 어색했음.

또한 프리미엄 유저가 설정 페이지에서 구독 뱃지를 눌렀을 때, 단순히 `/pricing` 페이지로 이동할 뿐
현재 이용 중인 서비스에 대한 정보를 확인할 수 없었음.

## 해결

### 1. PremiumGate에 인증 체크 추가 (auth-first)

**파일:** `src/components/premium/PremiumGate.tsx`

- `useEffect`에서 `supabase.auth.getSession()` 호출
- session 없으면 즉시 `/{locale}/login/` 리다이렉트 (PremiumModal 표시 없음)
- session 있으면 기존 premium 체크 진행
- auth 체크 중에는 스피너만 표시

**흐름 변경:**

```
Before: PremiumGate → usePremium() → isPremium false → PremiumModal 표시 (then AuthGuard redirect)
After:  PremiumGate → auth 체크 → 미인증 → /login 리다이렉트 (모달 없음)
                    → 인증 확인 → usePremium() → isPremium false → PremiumModal 표시
```

### 2. 프리미엄 서비스 상세 BottomSheet

**파일:** `src/app/[locale]/settings/page.tsx`

- 프리미엄 유저: 뱃지 클릭 → BottomSheet로 서비스 상세 표시
- 비프리미엄 유저: 뱃지 클릭 → 기존대로 `/pricing` 이동

**BottomSheet 내용:**
- 구독 상태 (플랜명, 결제 주기, 만료일, 자동갱신 여부)
- 프리미엄 서비스 목록 (아이콘 + 이름 + 체크마크)
- 하단 "요금제 관리" 버튼 → `/pricing` 이동

### 3. PREMIUM_FEATURES / featureIcons / featureKeys export

**파일:** `src/hooks/usePremium.ts`, `src/components/premium/PremiumModal.tsx`

- `PREMIUM_FEATURES` 맵을 `export`로 변경하여 settings 페이지에서 재사용
- `featureIcons`, `featureKeys`를 `export`로 변경

## 수정 파일 목록

| 파일 | 변경 |
|------|------|
| `src/components/premium/PremiumGate.tsx` | auth 체크 추가 |
| `src/hooks/usePremium.ts` | `PREMIUM_FEATURES` export |
| `src/components/premium/PremiumModal.tsx` | `featureIcons`, `featureKeys` export |
| `src/app/[locale]/settings/page.tsx` | 프리미엄 BottomSheet 추가 |
| `src/messages/ko.json` | BottomSheet 관련 번역 키 추가 |
| `src/messages/en.json` | BottomSheet 관련 번역 키 추가 |

## 검증 시나리오

1. **비로그인 + 프리미엄 페이지 접근**: PremiumModal 없이 바로 `/login`으로 리다이렉트
2. **로그인 + 비프리미엄 + 프리미엄 페이지 접근**: PremiumModal 정상 표시
3. **로그인 + 프리미엄 + 설정 페이지**: 뱃지 클릭 시 BottomSheet에 서비스 목록 표시
4. **비프리미엄 + 설정 페이지**: 뱃지 클릭 시 `/pricing`으로 이동
5. `pnpm build` 성공
