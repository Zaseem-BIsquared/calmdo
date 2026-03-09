# Architecture Patterns

**Domain:** SaaS starter kit restructure (React + Convex + Stripe)
**Researched:** 2026-03-09

## Current Architecture (As-Is)

Before defining the target, here is what exists today and where the pain is.

### Current Structure

```
Root
├── errors.ts              # Flat error constants (shared by client + server)
├── types.ts               # Flat User type (imports from convex/)
├── site.config.ts         # Flat site metadata
├── convex/
│   ├── schema.ts          # Monolith: tables + validators + type exports
│   ├── app.ts             # Monolith: 7 functions across user/billing/upload domains
│   ├── stripe.ts          # Domain-scoped but 400 lines, mixes queries/mutations/actions
│   ├── http.ts            # Webhook router (tightly coupled to stripe.ts)
│   ├── auth.ts            # Auth config
│   ├── env.ts             # Env vars
│   ├── email/             # Already domain-scoped (good pattern)
│   └── otp/               # Already domain-scoped (good pattern)
├── src/
│   ├── routes/            # TanStack Router (150+ line route files with inline UI)
│   ├── ui/                # Shared primitives (button, input, dropdown, etc.)
│   ├── utils/             # validators.ts, misc.ts
│   └── i18n.ts            # Single namespace i18n
└── public/locales/{en,es}/translation.json  # Single file per language
```

### Current Pain Points

| Problem | Impact |
|---------|--------|
| `convex/app.ts` mixes user profile, billing, and file upload concerns | Cannot delete/add features without touching catch-all |
| Route files are 150-230 lines with inline components, form logic, API calls | Cannot test, reuse, or move UI independently of routes |
| `errors.ts` and `types.ts` at project root | No clear ownership; plugins will conflict on these |
| Single `translation.json` per language | Plugin merges will create conflicts on every addition |
| `api.app.getCurrentUser` called from everywhere | Renaming the file breaks every consumer in lockstep |

---

## Recommended Architecture (To-Be)

### Target Structure

```
Root
├── src/
│   ├── main.tsx                          # App entry
│   ├── app.tsx                           # Provider tree
│   ├── router.tsx                        # TanStack Router config
│   ├── routes/                           # THIN route files (framework requirement)
│   │   ├── __root.tsx
│   │   ├── _app.tsx
│   │   ├── _app/_auth.tsx
│   │   ├── _app/_auth/dashboard/_layout.index.tsx       # imports from features/
│   │   ├── _app/_auth/dashboard/_layout.settings.tsx    # imports from features/
│   │   └── ...
│   ├── features/                         # CORE: domain-organized frontend code
│   │   ├── auth/
│   │   │   ├── components/               # LoginForm, OTPInput, etc.
│   │   │   ├── hooks/                    # useSignOut, useAuth
│   │   │   └── auth.test.tsx
│   │   ├── user/
│   │   │   ├── components/               # AvatarUpload, UsernameForm, DeleteAccount
│   │   │   ├── hooks/                    # useCurrentUser
│   │   │   └── user.test.tsx
│   │   ├── billing/
│   │   │   ├── components/               # PlanSelector, CheckoutSuccess
│   │   │   ├── hooks/                    # useSubscription, useCheckout
│   │   │   └── billing.test.tsx
│   │   └── onboarding/
│   │       ├── components/               # UsernameStep
│   │       ├── hooks/
│   │       └── onboarding.test.tsx
│   ├── shared/
│   │   ├── schemas/                      # Zod v4 schemas (client+server)
│   │   │   ├── user.ts                   # username validator lives here
│   │   │   └── billing.ts               # currency, interval validators
│   │   ├── errors/                       # Error constants, namespaced by domain
│   │   │   ├── index.ts                  # Re-exports all
│   │   │   ├── auth.ts
│   │   │   ├── billing.ts
│   │   │   └── common.ts
│   │   ├── config/
│   │   │   └── site.ts                   # site.config.ts moves here
│   │   ├── types/
│   │   │   └── user.ts                   # User type
│   │   └── navigation.ts                # Data-driven nav items (plugin-friendly)
│   ├── ui/                               # Stays: design system primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── i18n.ts                           # Config stays, translations namespaced
├── convex/
│   ├── schema.ts                         # MUST stay at root (framework requirement)
│   ├── http.ts                           # HTTP router, delegates to domain handlers
│   ├── auth.ts                           # Auth config
│   ├── auth.config.ts
│   ├── _generated/                       # Convex generated (untouchable)
│   ├── user/                             # Domain: user management
│   │   ├── queries.ts                    # getCurrentUser, getUserById
│   │   ├── mutations.ts                  # updateUsername, updateUserImage, deleteAccount
│   │   └── user.test.ts
│   ├── billing/                          # Domain: Stripe + subscriptions
│   │   ├── queries.ts                    # getActivePlans, getCurrentUserSubscription
│   │   ├── mutations.ts                  # createSubscription, replaceSubscription
│   │   ├── actions.ts                    # createCheckout, createPortal, createCustomer
│   │   ├── webhooks.ts                   # Webhook event handlers (extracted from http.ts)
│   │   └── billing.test.ts
│   ├── email/                            # Already domain-scoped (keep as-is)
│   ├── otp/                              # Already domain-scoped (keep as-is)
│   ├── shared/
│   │   └── env.ts                        # env.ts moves here
│   └── init.ts                           # Seed data (stays at root)
├── plopfile.mjs                          # CLI generator config (ESM, not .ts)
├── plop-templates/                       # Handlebars templates for generators
│   ├── feature/
│   ├── route/
│   ├── convex-function/
│   └── form/
└── public/locales/
    ├── en/
    │   ├── common.json                   # Shared strings
    │   ├── auth.json                     # Auth feature strings
    │   ├── billing.json                  # Billing feature strings
    │   └── user.json                     # User feature strings
    └── es/
        ├── common.json
        ├── auth.json
        ├── billing.json
        └── user.json
```

---

## Component Boundaries

### Layer 1: Framework Shells (routes, providers, entry points)

These files are constrained by framework requirements and should contain minimal logic.

| Component | Responsibility | Owns | Does NOT Own |
|-----------|---------------|------|-------------|
| `src/routes/*` | URL-to-component mapping | Route params, loading states, `beforeLoad` metadata | Business logic, form state, API calls |
| `src/app.tsx` | Provider tree assembly | ConvexProvider, QueryClient, i18n, HelmetProvider | Any domain logic |
| `src/router.tsx` | TanStack Router config | Route tree, context shape | Nothing else |
| `convex/schema.ts` | Table definitions + validators | All table shapes, validator exports | Business logic |
| `convex/http.ts` | HTTP route registration | Route-to-handler mapping | Webhook processing logic |

**Rule:** Route files become thin delegates. A route file imports a component from `src/features/` and renders it. Maximum ~20 lines per route file.

### Layer 2: Feature Modules (the core of the restructure)

Each feature is a self-contained vertical slice through the stack.

| Feature | Frontend (`src/features/X/`) | Backend (`convex/X/`) | Shared Schema |
|---------|------------------------------|----------------------|---------------|
| **user** | AvatarUpload, UsernameForm, DeleteAccount, useCurrentUser | getCurrentUser, updateUsername, updateUserImage, removeUserImage, deleteAccount | `user.ts` (username) |
| **billing** | PlanSelector, CheckoutSuccess, BillingSettings | getActivePlans, createCheckout, createPortal, webhook handlers | `billing.ts` (currency, interval, planKey) |
| **auth** | LoginForm, OTPInput | (managed by @convex-dev/auth) | -- |
| **onboarding** | UsernameStep | completeOnboarding | reuses `user.ts` schema |

**Boundary rules:**
- Features may import from `src/shared/` and `src/ui/` -- never from other features
- Features may import from `convex/shared/` -- never from other feature backends
- Cross-feature data flows through Convex queries (e.g., billing reads user via `ctx.db`, not by importing from `convex/user/`)

### Layer 3: Shared Infrastructure

| Component | Responsibility | Who Imports It |
|-----------|---------------|----------------|
| `src/shared/schemas/` | Zod v4 validation schemas | Frontend features + Convex mutations (via `~/src/shared/schemas/`) |
| `src/shared/errors/` | Error constant strings, namespaced | Frontend features + Convex functions (via `~/src/shared/errors/`) |
| `src/shared/config/` | Site metadata | Layout components |
| `src/shared/navigation.ts` | Data-driven nav items array | Navigation component |
| `src/ui/` | Design system primitives | All frontend features |
| `convex/shared/env.ts` | Environment variable exports | Convex domain modules |

### Layer 4: Plugin Surface Area

Files specifically designed for clean git merges when plugin branches are merged.

| Plugin-Friendly File | Merge Strategy | Why |
|---------------------|----------------|-----|
| `src/shared/navigation.ts` | Data-driven array; plugins append items | Avoids JSX merge conflicts in Navigation component |
| `src/shared/errors/{domain}.ts` | One file per domain; plugins add new files | No conflicts with existing error files |
| `public/locales/{lang}/{feature}.json` | One JSON per feature; plugins add new files | No conflicts with existing translations |
| `convex/schema.ts` | Plugins add new `defineTable()` calls at end | Append-only pattern minimizes conflicts |

---

## Data Flow

### Primary Data Flow: User Loads Dashboard

```
Browser
  --> src/routes/_app/_auth/dashboard/_layout.index.tsx   (thin route)
        --> src/features/user/hooks/useCurrentUser.ts
              --> useQuery(convexQuery(api.user.queries.getCurrentUser, {}))
                    --> convex/user/queries.ts :: getCurrentUser
                          ├─> ctx.db.get(userId)           -- users table
                          ├─> ctx.db.query("subscriptions") -- subscriptions table
                          └─> ctx.storage.getUrl(imageId)  -- file storage
                    --> returns User type to React
        --> src/features/user/components/Dashboard.tsx     (renders with User)
```

### Shared Schema Flow: Zod Validation

```
src/shared/schemas/user.ts          <-- Single source of truth
  ├─> src/features/user/components/UsernameForm.tsx   (client-side validation via TanStack Form)
  ├─> src/features/onboarding/components/UsernameStep.tsx
  └─> convex/user/mutations.ts :: updateUsername      (server-side via zCustomMutation)
        imports from "~/src/shared/schemas/user"      (~ alias resolves to project root)
```

**Verified:** The `~/` path alias is already configured in `convex/tsconfig.json` (`"~/*": ["../*"]`) and actively used for `~/errors` imports. Convex's bundler resolves these paths at deploy time. Schemas in `src/shared/schemas/` are reachable from `convex/` via `~/src/shared/schemas/`.

### API Path Changes

Moving `convex/app.ts` functions into domain folders changes all API paths:

| Before | After |
|--------|-------|
| `api.app.getCurrentUser` | `api.user.queries.getCurrentUser` |
| `api.app.updateUsername` | `api.user.mutations.updateUsername` |
| `api.app.updateUserImage` | `api.user.mutations.updateUserImage` |
| `api.app.removeUserImage` | `api.user.mutations.removeUserImage` |
| `api.app.generateUploadUrl` | `api.user.mutations.generateUploadUrl` |
| `api.app.deleteCurrentUserAccount` | `api.user.mutations.deleteCurrentUserAccount` |
| `api.app.getActivePlans` | `api.billing.queries.getActivePlans` |
| `api.app.completeOnboarding` | `api.onboarding.mutations.completeOnboarding` |
| `api.stripe.createSubscriptionCheckout` | `api.billing.actions.createSubscriptionCheckout` |
| `api.stripe.createCustomerPortal` | `api.billing.actions.createCustomerPortal` |
| `internal.stripe.*` | `internal.billing.mutations.*` / `internal.billing.queries.*` |

All frontend consumers must be updated in one commit. This is a one-time cost.

---

## Patterns to Follow

### Pattern 1: Thin Route Files

**What:** Route files import and render a component from `src/features/`. They define route metadata in `beforeLoad` but contain zero business logic.

**When:** Every route file after restructure.

**Example:**
```typescript
// src/routes/_app/_auth/dashboard/_layout.settings.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/user/components/SettingsPage";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout/settings/")({
  component: SettingsPage,
  beforeLoad: () => ({
    title: "Settings",
    headerTitle: "Settings",
    headerDescription: "Manage your account settings.",
  }),
});
```

### Pattern 2: Feature Barrel Exports

**What:** Each feature exposes its public API via an `index.ts` barrel. Internal components are not re-exported.

**When:** Any time one feature or a route needs to consume from a feature module.

**Example:**
```typescript
// src/features/user/index.ts
export { SettingsPage } from "./components/SettingsPage";
export { AvatarUpload } from "./components/AvatarUpload";
export { useCurrentUser } from "./hooks/useCurrentUser";
```

### Pattern 3: Shared Schemas in `src/shared/schemas/` (Cross-Stack)

**What:** Zod schemas live in `src/shared/schemas/` and are imported by both frontend components and Convex mutations via the `~/` path alias.

**When:** Any validation that must be consistent between client and server.

**Why `src/shared/` not `convex/shared/`:** Schemas are pure TypeScript (no browser or Convex runtime dependencies). They logically belong with the shared frontend code. The `~/` alias already exists and is already used in production (`~/errors`). Keeping schemas in `src/` makes them discoverable alongside the frontend code that defines them.

**Example:**
```typescript
// src/shared/schemas/user.ts
import { z } from "zod";

export const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens, underscores");

// convex/user/mutations.ts
import { usernameSchema } from "~/src/shared/schemas/user";
// Use with zCustomMutation from convex-helpers
```

### Pattern 4: Data-Driven Navigation

**What:** Navigation items are defined as a typed array in `src/shared/navigation.ts`, not hardcoded JSX. The Navigation component maps over this array.

**When:** Always. This is the primary plugin merge surface.

**Example:**
```typescript
// src/shared/navigation.ts
export type NavItem = {
  label: string;
  path: string;
  i18nKey?: string;
};

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", i18nKey: "nav.dashboard" },
  { label: "Settings", path: "/dashboard/settings", i18nKey: "nav.settings" },
  { label: "Billing", path: "/dashboard/settings/billing", i18nKey: "nav.billing" },
];
```

### Pattern 5: Namespaced i18n

**What:** Each feature has its own JSON translation file. The i18n config loads feature namespaces.

**When:** All new features and during restructure of existing translations.

**Example:**
```typescript
// i18n usage in a feature component
const { t } = useTranslation("billing");
// loads from public/locales/en/billing.json
```

### Pattern 6: Convex Domain Modules Split by Function Type

**What:** Each domain in `convex/` separates queries, mutations, and actions into distinct files.

**When:** Every Convex domain module.

**Why not a single file per domain:** The generated `api` paths follow file structure. `convex/billing/queries.ts` creates `api.billing.queries.getActivePlans` which is self-documenting. A single `convex/billing.ts` would flatten everything under `api.billing.*`, losing the query/mutation distinction.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Feature-to-Feature Imports

**What:** `src/features/billing/` importing directly from `src/features/user/`.

**Why bad:** Creates hidden coupling. Moving or deleting a feature breaks other features. Plugin features cannot depend on optional features.

**Instead:** Share through `src/shared/`. If billing needs the User type, that type lives in `src/shared/types/user.ts`. If billing needs to check subscription status, it calls its own Convex query that reads the subscriptions table directly.

### Anti-Pattern 2: Convex Barrel Re-exports

**What:** Creating `convex/user/index.ts` that re-exports from queries.ts and mutations.ts.

**Why bad:** Convex generates API paths based on file paths. An `index.ts` barrel would create `api.user.index.getCurrentUser` instead of `api.user.queries.getCurrentUser`. Convex does not follow barrel export conventions.

**Instead:** Import directly from the specific file. Use the full path in frontend code: `api.user.queries.getCurrentUser`.

### Anti-Pattern 3: Splitting schema.ts by Domain

**What:** Creating `convex/user/schema.ts`, `convex/billing/schema.ts` and composing them into the root schema.

**Why bad:** Convex requires a single `defineSchema()` call in `convex/schema.ts`. Spreading table definitions across files adds indirection for zero benefit -- the schema file is a single source of truth for database shape and should remain monolithic.

**Instead:** Keep `convex/schema.ts` as one file. Extract validators (like `currencyValidator`) into `src/shared/schemas/` where they can be shared.

### Anti-Pattern 4: Duplicating Validation Rules

**What:** Defining validation rules separately in frontend components and Convex mutations.

**Why bad:** Rules drift apart. The current codebase has exactly this bug: UI says "32 characters max" but Zod enforces `max(20)`.

**Instead:** One Zod schema in `src/shared/schemas/`, imported by both sides.

---

## Suggested Build Order

The restructure has hard dependencies. Building in the wrong order causes rework.

### Phase 1: Shared Infrastructure (foundation)

**Build:** `src/shared/` directory with schemas, errors, types, config, navigation.

**Why first:** Everything else depends on these. Moving `errors.ts`, `types.ts`, `site.config.ts` into `src/shared/` and splitting `errors.ts` into namespaced files establishes the import paths that all subsequent work will use.

**Risk:** LOW. Pure file moves + re-exports.

### Phase 2: Convex Backend Restructure (the big bang)

**Build:** Domain folders in `convex/`, split `app.ts` and `stripe.ts`.

**Why second:** Must happen before frontend features can be organized, because frontend features need stable `api.*` import paths to target.

**Risk:** MEDIUM. All `api.*` paths change atomically.

### Phase 3: Frontend Feature Folders

**Build:** `src/features/` with user, billing, auth, onboarding modules.

**Why third:** Depends on stable backend API paths from Phase 2.

**Risk:** LOW-MEDIUM. Mostly mechanical extraction.

### Phase 4: i18n Namespace Split + Zod Server Validation

**Build:** Split monolithic translation files into per-feature namespaces. Wire Zod schemas into Convex mutations.

**Why fourth:** Depends on feature boundaries being stable.

**Risk:** LOW for i18n. MEDIUM for Zod+Convex integration (needs testing).

### Phase 5: Plugin Infrastructure + CLI Generators

**Build:** Git branch-based plugin system, install script, Plop.js generators.

**Why last:** Requires the full feature-folder structure to be stable.

**Risk:** MEDIUM. Git merge strategies need real-world testing.

---

## Scalability Considerations

| Concern | At 5 features | At 15 features | At 30+ features |
|---------|---------------|----------------|-----------------|
| Feature discovery | Browse `src/features/` | Browse `src/features/` | Need feature index/README |
| Build time | Negligible | Negligible (Vite tree-shakes) | Still fast, Convex deploys per-function |
| API path length | `api.user.queries.X` (fine) | Same pattern (fine) | Consider grouping (`api.social.post.queries.X`) |
| i18n file count | ~12 files | ~36 files | Lazy-load namespaces (already supported) |
| Plugin conflicts | Rare | Occasional on shared files | Need conflict resolution docs |

## Sources

- Codebase analysis (primary source -- all findings are HIGH confidence)
- `convex/tsconfig.json`: `"~/*": ["../*"]` path alias verified, `../errors.ts` in include list
- Convex documentation: `schema.ts` must be at convex root, `_generated/api.d.ts` paths follow file structure
- TanStack Router: route files must stay in `src/routes/` with framework naming convention
- [bulletproof-react project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [Convex project configuration](https://docs.convex.dev/production/project-configuration)
