---
name: page-refactor
description: 페이지/컴포넌트 리팩토링. 300줄 이상 파일 분리, state 통합, useEffect 남용 제거, 단일 책임 원칙 적용. 반드시 하나의 파일씩 순차 처리.
---

# Page Refactor Skill

페이지 및 컴포넌트의 코드 품질을 점검하고 리팩토링한다.
기존 기능이 절대 변경되지 않도록, 반드시 하나의 파일씩 순차 처리한다.

## 실행 절차

### Step 1: 대상 파일 분석

대상 파일을 읽고 아래 체크리스트를 점검한다. 결과를 사용자에게 보고한다.

### Step 2: 사용자 확인

점검 결과를 바탕으로 리팩토링 계획을 제시하고, 사용자 승인 후 진행한다.

### Step 3: 리팩토링 실행

하나의 파일(피처)만 수정한다. 수정 후 빌드(`pnpm build`) + 타입 검사(`npx tsc --noEmit`)를 반드시 실행한다.

### Step 4: 검증

기존 기능이 동일하게 동작하는지 확인한다. 다음 파일로 넘어가기 전 사용자에게 확인을 받는다.

---

## 체크리스트

### 1. 파일 크기 (300줄 이상이면 분리)

- 페이지 파일이 300줄 이상인가?
- 한 파일에 UI + 로직 + API 호출이 모두 섞여있는가?
- 분리 기준:
  - UI 렌더링 -> 컴포넌트 (`src/features/{domain}/`)
  - 비즈니스 로직 -> 커스텀 훅 (`src/hooks/`)
  - API 호출 -> API 함수 (`src/lib/api/`)
  - 상수/타입 -> 별도 파일 (`constants.ts`, `types.ts`)

### 2. State 통합 (관련된 state는 하나로 묶기)

동일 주제의 단순 값(텍스트, 숫자, 불리언)이 여러 useState로 분산되어 있으면 하나의 객체 state로 통합한다.

```typescript
// BAD: 동일 주제인데 개별 state
const [name, setName] = useState('');
const [category, setCategory] = useState('');
const [quantity, setQuantity] = useState('');
const [unit, setUnit] = useState('');

// GOOD: 폼 데이터는 하나의 state로
const [formData, setFormData] = useState({
  name: '',
  category: '',
  quantity: '',
  unit: '',
});
```

판단 기준:
- 항상 같이 변경되는 값들인가?
- 하나의 폼/UI 섹션에 속하는가?
- 동일한 이벤트 핸들러에서 사용되는가?

주의: 독립적으로 변경되는 state는 분리 유지 (예: loading, error, modal)

### 3. useEffect 남용 방지

버튼 클릭 등 사용자 이벤트로 트리거되어야 할 로직이 useEffect에 들어가 있으면 이벤트 핸들러로 이동한다.

```typescript
// BAD: 버튼 클릭 후 state 변경을 감지해서 실행
const [shouldFetch, setShouldFetch] = useState(false);
useEffect(() => {
  if (shouldFetch) {
    fetchData();
    setShouldFetch(false);
  }
}, [shouldFetch]);
const handleClick = () => setShouldFetch(true);

// GOOD: 이벤트 핸들러에서 직접 실행
const handleClick = () => fetchData();
```

점검 대상:
- useEffect 내에 API 호출이 있는데, 초기 로딩이 아닌 사용자 액션에 의해 트리거되는 경우
- state 변경 -> useEffect 감지 -> 다른 state 변경 체인 (불필요한 리렌더링 유발)
- useEffect의 dependency가 자주 변경되는 state인 경우

허용되는 useEffect:
- 컴포넌트 마운트 시 초기 데이터 fetch
- 구독(subscription) 설정/해제
- DOM 이벤트 리스너 등록/해제
- 외부 라이브러리 초기화

### 4. 단일 책임 원칙 (SRP)

하나의 파일/컴포넌트가 너무 많은 역할을 하고 있지 않은지 점검한다.

위반 징후:
- 하나의 컴포넌트에 3개 이상의 독립적인 UI 섹션
- 2개 이상의 서로 다른 API 엔드포인트 호출
- 3개 이상의 모달/바텀시트 관리
- 파일 내 내부 컴포넌트(function SubComponent)가 2개 이상

분리 전략:
- UI 섹션별로 컴포넌트 분리
- 모달/시트별로 컴포넌트 분리
- 복잡한 로직은 커스텀 훅으로 추출

### 5. 불필요한 리렌더링 방지

- 자식 컴포넌트에 전달하는 콜백이 매번 새로 생성되는가? -> useCallback
- 계산 비용이 높은 값이 매 렌더마다 재계산되는가? -> useMemo
- 부모 state 변경 시 관련 없는 자식까지 리렌더되는가? -> 컴포넌트 분리

주의: 과도한 메모이제이션은 오히려 해로움. 실제 성능 문제가 있는 경우만 적용.

### 6. 이벤트 핸들러 정리

- 인라인 핸들러가 5줄 이상이면 별도 함수로 추출
- async 로직이 JSX 내에 직접 작성되어 있으면 추출
- 동일 패턴의 핸들러가 반복되면 공통 함수로 통합

### 7. 조건부 렌더링 정리

- 3단계 이상 중첩된 조건부 렌더링은 컴포넌트로 분리
- 삼항 연산자가 2번 이상 중첩되면 if/else 또는 컴포넌트로 분리
- 동일 조건이 JSX 여러 곳에서 반복되면 변수로 추출

### 8. 타입 안전성

- 컴포넌트 props에 타입이 명시되어 있는가?
- 이벤트 핸들러 파라미터 타입이 정확한가?
- 외부 데이터는 Zod 검증을 거치는가? (as 캐스팅 금지)

---

## 우선순위 (현재 프로젝트 기준)

| 순위 | 파일 | 줄수 | useState | 주요 이슈 |
|------|------|------|----------|-----------|
| 1 | fridge/page.tsx | 412 | 7 | 가장 큰 파일, 폼+리스트+모달 혼재 |
| 2 | settings/page.tsx | 351 | 4 | 프로필+구독+언어+테마 혼재 |
| 3 | shopping/page.tsx | 328 | 11 | state 11개 과다 |
| 4 | scan/page.tsx | 305 | 10 | state 10개 과다 |
| 5 | checkout/page.tsx | 278 | 5 | 결제 로직 분리 필요 |

---

## 금지 사항

- 기존 기능 변경 금지. UI 동작, API 호출, 사용자 플로우 동일 유지
- 병렬 수정 금지. 반드시 하나의 파일 완료 후 다음 파일 진행
- 수정 후 `pnpm build` + `npx tsc --noEmit` 반드시 통과
- 컴포넌트 분리 시 기존 export/import 구조 깨지지 않도록 주의
