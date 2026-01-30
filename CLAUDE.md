# 밀키퍼 (MealKeeper) - Claude Code Configuration

영수증 스캔 기반 스마트 냉장고 관리 서비스

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth + Supabase Auth
- **State**: Zustand
- **i18n**: next-intl

## File Structure

```
src/
|-- app/              # Next.js App Router (pages, layouts, API routes)
|-- components/       # Reusable UI components
|-- hooks/            # Custom React hooks
|-- lib/              # Utility libraries (supabase, api clients)
|-- store/            # Zustand stores
|-- types/            # TypeScript type definitions
|-- i18n/             # Internationalization config
|-- messages/         # Translation files (ko, en)
supabase/             # Supabase migrations and config
```

## Critical Rules

### 1. Code Organization

- Many small files over few large files
- 200-400 lines typical, 800 max per file
- Organize by feature/domain
- Co-locate related files (component + hook + types)

### 2. Code Style

- Immutability always - never mutate objects or arrays
- No console.log in production code
- Proper error handling with try/catch
- Input validation with Zod
- Use `clsx` + `tailwind-merge` for conditional classes

### 3. State Management

- Zustand for global state (`src/store/`)
- React hooks for local state
- Server components for data fetching when possible

### 4. API Patterns

```typescript
// API Response Format
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Server Action Pattern
'use server'
export async function serverAction(input: Input): Promise<ApiResponse<Output>> {
  try {
    const validated = schema.parse(input)
    const result = await operation(validated)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: 'User-friendly message' }
  }
}
```

### 5. Supabase Conventions

- Use `createClient()` from `src/lib/supabase/client.ts` (client-side)
- Use `createServerClient()` from `src/lib/supabase/server.ts` (server-side)
- Row Level Security (RLS) enabled on all tables
- Migrations in `supabase/migrations/`

### 6. Internationalization

- All user-facing text in `src/messages/{locale}.json`
- Use `useTranslations()` hook for translations
- Supported locales: `ko`, `en`

## Environment Variables

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
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors
- `/e2e` - Run E2E tests with Playwright

## Database Tables

| Table | Purpose |
|-------|---------|
| profiles | User profiles |
| ingredients | User's ingredients |
| recipes | Recipes |
| user_favorites | User's favorite recipes |
| receipt_scans | OCR scan history |
| shopping_list | Smart shopping list |

## Security

- No hardcoded secrets (use .env)
- Validate all user inputs
- Use parameterized queries (Supabase handles this)
- Check authentication in server actions
- RLS policies on all tables

## Testing

- TDD: Write tests first
- 80% minimum coverage target
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical user flows
