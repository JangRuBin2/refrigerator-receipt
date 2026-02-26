---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.md
---

# 공통 설정

미니앱에서 공통으로 사용하는 **브랜드 정보, 호스트 설정, 권한, 빌드 옵션** 등의 전역 설정을 한 곳에서 관리할 수 있어요.

이 문서에서는 **WebView**와 **React Native** 환경에서 미니앱을 시작하기 위해 반드시 필요한 기본 설정과 권장 설정을 설명해요.

기본 설정을 적용하면 **내비게이션 바가 자동으로 표시**돼요.\
또한 내비게이션 바의 **더보기 버튼**을 통해 공유하기, 신고하기 등의 기본 기능을 별도 구현 없이 바로 사용할 수 있어요.

::: tip SDK 1.6.1 이후 변경 사항
SDK 1.6.1 버전부터 내부 운영 정책 변경으로 브릿지 뷰 기능이 제거되었어요.\
이에 따라 브릿지 뷰의 색상 모드를 설정하던 `bridgeColorMode` 옵션은 더 이상 필요하지 않아요.
:::

## WebView 설정

- `appName` : 콘솔에 등록한 앱 ID를 입력해 주세요.
- `displayName` : 사용자에게 노출될 앱 이름을 입력해 주세요. 콘솔에 등록된 이름과 동일하게 입력해야 해요.
- `primaryColor` : 앱의 기본 색상 값을 지정해 주세요. 지정한 색상은 버튼 등에 적용돼요.
- `icon` : 앱의 로고 이미지 URL을 입력해 주세요. 콘솔의 앱 정보에서 업로드한 이미지를 우클릭해 링크 복사 후 넣어 주세요.
- `permissions` : 권한이 필요한 경우 설정해 주세요. [필요한 권한 설정하기](/bedrock/reference/framework/권한/permission.md) 문서를 참고해 주세요.
- `webViewProps.type` : 미니앱에 맞게 내비게이션 바를 설정할 수 있어요.
  - 게임 : `game`
  - 비게임 : `partner`

::: code-group

```typescript [게임]
interface defineConfig {
  appName: string; // 콘솔에 등록한 앱ID
  brand: {
    displayName: string; // 사용자에게 노출될 앱 이름
    primaryColor: string; // 브랜드 기본 색상(hex)
    icon: string; // 콘솔에서 업로드한 이미지의 URL(콘솔의 앱 정보에서 업로드한 이미지를 우클릭해 링크 복사 후 넣어주세요)
  };
  web: {
    host: string; // 개발 서버 호스트
    port: number; // 개발 서버 포트
    commands: {
      dev: string; // 실행 명령어
      build: string; // 빌드 명령어
    };
  };
  permissions: Permission[]; // 런타임 권한(필요 시 확장)
  outdir: string; // 빌드 산출물 경로
  webViewProps: {
    type: "game"; // 게임 내비게이션 // [!code highlight]
  };
}
```

```typescript [비게임]
interface defineConfig {
  appName: string; // 콘솔에 등록한 앱ID
  brand: {
    displayName: string; // 사용자에게 노출될 앱 이름
    primaryColor: string; // 브랜드 기본 색상(hex)
    icon: string; // 콘솔에서 업로드한 이미지의 URL(콘솔의 앱 정보에서 업로드한 이미지를 우클릭해 링크 복사 후 넣어주세요)
  };
  web: {
    host: string; // 개발 서버 호스트
    port: number; // 개발 서버 포트
    commands: {
      dev: string; // 실행 명령어
      build: string; // 빌드 명령어
    };
  };
  permissions: Permission[]; // 런타임 권한(필요 시 확장)
  outdir: string; // 빌드 산출물 경로
  webViewProps: {
    type: "partner"; // 비게임 // [!code highlight]
  };
}
```

```tsx [예시]
import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "webview-template",
  brand: {
    displayName: "웹뷰템플릿",
    primaryColor: "#3182F6",
    icon: "https://static.toss.im/icons/png/4x/icon-person-man.png",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite",
      build: "tsc -b && vite build",
    },
  },
  permissions: [
    {
      name: "clipboard",
      access: "read",
    },
    {
      name: "clipboard",
      access: "write",
    },
    {
      name: "camera",
      access: "access",
    },
    {
      name: "photos",
      access: "read",
    },
  ],
  outdir: "dist",
  webViewProps: {
    type: "partner" | "game" | "extenral",
  },
});
```

:::

## React Native 설정

- `scheme` : 앱 라우팅 스킴을 입력해 주세요. `intoss`로 입력하면 돼요.
- `appName` : 콘솔에 등록한 앱 ID를 입력해 주세요.
- `displayName` : 사용자에게 노출될 앱 이름을 입력해 주세요. 콘솔에 등록된 이름과 동일하게 입력해야 해요.
- `primaryColor` : 앱의 기본 색상 값을 지정해 주세요. 지정한 색상은 버튼 등에 적용돼요.
- `icon` : 앱의 로고 이미지 URL을 입력해 주세요. 콘솔의 앱 정보에서 업로드한 이미지를 우클릭해 링크 복사 후 넣어 주세요.
- `permissions` : 권한이 필요한 경우 설정해 주세요. [필요한 권한 설정하기](/bedrock/reference/framework/권한/permission.md) 문서를 참고해 주세요.

::: code-group

```typescript [게임]
interface defineConfig({
  scheme: string,            // 앱 라우팅 스킴 (intoss)
  appName: string,           // 콘솔에 등록한 앱ID
  plugins: [
    appsInToss({
      brand: {
        displayName: string,  // 사용자에게 노출될 앱 이름
        primaryColor: string, // 브랜드 기본 색상(hex)
        icon: string,         // 콘솔에서 업로드한 이미지의 URL(콘솔의 앱 정보에서 업로드한 이미지를 우클릭해 링크 복사 후 넣어주세요)
      },
      permissions: Permission[], // 런타임 권한(필요 시 확장)
    }),
  ],
});

```

```typescript [비게임]
interface defineConfig({
  scheme: string,            // 앱 라우팅 스킴 (intoss)
  appName: string,           // 콘솔에 등록한 앱ID
  plugins: [
    appsInToss({
      brand: {
        displayName: string,  // 사용자에게 노출될 앱 이름
        primaryColor: string, // 브랜드 기본 색상(hex)
        icon: string,         // 콘솔에서 업로드한 이미지의 URL(콘솔의 앱 정보에서 업로드한 이미지를 우클릭해 링크 복사 후 넣어주세요)
      },
      permissions: Permission[], // 런타임 권한(필요 시 확장)
    }),
  ],
});

```

```tsx [예시]
import { appsInToss } from "@apps-in-toss/framework/plugins";
import { defineConfig } from "@granite-js/react-native/config";

export default defineConfig({
  scheme: "intoss",
  appName: "rn-template",
  plugins: [
    appsInToss({
      brand: {
        displayName: "rn-template",
        primaryColor: "#3182F6",
        icon: "https://static.toss.im/icons/png/4x/icon-person-man.png",
      },
      permissions: [
        {
          name: "clipboard",
          access: "read",
        },
        {
          name: "clipboard",
          access: "write",
        },
        {
          name: "camera",
          access: "access",
        },
        {
          name: "photos",
          access: "read",
        },
      ],
    }),
  ],
});
```

:::

## 환경 변수 설정 (React Native)

React Native 미니앱에서 **빌드 시점에 환경 변수를 주입해야 하는 경우** `plugin-env` 플러그인을 사용할 수 있어요.

- `import.meta.env` 형태로 접근할 수 있어요.
- `granite.config.ts`에서만 설정할 수 있어요.

자세한 설정 방법은 [환경 변수 설정 문서](/bedrock/reference/framework/UI/Config.md)를 참고해 주세요.

## 내비게이션 바 (게임)

화면 상단에 고정되는 영역으로, 앱인토스 전용 컴포넌트가 제공돼요.\
게임용 내비게이션 바는 **투명한 배경**에 **더보기 버튼**과 **닫기(X) 버튼**으로 구성돼요.

::: tip 주의해주세요

- X 버튼이 게임 화면의 다른 버튼과 겹치지 않도록 개발해 주세요.
  - [safeArea](/bedrock/reference/framework/화면%20제어/safe-area.md) 문서를 참고하세요.
- X 버튼을 눌렀을 때는 종료 확인 모달을 반드시 표시해 주세요.
  - 텍스트 : `$서비스명$을 종료할까요?`
  - 버튼 : `취소` / `종료하기` (브랜드 컬러 적용)

:::

![](/assets/thumbnail-navigation-game.D4C6-eQu.png)

## 내비게이션 바 (비게임)

비게임 미니앱에서는 흰색 배경의 내비게이션 바가 기본으로 제공돼요.\
좌측에는 미니앱 로고와 이름이, 우측에는 더보기 버튼과 X 버튼이 위치해요.

또한, 더보기 버튼 왼쪽에 아이콘을 한 개 추가할 수 있어요.\
자세한 내용은 [내비게이션 바 설정](/bedrock/reference/framework/UI/NavigationBar.md) 문서를 참고해 주세요.

![](/assets/thumbnail-navigation-nongame.Dqi4C07P.png)

## 내비게이션 바 기능

내비게이션 바의 **더보기 버튼**을 통해 **공유하기, 신고하기** 등의 기능을 쉽게 사용할 수 있어요.\
별도 서버 연동이나 추가 구현 없이, **SDK만 적용하면 바로 사용할 수 있어요.**\
**게임, 비게임 구분 없이 WebView와 React Native 환경 모두 동일하게 동작해요.**

### 문의하기 / 신고하기

콘솔에 등록한 **고객센터 링크와 홈페이지 주소**가 자동으로 표시돼요.\
신고하기 기능을 통해 사용자가 제보를 보낼 수 있고, 파트너사는 콘솔을 통해 제보 내용을 확인할 수 있어요.

![](/assets/nav_declare.wr-d3eJN.png)

### 공유하기

**공유하기** 기능을 통해 사용자는 미니앱을 다른 사람에게 쉽게 공유할 수 있어요.\
공유 시 **미니앱 이름**과 **딥링크 주소**가 함께 전송돼요.

![](/assets/nav_share.C1afpEQo.png)

### 권한 설정

**권한 설정** 기능을 통해 사용자는 미니앱이 요청하는 권한을 확인하고, 언제든지 ON/OFF로 제어할 수 있어요.

![](/assets/nav_permission.C863hU5a.png)

### 홈 화면에 추가하기

자주 사용하는 미니앱을 휴대폰 홈 화면에 바로 등록할 수 있어요.\
토스앱 5.246.0 이상부터 확인할 수 있어요.

![](/assets/nav_shortcut.BVf9gVHl.png)

### 미니앱 용량 삭제

유저의 원활한 앱 이용 경험을 위해 자주 사용하지 않는 미니앱의 용량을 선택적으로 삭제할 수 있는 기능이 추가되었어요.\
미니앱 내비게이션 바의 설정 버튼을 통해 유저는 서비스별 데이터를 삭제할 수 있어요.

![](/assets/nav_cashdelete.DGQWKzpv.png)
