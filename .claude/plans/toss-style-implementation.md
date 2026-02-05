# Toss Style UI/UX Implementation Plan

## Overview

토스 앱의 핵심 디자인 철학을 MealKeeper에 적용하는 계획

## Toss Design Principles

1. **Radical Simplicity** - 불필요한 요소 제거, 핵심만 남김
2. **Smooth Motion** - Spring 기반 자연스러운 애니메이션
3. **Bottom Sheet First** - 모달 대신 바텀 시트
4. **Instant Feedback** - 모든 인터랙션에 즉각적 피드백
5. **Bold Typography** - 명확한 타이포그래피 계층
6. **Generous Whitespace** - 여백을 통한 집중
7. **Progressive Disclosure** - 단계별 정보 노출

---

## MVP Scope (Phase 1)

### MVP-1: Core Components

#### 1.1 BottomSheet Component
```
Location: src/components/ui/BottomSheet.tsx
Priority: CRITICAL
```

Features:
- [ ] Drag-to-dismiss gesture
- [ ] Snap points (25%, 50%, 75%, 100%)
- [ ] Spring animation on open/close
- [ ] Backdrop with blur
- [ ] Handle indicator
- [ ] Keyboard aware (mobile)

Replace:
- Modal.tsx (partial) -> BottomSheet for mobile actions
- ConfirmDialog -> BottomSheet variant

#### 1.2 Skeleton Component
```
Location: src/components/ui/Skeleton.tsx
Priority: HIGH
```

Features:
- [ ] Shimmer animation
- [ ] Preset variants (text, avatar, card, list-item)
- [ ] Customizable dimensions
- [ ] Dark mode support

Usage:
- Ingredient list loading
- Recipe cards loading
- Dashboard stats loading

#### 1.3 Enhanced Button with Haptic
```
Location: src/components/ui/Button.tsx (modify)
Priority: HIGH
```

Features:
- [ ] Scale down on press (0.97)
- [ ] Haptic feedback trigger (vibrate API)
- [ ] Ripple effect option
- [ ] Loading state with skeleton

#### 1.4 Toast Redesign
```
Location: src/components/ui/Toast.tsx (modify)
Priority: MEDIUM
```

Changes:
- [ ] Bottom-center position (토스 스타일)
- [ ] Swipe to dismiss
- [ ] Icon + message layout
- [ ] Progress bar for auto-dismiss

---

### MVP-2: Animation System

#### 2.1 Animation Tokens
```
Location: src/lib/animations.ts
Priority: HIGH
```

```typescript
export const spring = {
  gentle: { damping: 20, stiffness: 100 },
  snappy: { damping: 25, stiffness: 300 },
  bouncy: { damping: 10, stiffness: 200 },
}

export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
}

export const easing = {
  toss: [0.25, 0.1, 0.25, 1], // Toss custom easing
}
```

#### 2.2 Page Transitions
```
Location: src/components/PageTransition.tsx
Priority: MEDIUM
```

Features:
- [ ] Slide from right (push)
- [ ] Slide to right (pop)
- [ ] Fade for modals
- [ ] Shared element transition (future)

#### 2.3 List Animations
```
Location: tailwind.config.ts (extend)
Priority: MEDIUM
```

Features:
- [ ] Staggered fade-in for lists
- [ ] Slide-up on scroll reveal
- [ ] Exit animations

---

### MVP-3: Typography & Spacing

#### 3.1 Typography Scale
```
Location: tailwind.config.ts
Priority: HIGH
```

토스 스타일 타이포그래피:
```css
/* Headlines - Bold, Large */
.toss-h1 { font-size: 28px; font-weight: 700; line-height: 1.3; }
.toss-h2 { font-size: 22px; font-weight: 700; line-height: 1.4; }
.toss-h3 { font-size: 18px; font-weight: 600; line-height: 1.4; }

/* Body - Regular */
.toss-body1 { font-size: 16px; font-weight: 400; line-height: 1.5; }
.toss-body2 { font-size: 14px; font-weight: 400; line-height: 1.5; }

/* Caption - Light */
.toss-caption { font-size: 12px; font-weight: 400; color: #8B95A1; }
```

#### 3.2 Spacing System
```
Toss uses 8px grid system
```

- `space-xs`: 4px
- `space-sm`: 8px
- `space-md`: 16px
- `space-lg`: 24px
- `space-xl`: 32px
- `space-2xl`: 48px

#### 3.3 Color Refinement
```
Location: tailwind.config.ts
Priority: MEDIUM
```

```typescript
colors: {
  // Toss-inspired neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F2F4F6',
    200: '#E5E8EB',
    300: '#D1D6DB',
    400: '#B0B8C1',
    500: '#8B95A1',
    600: '#6B7684',
    700: '#4E5968',
    800: '#333D4B',
    900: '#191F28',
  },
  // Keep primary orange but refine
  primary: {
    // ... existing with slight adjustments
  }
}
```

---

### MVP-4: Key Screen Redesigns

#### 4.1 Home Dashboard
```
Location: src/app/[locale]/page.tsx
Priority: HIGH
```

Changes:
- [ ] Hero section with greeting + date
- [ ] Single focus card (expiring items alert)
- [ ] Quick actions as icon buttons (not cards)
- [ ] Horizontal scroll for recent items
- [ ] Pull to refresh

Layout:
```
+---------------------------+
|  안녕하세요, 사용자님       |
|  오늘도 신선하게           |
+---------------------------+
|  [!] 3일 내 소비 필요      |
|  +------------------------+|
|  | 우유 | 계란 | 두부 ... ||
|  +------------------------+|
+---------------------------+
|  빠른 메뉴                 |
|  [스캔] [냉장고] [레시피]   |
+---------------------------+
|  최근 추가                 |
|  [item] [item] [item] ->   |
+---------------------------+
```

#### 4.2 Fridge Page
```
Location: src/app/[locale]/fridge/page.tsx
Priority: HIGH
```

Changes:
- [ ] Search bar fixed at top
- [ ] Category tabs (horizontal scroll)
- [ ] Card-based item display
- [ ] Swipe to delete/edit
- [ ] FAB for add (keep but animate)
- [ ] Empty state illustration

#### 4.3 Scan Flow
```
Location: src/app/[locale]/scan/page.tsx
Priority: MEDIUM
```

Changes:
- [ ] Step indicator at top
- [ ] Large centered upload area
- [ ] Camera permission flow
- [ ] Scanning animation (pulse)
- [ ] Results in BottomSheet
- [ ] Item edit inline

---

## Phase 2 (Post-MVP)

### P2-1: Advanced Interactions
- [ ] Pull to refresh everywhere
- [ ] Swipe gestures on list items
- [ ] Long press context menu
- [ ] Drag to reorder

### P2-2: Micro-interactions
- [ ] Success checkmark animation
- [ ] Error shake animation
- [ ] Number counter animation
- [ ] Progress ring animation

### P2-3: Premium UI
- [ ] Premium badge with shine effect
- [ ] Feature comparison table
- [ ] Pricing card redesign

### P2-4: Dark Mode Enhancement
- [ ] True black background option
- [ ] Reduced motion support
- [ ] High contrast mode

---

## Implementation Order

```
Week 1:
├── MVP-1.1: BottomSheet (2 days)
├── MVP-1.2: Skeleton (1 day)
└── MVP-2.1: Animation tokens (0.5 day)

Week 2:
├── MVP-1.3: Button enhancement (1 day)
├── MVP-3.1: Typography (0.5 day)
├── MVP-3.2: Spacing (0.5 day)
└── MVP-4.1: Home redesign (2 days)

Week 3:
├── MVP-4.2: Fridge redesign (2 days)
├── MVP-1.4: Toast redesign (1 day)
└── MVP-2.2: Page transitions (1 day)

Week 4:
├── MVP-4.3: Scan flow (2 days)
├── MVP-2.3: List animations (1 day)
├── MVP-3.3: Color refinement (0.5 day)
└── Testing & polish (0.5 day)
```

---

## File Changes Summary

### New Files
```
src/components/ui/BottomSheet.tsx
src/components/ui/Skeleton.tsx
src/components/PageTransition.tsx
src/lib/animations.ts
src/hooks/useHaptic.ts
```

### Modified Files
```
src/components/ui/Button.tsx
src/components/ui/Toast.tsx
src/components/ui/Card.tsx
src/app/[locale]/page.tsx
src/app/[locale]/fridge/page.tsx
src/app/[locale]/scan/page.tsx
tailwind.config.ts
src/app/globals.css
```

---

## Dependencies

### Required
```json
{
  "framer-motion": "^11.0.0"  // Animation library
}
```

### Optional (Phase 2)
```json
{
  "@radix-ui/react-dialog": "^1.0.0",  // Accessible primitives
  "react-spring": "^9.7.0"  // Alternative animation
}
```

---

## Success Criteria

### MVP Complete When:
1. BottomSheet replaces modals for mobile actions
2. Skeleton shows during all loading states
3. Button has press feedback
4. Home page matches Toss layout pattern
5. Fridge page has improved card layout
6. Page transitions are smooth
7. Typography hierarchy is clear

### Quality Checks:
- [ ] 60fps animations on mid-tier devices
- [ ] No layout shifts during loading
- [ ] Touch targets >= 44px
- [ ] Consistent spacing (8px grid)
- [ ] Dark mode works properly

---

## Notes

- framer-motion 필수 설치 (현재 없음)
- 기존 Modal 유지하되 모바일에서 BottomSheet 우선
- 점진적 적용 - 기존 기능 깨지지 않게
- 성능 모니터링 필수 (React DevTools Profiler)
