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

### MVP-2: Animation System ✅ COMPLETED

#### 2.1 Animation Tokens ✅
```
Location: src/lib/animations.ts
Priority: HIGH
Status: COMPLETED
```

Implemented:
- [x] spring tokens (gentle, snappy, bouncy, stiff)
- [x] duration tokens (instant, fast, normal, slow)
- [x] easing tokens (toss, easeOut, easeIn)
- [x] variants (fadeIn, slideUp, slideDown, scale, press)
- [x] stagger configuration
- [x] pageTransition variants (slideFromRight, slideToRight, fade, scaleFade)
- [x] listItem and listContainer variants

#### 2.2 Page Transitions ✅
```
Location: src/components/PageTransition.tsx
Priority: MEDIUM
Status: COMPLETED
```

Features:
- [x] Slide from right (push)
- [x] Slide to right (pop)
- [x] Fade for modals
- [x] FadeTransition component
- [x] SlideTransition component with direction control
- [ ] Shared element transition (future)

#### 2.3 List Animations ✅
```
Location: tailwind.config.ts (extend)
Priority: MEDIUM
Status: COMPLETED
```

Features:
- [x] Staggered fade-in for lists (stagger-1 to stagger-5)
- [x] Slide-up on scroll reveal (fade-in-up, fade-in-down)
- [x] Exit animations (slide-out-left, slide-out-right)
- [x] Additional animations: slide-in-right, slide-in-left, scale-in, shimmer

---

### MVP-3: Typography & Spacing ✅ COMPLETED

#### 3.1 Typography Scale ✅
```
Location: tailwind.config.ts, src/app/globals.css
Priority: HIGH
Status: COMPLETED
```

Implemented in tailwind.config.ts fontSize:
- [x] `text-toss-h1` - 28px, bold, line-height 1.3
- [x] `text-toss-h2` - 22px, bold, line-height 1.4
- [x] `text-toss-h3` - 18px, semi-bold, line-height 1.4
- [x] `text-toss-body1` - 16px, regular, line-height 1.5
- [x] `text-toss-body2` - 14px, regular, line-height 1.5
- [x] `text-toss-caption` - 12px, regular, line-height 1.4

Component classes in globals.css:
- [x] `.toss-h1`, `.toss-h2`, `.toss-h3` with dark mode colors
- [x] `.toss-body1`, `.toss-body2`, `.toss-caption`
- [x] `.toss-section`, `.toss-section-title`
- [x] `.toss-card`, `.toss-list-item`

#### 3.2 Spacing System ✅
```
Location: tailwind.config.ts
Status: COMPLETED
```

Implemented 8px grid spacing:
- [x] `toss-xs`: 4px (0.25rem)
- [x] `toss-sm`: 8px (0.5rem)
- [x] `toss-md`: 16px (1rem)
- [x] `toss-lg`: 24px (1.5rem)
- [x] `toss-xl`: 32px (2rem)
- [x] `toss-2xl`: 48px (3rem)
- [x] `toss-3xl`: 64px (4rem)

Usage: `p-toss-md`, `gap-toss-sm`, `mb-toss-lg`, etc.

#### 3.3 Color Refinement ✅
```
Location: tailwind.config.ts
Priority: MEDIUM
Status: COMPLETED
```

Implemented Toss-inspired neutral gray scale:
- [x] gray-50 to gray-900 with Toss color values
- [x] Proper dark mode color mappings in typography classes

---

### MVP-4: Key Screen Redesigns ✅ COMPLETED

#### 4.1 Home Dashboard ✅
```
Location: src/app/[locale]/page.tsx
Priority: HIGH
Status: COMPLETED
```

Implemented:
- [x] Hero section with greeting + formatted date
- [x] Single focus card (expiring items alert with horizontal scroll)
- [x] Quick actions as icon buttons (4 grid layout)
- [x] Horizontal scroll for recent items
- [x] AI Recipe recommendation banner
- [x] Feature cards with chevron navigation
- [x] Toss typography and spacing applied
- [x] Motion animations (staggered, spring)

#### 4.2 Fridge Page ✅
```
Location: src/app/[locale]/fridge/page.tsx
Priority: HIGH
Status: COMPLETED
```

Implemented:
- [x] Search bar fixed at top with clear button
- [x] Storage type tabs with icons (horizontal scroll)
- [x] Card-based item display with toss-card styling
- [x] Edit/delete buttons with tap animations
- [x] Animated FAB (bouncy spring entry)
- [x] Empty state with icon illustration
- [x] BottomSheet for add/edit forms (replaces Modal)
- [x] AnimatePresence for list transitions

#### 4.3 Scan Flow ✅
```
Location: src/app/[locale]/scan/page.tsx
Priority: MEDIUM
Status: COMPLETED
```

Implemented:
- [x] Step indicator at top (dots with progress line)
- [x] Large centered upload area with breathing animation
- [x] AI Vision toggle with animated switch
- [x] Scanning animation (pulse rings)
- [x] Results in BottomSheet (80vh snap point)
- [x] Item edit inline with confidence indicators
- [x] Daily usage display with upgrade CTA
- [x] AnimatePresence for step transitions

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
