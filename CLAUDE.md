# Project Conventions

## Architecture

Feature-folder architecture. Each domain has a frontend folder and a backend folder:
- Frontend: `src/features/{name}/components/`, `hooks/`, `index.ts` (barrel export)
- Backend: `convex/{name}/queries.ts`, `mutations.ts`, `actions.ts`
- Routes: `src/routes/_app/_auth/{name}.tsx` — thin wrappers (under 20 lines) that import from features

Shared code in `src/shared/`: schemas, hooks, utils, nav items, error constants.

## Path Aliases

- `@/*` → `./src/*` (frontend code)
- `@cvx/*` → `./convex/*` (backend code)
- `~/*` → `./*` (project root)

## Adding a New Entity (e.g., tasks)

1. **Zod schema** in `src/shared/schemas/{name}.ts` — single source of truth for validation
2. **Schema table** in `convex/schema.ts` — use `zodToConvex()` to derive Convex validators from Zod schemas (don't duplicate validation logic)
3. **Backend mutations** in `convex/{name}/mutations.ts` — use `zCustomMutation` for mutations with user-typed input; plain `mutation` for simple ones (no args, or just `v.id()`)
4. **Backend queries** in `convex/{name}/queries.ts` — plain `query`
5. **Frontend components** in `src/features/{name}/`
6. **Route** in `src/routes/_app/_auth/` — thin wrapper importing page component from feature folder
7. **Wiring:**
   - Nav entry → append to `src/shared/nav.ts`
   - i18n namespace → append to `ns` array in `src/i18n.ts`
   - Translations → `public/locales/{en,es}/{name}.json`
   - Error constants → add group to `src/shared/errors.ts`

Generators (`npm run gen:feature`, `gen:route`, `gen:convex-function`, `gen:form`) scaffold steps 4-6 but NOT the Zod schema, schema table, or wiring.

## Backend Patterns

```typescript
// Convex imports use @cvx/ alias
import { mutation, query } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { internal } from "@cvx/_generated/api";

// Zod-validated mutation (for user-typed input)
import { zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
const zMutation = zCustomMutation(mutation, NoOp);

// Derive Convex validators from Zod (in schema.ts)
import { zodToConvex } from "convex-helpers/server/zod4";
const myValidator = zodToConvex(myZodSchema);
```

## Testing Patterns

- Backend tests: `convex/{name}/*.test.ts` using `convex-test` with `test` fixture from `@cvx/test.setup`
- Frontend tests: `src/features/{name}/{name}.test.tsx` using Testing Library with `renderWithRouter` from `@/test-helpers`
- Tests are co-located with source (not in a separate `tests/` directory)
- 100% test coverage required — run `npm test` to verify

## Extension Points (append-only for clean git merges)

- `src/shared/nav.ts` — `navItems` array
- `src/shared/errors.ts` — `ERRORS` object groups
- `src/i18n.ts` — `ns` namespace array

## Constraints

- `convex/schema.ts` must stay at convex root (Convex requirement)
- Route files must stay in `src/routes/` with TanStack Router naming conventions
- Reorganizing `convex/` changes all `api.*` paths — update all frontend calls in lockstep
