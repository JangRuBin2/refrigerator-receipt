# Coding Style

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate:

```javascript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

## File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large components
- Organize by feature/domain, not by type

## Error Handling

ALWAYS handle errors comprehensively:

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Detailed user-friendly message')
}
```

## Input Validation

ALWAYS validate user input:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## External Data Validation (CRITICAL)

서버/외부에서 넘어오는 타입 추론 불가 데이터는 `as` 캐스팅 절대 금지.
반드시 Zod 스키마 또는 안전한 파서 함수로 타입을 검증해야 한다.

대상:
- Supabase 쿼리 결과 (`Json` 타입 컬럼)
- Edge Function 응답 (`callEdgeFunction` 반환값)
- 토스 SDK 콜백 데이터
- 외부 API 응답

```typescript
// WRONG: as 캐스팅 (런타임 에러 가능)
const data = await getRecipes() as Recipe[]

// CORRECT: Zod 검증
const recipeSchema = z.object({
  id: z.string(),
  title: z.record(z.string(), z.string()),
})
const data = recipeSchema.parse(await getRecipes())

// CORRECT: 안전한 파서 함수
function safeRecord(v: unknown): Record<string, string> {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, string>;
  return {};
}
```

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
