# Team 신선조 (ShinSeonJo) - Claude Code Teams Configuration

## Team Overview

**팀명**: 신선조 (ShinSeonJo) - "신선(Fresh) + 조(Crew)"
**미션**: MealKeeper 스마트 냉장고 관리 서비스의 병렬 개발 및 품질 관리

## Teammates

| ID | Name | Role | Domain |
|----|------|------|--------|
| `front-chef` | 프론트셰프 | Frontend & UI | Pages, Components, Hooks, i18n |
| `backend-sous` | 백엔드수셰프 | Backend & API | API Routes, DB, Validation |
| `ai-sommelier` | AI소믈리에 | AI & Data | OCR, Recipe AI, Nutrition |
| `toss-maitre` | 토스메트르 | Platform Integration | Toss SDK, Auth, IAP |
| `qa-porter` | 품질키친포터 | Quality Assurance | Tests, Security, Build |

## Activation

### CLI Command
```bash
# Start team session (inprocess mode for Windows)
claude --team 신선조

# Or with specific teammates
claude --team 신선조 --teammates front-chef,backend-sous
```

### Orchestrator Prompt
When asked to work as Team 신선조, spawn teammates using the Task tool:

```
"As the orchestrator of Team 신선조, analyze the task and delegate to the appropriate
teammates based on their domains. Use parallel Task execution for independent work."
```

## Domain Routing

When a task arrives, route to the appropriate teammate:

| Task Type | Primary | Support |
|-----------|---------|---------|
| UI/페이지 개발 | front-chef | - |
| API 엔드포인트 | backend-sous | - |
| AI 기능 (OCR, 레시피) | ai-sommelier | backend-sous |
| 토스 연동 (로그인, IAP) | toss-maitre | backend-sous |
| 테스트 작성 | qa-porter | domain owner |
| 보안 리뷰 | qa-porter | all |
| 타입 변경 | backend-sous | front-chef |
| i18n 추가 | front-chef | - |
| DB 마이그레이션 | backend-sous | qa-porter |
| 빌드 에러 | qa-porter | domain owner |

## Parallel Execution Patterns

### Feature Development (병렬)
```
Orchestrator:
├─ [parallel] front-chef: UI 컴포넌트 구현
├─ [parallel] backend-sous: API 엔드포인트 구현
├─ [parallel] ai-sommelier: AI 로직 구현 (if needed)
└─ [sequential] qa-porter: 통합 테스트 & 리뷰
```

### Code Review (병렬)
```
Orchestrator:
├─ [parallel] front-chef: UI 코드 리뷰
├─ [parallel] backend-sous: API 코드 리뷰
├─ [parallel] ai-sommelier: AI 코드 리뷰
├─ [parallel] toss-maitre: 플랫폼 코드 리뷰
└─ [parallel] qa-porter: 보안 & 품질 리뷰
```

### Bug Fix (순차)
```
Orchestrator:
├─ [1] qa-porter: 버그 재현 테스트 작성
├─ [2] domain-owner: 수정 구현
└─ [3] qa-porter: 회귀 테스트 확인
```

## Shared Resources (Conflict Zones)

These files may be edited by multiple teammates - coordinate via orchestrator:

| File | Owners | Protocol |
|------|--------|----------|
| `src/types/index.ts` | backend-sous (primary), all (read) | Announce before modifying |
| `src/types/supabase.ts` | backend-sous only | Lock during migration |
| `src/store/useStore.ts` | front-chef (primary), backend-sous | Coordinate state changes |
| `src/lib/utils.ts` | Any teammate | Check for conflicts |
| `src/messages/*.json` | front-chef (primary) | Merge translations carefully |

## Teammate Context Files

Each teammate has a detailed context file at:
```
.claude/teams/teammates/{teammate-id}.md
```

Load the appropriate file when spawning a teammate to give them full domain context.

## Workflows

### New Feature (신기능 개발)
1. Orchestrator analyzes requirements
2. qa-porter writes failing tests (TDD RED)
3. Domain teammates implement in parallel (TDD GREEN)
4. qa-porter verifies all tests pass (TDD REFACTOR)
5. All teammates review in parallel

### Release Preparation (릴리즈 준비)
1. qa-porter: Full test suite + security audit
2. front-chef + backend-sous: i18n completeness check (parallel)
3. toss-maitre: Platform compliance verification
4. qa-porter: Final build verification
