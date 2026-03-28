# Project Conventions

## Architecture

Feature-folder architecture. Each domain has a frontend folder and a backend folder:
- Frontend: `src/features/{name}/components/`, `hooks/`, `index.ts` (barrel export)
- Backend: `convex/{name}/queries.ts`, `mutations.ts`, `actions.ts`
- Routes: `src/routes/_app/_auth/dashboard/_layout.{name}.tsx` — thin wrappers (under 20 lines) that import from features

Shared code in `src/shared/`: schemas, hooks, utils, nav items, error constants.

### Frontend Features

auth, dashboard, onboarding, settings, uploads, tasks, projects, subtasks, work-logs, activity-logs

### Backend Domains

tasks, projects, subtasks, work-logs, activity-logs, auth, devEmails, email, onboarding, otp, password, uploads, users

### Shared Schemas (`src/shared/schemas/`)

tasks.ts, projects.ts, subtasks.ts, work-logs.ts, activity-logs.ts, username.ts

## Path Aliases

- `@/*` → `./src/*` (frontend code)
- `@cvx/*` → `./convex/*` (backend code)
- `~/*` → `./*` (project root)

## Adding a New Entity

1. **Spec file** — create `src/features/{name}/{name}.gen.yaml` defining fields, behaviors, views, relationships, indexes (see `src/features/tasks/tasks.gen.yaml` for reference)
2. **Generator** — run `npm run gen:feature` which reads the `.gen.yaml` and generates schema, backend, frontend, route, tests, and i18n files
3. **Zod schema** — generated at `src/shared/schemas/{name}.ts`, review and adjust
4. **Schema table** — update `convex/schema.ts` with `zodToConvex()` to derive Convex validators from Zod schemas (don't duplicate validation logic)
5. **Wiring (manual):**
   - Nav entry → append to `src/shared/nav.ts`
   - i18n namespace → append to `ns` array in `src/i18n.ts`
   - Translations → `public/locales/{en,es}/{name}.json`
   - Error constants → add group to `src/shared/errors.ts`

### Available Generators

| Command | Purpose |
|---------|---------|
| `npm run gen:feature` | Full CRUD feature from `.gen.yaml` spec |
| `npm run gen:schema` | Zod schema + update `convex/schema.ts` |
| `npm run gen:backend` | Convex mutations, queries, and tests |
| `npm run gen:frontend` | Frontend components, route, and wiring |
| `npm run gen:route` | Route file (with optional auth guard) |
| `npm run gen:convex-function` | Single Convex query/mutation/action |

Generator infrastructure: `plopfile.js` (entry), `generators/*.js` (ESM with JSDoc types), `generators/utils/*.js` (helpers), `templates/feature/` (26 Handlebars templates), `templates/defaults.yaml` (field/behavior defaults).

## Backend Patterns

```typescript
// Convex imports use @cvx/ alias
import { mutation, query } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { internal } from "@cvx/_generated/api";

// Zod-validated mutation (for user-typed input — strings, numbers, booleans)
import { zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
const zMutation = zCustomMutation(mutation, NoOp);

// Derive Convex validators from Zod (in schema.ts)
import { zodToConvex } from "convex-helpers/server/zod4";
const myValidator = zodToConvex(myZodSchema);
```

### zCustomMutation Gotcha

Do NOT mix `v.id()` (Convex validator) inside Zod `.extend()` calls — this causes runtime errors. Use `zMutation` for mutations with pure user-typed input (create forms). Use plain `mutation` with Convex validators (`v.id()`, `v.string()`, etc.) for mutations that take document IDs as args (update, delete, assign).

Pattern in practice (see `convex/tasks/mutations.ts`):
- `create` → `zMutation` with Zod-validated args (title, description, priority)
- `update`, `remove`, `assign` → plain `mutation` with `v.id("tasks")` args

## Auth System

- `@convex-dev/auth` with three providers: Password, OTP (email code), GitHub OAuth
- Password provider uses named import: `import { Password } from "@convex-dev/auth/providers/Password"`
- Password reset uses provider id `"password-reset"` (not `"resend-otp"`) to avoid collision with the OTP provider
- Email delivery via Resend (`convex/otp/ResendOTP.ts`, `convex/password/ResendOTPPasswordReset.ts`)
- Auth config: `convex/auth.ts`, `convex/auth.config.ts`
- Auth tables auto-created by `authTables` spread in `convex/schema.ts`

### Dev Mailbox

Dev environment: OTP and password-reset emails are intercepted and stored in `devEmails` table, viewable at `/dev/mailbox` route. Gated by `DEV_MAILBOX` env var — defaults to enabled (only `"false"` disables interception).

## Testing Patterns

- 300+ tests across 35 test files, 100% coverage enforced by pre-commit hook
- Backend tests: `convex/{name}/*.test.ts` using `feather-testing-convex` with `test` fixture from `@cvx/test.setup`
- Frontend tests: `src/features/{name}/{name}.test.tsx` using Testing Library with `renderWithRouter` from `@/test-helpers` and `ConvexTestClient` from `feather-testing-convex`
- Tests are co-located with source (not in a separate `tests/` directory)
- Run `npm test` to verify (must pass with 100% coverage)

## Extension Points (append-only for clean git merges)

- `src/shared/nav.ts` — `navItems` array
- `src/shared/errors.ts` — `ERRORS` object groups
- `src/i18n.ts` — `ns` namespace array

## Constraints

- `convex/schema.ts` must stay at convex root (Convex requirement)
- Route files must stay in `src/routes/` with TanStack Router naming conventions
- Reorganizing `convex/` changes all `api.*` paths — update all frontend calls in lockstep
