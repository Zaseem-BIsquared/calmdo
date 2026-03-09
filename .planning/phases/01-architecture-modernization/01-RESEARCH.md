# Phase 1: Architecture Modernization - Research

**Researched:** 2026-03-09
**Domain:** Feature-folder restructure, shared Zod validation, git-branch plugin system, CLI generators, documentation
**Confidence:** HIGH

## Summary

This phase transforms a flat codebase into a feature-folder architecture (6 domains: auth, onboarding, billing, dashboard, uploads, settings), adds shared Zod validation with convex-helpers/server/zod4, builds a git-branch plugin system with 3 demo plugins, creates 4 Plop.js generators, and documents everything. The codebase is a React 19 + Convex + TanStack Router/Query/Form + Zod v4 + Tailwind v4 stack.

The highest-risk operation is Plan 01-02 (Convex backend restructure) because all `api.app.*` imports must change atomically -- both frontend and backend files reference `api.app.getCurrentUser`, `api.app.updateUsername`, etc., and these paths are embedded in test files too. The vitest coverage config (Plan 01-01) uses hardcoded file paths that will break immediately after any restructure, so it must be fixed first.

**Primary recommendation:** Execute plans strictly in dependency order (01-01 through 01-06). Each plan must leave typecheck + tests green before proceeding.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 6 feature domains: auth, onboarding, billing, dashboard, uploads, settings
- Onboarding is its own domain (NOT part of auth) -- both frontend (`src/features/onboarding/`) and backend (`convex/onboarding/`)
- Settings is its own domain -- has enough UI (general + billing tabs) to justify separation
- Frontend features live in `src/features/{domain}/` with components, hooks, barrel exports
- Backend features live in `convex/{domain}/` with queries, mutations, actions in separate files
- All 3 plugins demonstrate full integration: i18n namespace files, nav item entries, and route files
- `plugin/feature-admin-panel`: Full CRUD for users with its own Convex functions, schema table, nav item, and route guard
- `plugin/infra-ci-github-actions`: Both workflows -- auto-rebase on main push AND CI checks on plugin branches
- Tooling: Plop.js with Handlebars templates, interactive prompts
- Scaffold output: Wired-up templates with imports, sample components/hooks/queries, and test files
- `gen:route` prompts for authentication requirement and places file under `_auth/` or `_app/` accordingly
- `gen:feature` creates both `src/features/{name}/` and matching `convex/{name}/` with barrel exports, sample component, sample hook, sample query, and test file
- Main README: Comprehensive, optimized for LLM agent consumption
- Architecture diagram: Mermaid format
- Per-feature READMEs: Strict template (Purpose, Backend counterpart, Key files, Dependencies, Extension points)
- PROVIDERS.md: Includes swap guides for each vendor

### Claude's Discretion
- Dashboard shell placement (feature folder vs shared layout component)
- Command palette plugin polish level
- Exact Plop.js template contents beyond the wired-up pattern
- Loading skeleton design, spacing, typography in plugin UI

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRUCT-01 | Frontend feature folders | Feature folder structure documented in Architecture Patterns |
| STRUCT-02 | Convex backend by domain | Domain mapping documented; `convex/app.ts` split strategy identified |
| STRUCT-03 | Cross-feature code in `src/shared/` | Shared schemas pattern documented with promotion rules |
| STRUCT-04 | Thin route wrappers | Pattern documented with code example |
| STRUCT-05 | Co-located tests | Test co-location strategy documented |
| STRUCT-06 | All `api.*` paths updated | Atomic rename strategy documented as highest-risk item |
| STRUCT-07 | Vitest coverage globs | Current hardcoded config analyzed; glob replacement strategy documented |
| STRUCT-08 | TypeScript + tests pass | Verification commands documented |
| VAL-01 | Shared Zod schemas | `src/shared/schemas/` structure with specific schemas identified |
| VAL-02 | Convex mutations validate with Zod | `convex-helpers/server/zod4` API verified (zCustomMutation, zodToConvex) |
| VAL-03 | Username max-length bug fixed | Bug identified: validator says max(20), UI says "32 characters" |
| VAL-04 | Convex validators from Zod schemas | zodToConvex confirmed for Zod v4 enums in installed version |
| PLUG-01 | Data-driven navigation | Current hardcoded nav analyzed; array-based pattern documented |
| PLUG-02 | Namespace-based i18n | i18next namespace loading pattern documented with loadPath config |
| PLUG-03 | Feature-grouped error constants | Current flat `ERRORS` object analyzed; restructure pattern documented |
| PLUG-04 | `scripts/plugin.sh` | Shell script pattern documented (list, preview, install) |
| PLUG-05 | GitHub Actions auto-rebase | Workflow pattern documented using peter-evans/rebase or custom script |
| PLUG-06 | GitHub Actions CI on plugin branches | Workflow trigger pattern documented |
| PLUG-07 | `plugin/infra-ci-github-actions` branch | Branch creation strategy documented |
| PLUG-08 | `plugin/ui-command-palette` branch | cmdk/command palette pattern documented |
| PLUG-09 | `plugin/feature-admin-panel` branch | Full CRUD plugin structure documented |
| PLUG-10 | Multi-plugin merge tested | Merge testing and compatibility matrix strategy documented |
| GEN-01 | `gen:feature` generator | Plop.js generator pattern documented |
| GEN-02 | `gen:route` generator | Route generation with auth guard option documented |
| GEN-03 | `gen:convex-function` generator | Convex function template pattern documented |
| GEN-04 | `gen:form` generator | Form + Zod schema template pattern documented |
| DOC-01 | PROVIDERS.md | Vendor swap guide structure documented |
| DOC-02 | Main README | Comprehensive README structure for LLM consumption documented |
| DOC-03 | Per-feature READMEs | Strict template documented |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.2.4 | UI framework | Already in project |
| convex | ^1.32.0 | Backend-as-a-service | Already in project |
| convex-helpers | ^0.1.114 | Convex utilities (zod4, custom functions) | Already installed, provides `zCustomMutation`, `zodToConvex` |
| zod | ^4.3.6 | Schema validation (v4) | Already in project -- note: v4, NOT v3 |
| @tanstack/react-router | ^1.166.3 | File-based routing | Already in project |
| @tanstack/react-form | ^1.28.4 | Form management | Already in project |
| @tanstack/react-query | ^5.90.21 | Data fetching | Already in project |
| i18next | ^23.12.2 | Internationalization | Already in project |
| i18next-http-backend | ^2.5.2 | Lazy-load translation files | Already in project |
| vitest | ^4.0.18 | Test runner | Already in project |
| feather-testing-convex | ^0.5.0 | Convex test helpers | Already in project |

### New (to install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| plop | latest | CLI code generators | Plan 01-06: scaffolding generators |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| plop | hygen | Plop is simpler, user decided on Plop.js |
| plop | turbo gen | Requires Turborepo which is out of scope |

**Installation:**
```bash
npm install --save-dev plop
```

## Architecture Patterns

### Target Project Structure
```
src/
  features/
    auth/
      components/           # Auth-specific components
      hooks/                # Auth-specific hooks
      index.ts              # Barrel export
      README.md             # Per-feature docs
    onboarding/
      components/
      hooks/
      index.ts
      README.md
    billing/
      components/
      hooks/
      index.ts
      README.md
    dashboard/
      components/
      hooks/
      index.ts
      README.md
    uploads/
      components/
      hooks/
      index.ts
      README.md
    settings/
      components/
      hooks/
      index.ts
      README.md
  shared/
    schemas/               # Shared Zod schemas (username, currency, etc.)
    hooks/                 # Shared hooks (useSignOut, etc.)
    utils/                 # Shared utils (cn, callAll, getLocaleCurrency)
    nav.ts                 # Data-driven navigation config
    errors.ts              # Feature-grouped error constants
  ui/                      # Radix UI wrappers (unchanged)
  routes/                  # Thin route wrappers only
convex/
  users/
    queries.ts             # getCurrentUser
    mutations.ts           # updateUsername, updateUserImage, removeUserImage, completeOnboarding
  billing/
    queries.ts             # getActivePlans
    mutations.ts           # subscription mutations
    actions.ts             # Stripe checkout, portal
    stripe.ts              # Stripe SDK + internal functions
  uploads/
    mutations.ts           # generateUploadUrl
  auth/                    # auth.ts, auth.config.ts (mostly unchanged)
  email/                   # Already domain-organized
  otp/                     # Already domain-organized
  schema.ts                # Central schema (unchanged location)
```

### Pattern 1: Thin Route Wrappers
**What:** Route files import page components from feature folders instead of containing all the UI logic.
**When to use:** Every route file after restructure.
**Example:**
```typescript
// src/routes/_app/_auth/dashboard/_layout.settings.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout/settings/")({
  component: SettingsPage,
  beforeLoad: () => ({
    title: "Settings",
    headerTitle: "Settings",
    headerDescription: "Manage your account settings.",
  }),
});
```

### Pattern 2: Shared Zod Schemas
**What:** Zod schemas in `src/shared/schemas/` used by both frontend (TanStack Form validators) and backend (via `zodToConvex`).
**When to use:** Any validation that appears on both client and server.
**Example:**
```typescript
// src/shared/schemas/username.ts
import { z } from "zod";

export const USERNAME_MAX_LENGTH = 20;

export const username = z
  .string()
  .min(3)
  .max(USERNAME_MAX_LENGTH)
  .toLowerCase()
  .trim()
  .regex(/^[a-zA-Z0-9]+$/, "Username may only contain alphanumeric characters.");
```

### Pattern 3: Convex Zod Validation with zod4
**What:** Use `zCustomMutation` from `convex-helpers/server/zod4` to validate mutations with Zod schemas.
**When to use:** Convex mutations that accept user input (username, currency, etc.).
**Example:**
```typescript
// convex/users/mutations.ts
import { mutation } from "@cvx/_generated/server";
import { zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { z } from "zod/v4";
import { username } from "../../src/shared/schemas/username";

const zMutation = zCustomMutation(mutation, NoOp);

export const updateUsername = zMutation({
  args: { username },
  handler: async (ctx, args) => {
    // args.username is validated by Zod
    const userId = await auth.getUserId(ctx);
    if (!userId) return;
    await ctx.db.patch(userId, { username: args.username });
  },
});
```

**IMPORTANT:** The Zod import in Convex files MUST be `from "zod/v4"` (not `from "zod"`) because convex-helpers/server/zod4 imports `zod/v4/core` internally.

### Pattern 4: Data-Driven Navigation
**What:** Navigation defined as a typed array of items, rendered by a generic component.
**When to use:** Dashboard navigation (and plugin-extensible nav).
**Example:**
```typescript
// src/shared/nav.ts
export interface NavItem {
  label: string;
  i18nKey: string;
  to: string;
  icon?: React.ComponentType;
  authRequired?: boolean;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", i18nKey: "nav.dashboard", to: "/dashboard" },
  { label: "Settings", i18nKey: "nav.settings", to: "/dashboard/settings" },
  { label: "Billing", i18nKey: "nav.billing", to: "/dashboard/settings/billing" },
];
// Plugins append to this array
```

### Pattern 5: Namespace-Based i18n
**What:** Split `translation.json` into namespace files, load per-feature.
**When to use:** i18n for feature-specific and plugin-specific strings.
**Example:**
```typescript
// src/i18n.ts
i18n.init({
  fallbackLng: "en",
  ns: ["common", "auth", "dashboard", "settings", "billing"],
  defaultNS: "common",
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json",
  },
});

// In components:
const { t } = useTranslation("settings");
```
File structure:
```
public/locales/en/
  common.json
  auth.json
  dashboard.json
  settings.json
  billing.json
  onboarding.json
```

### Pattern 6: Feature-Grouped Error Constants
**What:** Errors organized by feature domain with clear plugin extension points.
**Example:**
```typescript
// src/shared/errors.ts
export const ERRORS = {
  auth: {
    EMAIL_NOT_SENT: "Unable to send email.",
    USER_NOT_CREATED: "Unable to create user.",
    SOMETHING_WENT_WRONG: "Something went wrong while trying to authenticate.",
  },
  onboarding: {
    USERNAME_ALREADY_EXISTS: "Username already exists.",
    SOMETHING_WENT_WRONG: "Something went wrong while trying to onboard.",
  },
  billing: {
    MISSING_SIGNATURE: "Unable to verify webhook signature.",
    MISSING_ENDPOINT_SECRET: "Unable to verify webhook endpoint.",
    CUSTOMER_NOT_CREATED: "Unable to create customer.",
    SOMETHING_WENT_WRONG: "Something went wrong while trying to handle Stripe API.",
  },
  common: {
    UNKNOWN: "Unknown error.",
    ENVS_NOT_INITIALIZED: "Environment variables not initialized.",
    SOMETHING_WENT_WRONG: "Something went wrong.",
  },
  // Plugin errors go here:
  // admin: { ... }
} as const;
```

### Anti-Patterns to Avoid
- **God file:** Don't leave all Convex functions in `convex/app.ts` -- split by domain
- **Fat routes:** Don't put business logic in route files -- keep them thin
- **Hardcoded coverage paths:** Don't list individual files in vitest coverage `include` -- use globs
- **Importing Zod from wrong path in Convex:** Use `from "zod/v4"` in convex files, not `from "zod"`, when working with convex-helpers/server/zod4
- **Editing translation.json for plugins:** Plugins should add their own namespace JSON files

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code generators | Custom Node scripts | Plop.js | Handles prompts, Handlebars, file creation, case helpers |
| Zod-to-Convex validator conversion | Manual v.string() etc. | `zodToConvex()` from convex-helpers/server/zod4 | Type-safe, handles unions, optionals, enums |
| Translation file loading | Custom fetch logic | i18next-http-backend with loadPath | Battle-tested, handles caching, fallback |
| Auto-rebase workflows | Custom rebase scripts | GitHub Actions (peter-evans/rebase or custom git commands) | Standard CI pattern |
| Test client setup | Custom Convex mocks | feather-testing-convex + convex-test | Already provides `createConvexTest`, authenticated clients |

## Common Pitfalls

### Pitfall 1: Convex API Path Breakage
**What goes wrong:** Moving `convex/app.ts` functions to `convex/users/queries.ts` changes ALL import paths from `api.app.getCurrentUser` to `api.users.queries.getCurrentUser`.
**Why it happens:** Convex auto-generates `_generated/api.d.ts` based on file structure.
**How to avoid:** Do this atomically in one plan. Run `npx convex dev` (or check `_generated/api.d.ts`) to see new paths. Find-and-replace all `api.app.` references in frontend, tests, and other Convex files. The internal references (e.g., `internal.stripe.*`) also change if stripe.ts moves.
**Warning signs:** TypeScript errors mentioning "Property does not exist on type" for api paths.

### Pitfall 2: Vitest Coverage Config Breaks on Restructure
**What goes wrong:** The current vitest.config.ts has hardcoded file paths like `"convex/app.ts"`, `"src/routes/_app/_auth/dashboard/_layout.index.tsx"`. After restructure, these paths no longer exist.
**Why it happens:** Coverage config was written for current flat structure.
**How to avoid:** Plan 01-01 must switch to globs FIRST, before any file moves: `"src/features/**/*.{ts,tsx}"`, `"convex/**/*.ts"`, etc.
**Warning signs:** Coverage drops to 0% or coverage command errors.

### Pitfall 3: Username Max-Length Bug
**What goes wrong:** The Zod validator in `src/utils/validators.ts` says `.max(20)` but the UI text in `_layout.settings.index.tsx` says "Please use 32 characters at maximum."
**Why it happens:** UI copy and schema were not kept in sync.
**How to avoid:** Export `USERNAME_MAX_LENGTH` from the schema and reference it dynamically in UI: `` `Please use ${USERNAME_MAX_LENGTH} characters at maximum.` ``
**Warning signs:** Users can enter 21-32 char usernames in UI but validation rejects them.

### Pitfall 4: TanStack Router Route Tree Regeneration
**What goes wrong:** After moving route files, the auto-generated `routeTree.gen.ts` becomes stale.
**Why it happens:** TanStack Router plugin watches `src/routes/` and auto-generates route tree.
**How to avoid:** After restructure, run `vite` briefly or the router plugin to regenerate. Route files MUST stay in `src/routes/` -- only their content becomes thin wrappers. Do NOT move route files to feature folders.
**Warning signs:** Runtime 404s or TypeScript errors in routeTree.gen.ts.

### Pitfall 5: Circular Imports in Barrel Exports
**What goes wrong:** Feature barrel exports (`index.ts`) re-export everything, creating circular dependencies when features depend on each other.
**Why it happens:** Feature A imports from Feature B's barrel, and Feature B imports from Feature A.
**How to avoid:** Only export public API from barrel files. Cross-feature dependencies should go through `src/shared/`. Keep barrels shallow (no re-exporting internal implementation).
**Warning signs:** Runtime undefined errors, module resolution failures.

### Pitfall 6: Convex Schema Must Stay Centralized
**What goes wrong:** Attempting to split `convex/schema.ts` into per-domain schema files.
**Why it happens:** Desire to co-locate schema with domain.
**How to avoid:** Convex requires a single `schema.ts` at the convex root. Keep it there. Domain files import validators/constants from it. The admin-panel plugin adds its table to this same file.
**Warning signs:** Convex deployment errors about missing schema.

### Pitfall 7: Zod v4 Import Path in Convex
**What goes wrong:** Using `import { z } from "zod"` in Convex files with convex-helpers/server/zod4 may cause type mismatches.
**Why it happens:** convex-helpers/server/zod4 internally uses `zod/v4/core` and `zod/v4` types.
**How to avoid:** In Convex files that use zCustomMutation/zCustomQuery, import `z` from `"zod/v4"`. In shared schemas used by both frontend and backend, standard `from "zod"` works because Zod v4 is the default (project already uses zod ^4.3.6).
**Warning signs:** Type errors about incompatible ZodType.

## Code Examples

### Convex Domain Split: users/queries.ts
```typescript
// convex/users/queries.ts
import { query } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import type { User } from "~/types";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx): Promise<User | undefined> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;
    // ... same logic as current app.ts
  },
});
```

### Plop.js Generator: plopfile.js
```javascript
// plopfile.js
export default function (plop) {
  plop.setGenerator("feature", {
    description: "Create a new feature module",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Feature name (lowercase, e.g. 'notifications'):",
      },
    ],
    actions: [
      // Frontend
      { type: "add", path: "src/features/{{name}}/components/.gitkeep", template: "" },
      { type: "add", path: "src/features/{{name}}/hooks/.gitkeep", template: "" },
      { type: "add", path: "src/features/{{name}}/index.ts", templateFile: "templates/feature/index.ts.hbs" },
      { type: "add", path: "src/features/{{name}}/README.md", templateFile: "templates/feature/README.md.hbs" },
      // Backend
      { type: "add", path: "convex/{{name}}/queries.ts", templateFile: "templates/feature/queries.ts.hbs" },
      { type: "add", path: "convex/{{name}}/mutations.ts", templateFile: "templates/feature/mutations.ts.hbs" },
      // Test
      { type: "add", path: "src/features/{{name}}/{{name}}.test.tsx", templateFile: "templates/feature/test.tsx.hbs" },
    ],
  });

  plop.setGenerator("route", {
    description: "Create a new route file",
    prompts: [
      { type: "input", name: "name", message: "Route name:" },
      { type: "confirm", name: "authRequired", message: "Require authentication?" },
    ],
    actions: (data) => {
      const basePath = data.authRequired
        ? "src/routes/_app/_auth"
        : "src/routes/_app";
      return [
        { type: "add", path: `${basePath}/{{name}}.tsx`, templateFile: "templates/route/route.tsx.hbs" },
      ];
    },
  });
}
```

### Plugin Shell Script: scripts/plugin.sh
```bash
#!/usr/bin/env bash
set -euo pipefail

PLUGIN_PREFIX="plugin/"

case "${1:-}" in
  list)
    git branch -r | grep "origin/${PLUGIN_PREFIX}" | sed "s|origin/||" | sort
    ;;
  preview)
    [ -z "${2:-}" ] && echo "Usage: plugin.sh preview <branch>" && exit 1
    git diff main..."origin/${2}" --stat
    ;;
  install)
    [ -z "${2:-}" ] && echo "Usage: plugin.sh install <branch>" && exit 1
    git merge "origin/${2}" --no-edit
    ;;
  *)
    echo "Usage: plugin.sh {list|preview|install} [branch]"
    ;;
esac
```

### GitHub Actions: Auto-Rebase Plugin Branches
```yaml
# .github/workflows/rebase-plugins.yml
name: Rebase plugin branches
on:
  push:
    branches: [main]

jobs:
  rebase:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      - name: Rebase plugin branches
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          for branch in $(git branch -r | grep 'origin/plugin/' | sed 's|origin/||'); do
            echo "Rebasing $branch onto main..."
            git checkout "$branch"
            if ! git rebase main; then
              git rebase --abort
              gh issue create --title "Rebase conflict: $branch" \
                --body "Auto-rebase of \`$branch\` onto \`main\` failed with conflicts."
              continue
            fi
            git push --force-with-lease origin "$branch"
          done
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Actions: CI on Plugin Branches
```yaml
# .github/workflows/plugin-ci.yml
name: Plugin CI
on:
  push:
    branches: ['plugin/**']

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zod v3 | Zod v4 (already in project) | 2025 | Use `zod/v4` imports in Convex; `from "zod"` works in frontend |
| `convex-helpers/server/zod` | `convex-helpers/server/zod4` | 2025 | Must use zod4 path for Zod v4 compat |
| Single translation.json | Namespace-based loading | Current i18next best practice | Enables plugin i18n isolation |
| Manual Convex validators | zodToConvex() | Available in convex-helpers ^0.1.114 | Derive Convex validators from Zod schemas |

**Deprecated/outdated:**
- `convex-helpers/server/zod`: Use `/zod4` instead for Zod v4 projects

## Open Questions

1. **Convex import path for shared schemas**
   - What we know: Shared Zod schemas live in `src/shared/schemas/`. Convex files need to import them.
   - What's unclear: Whether `~/src/shared/schemas/username` or a path alias resolves correctly in the Convex runtime. The `~/` alias maps to root, so `~/src/shared/schemas/` should work given the existing `tsconfig` alias. But this needs hands-on verification.
   - Recommendation: Test the import in Plan 01-02. If Convex runtime can't resolve it, the schemas may need to live at root level (e.g., `shared/schemas/`) or be duplicated.

2. **TanStack Form Zod v4 Adapter**
   - What we know: TanStack Form uses Zod validators in `validators: { onSubmit: validators.username }`. This currently works with Zod v4 (project already uses it).
   - What's unclear: Whether TanStack Form's internal Zod integration has any v4-specific edge cases.
   - Recommendation: This is likely fine since the project already works with Zod v4 + TanStack Form. LOW risk.

3. **Dashboard Shell Placement (Claude's Discretion)**
   - Recommendation: Keep the navigation component in `src/features/dashboard/components/Navigation.tsx` since it is the dashboard shell. Import it from the dashboard layout route. The data-driven nav config lives in `src/shared/nav.ts` so plugins can extend it.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 + feather-testing-convex 0.5.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STRUCT-06 | All api.* paths resolve | unit | `npx vitest run convex/` | Yes (convex/app.test.ts, will be split) |
| STRUCT-07 | Vitest coverage uses globs | smoke | `npx vitest run --coverage` | N/A (config change) |
| STRUCT-08 | TypeScript + tests pass | integration | `npm run typecheck && npm test` | Yes |
| VAL-01 | Shared Zod schemas validate correctly | unit | `npx vitest run src/shared/schemas/` | Wave 0 |
| VAL-02 | Convex mutations validate with Zod | unit | `npx vitest run convex/` | Existing (will adapt) |
| VAL-03 | Username max-length bug fixed | unit | `npx vitest run src/shared/schemas/` | Wave 0 |
| VAL-04 | zodToConvex works for enums | unit | `npx vitest run convex/` | Wave 0 |
| PLUG-01 | Data-driven nav renders items | unit | `npx vitest run src/shared/nav` | Wave 0 |
| PLUG-04 | plugin.sh commands work | manual-only | `bash scripts/plugin.sh list` | N/A |
| PLUG-10 | Multi-plugin merge succeeds | manual-only | Two-plugin merge test | N/A |
| GEN-01-04 | Generators produce correct output | smoke | `npx plop feature -- --name test-feat` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npm run typecheck && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/shared/schemas/*.test.ts` -- covers VAL-01, VAL-03
- [ ] Schema tests for zodToConvex enum derivation -- covers VAL-04
- [ ] Navigation config unit tests -- covers PLUG-01
- [ ] Generator output smoke tests (if feasible with Plop programmatic API)

## Sources

### Primary (HIGH confidence)
- `convex-helpers/server/zod4.d.ts` (installed locally v0.1.114) -- verified zCustomQuery, zCustomMutation, zCustomAction, zodToConvex, zid exports
- Project source code analysis -- vitest.config.ts, convex/app.ts, src/utils/validators.ts, errors.ts, src/i18n.ts, navigation component
- [i18next namespaces documentation](https://www.i18next.com/principles/namespaces) -- namespace loading pattern
- [react-i18next multiple translation files](https://react.i18next.com/guides/multiple-translation-files) -- useTranslation with namespace

### Secondary (MEDIUM confidence)
- [Plop.js official documentation](https://plopjs.com/documentation/) -- generator patterns, Handlebars helpers, action types
- [convex-helpers Zod v4 support (GitHub issue #558)](https://github.com/get-convex/convex-helpers/issues/558) -- confirmed zod4 path
- [peter-evans/rebase GitHub Action](https://github.com/peter-evans/rebase) -- auto-rebase pattern

### Tertiary (LOW confidence)
- GitHub Actions auto-rebase custom script pattern -- assembled from multiple sources, needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified locally
- Architecture: HIGH -- patterns derived from actual codebase analysis
- Zod v4 + convex-helpers: HIGH -- verified from installed .d.ts files
- Plugin system: MEDIUM -- git-branch plugin system is custom, patterns assembled from multiple sources
- CLI generators: MEDIUM -- Plop.js is well-documented but exact templates need iteration
- Pitfalls: HIGH -- identified from direct code analysis (username bug, hardcoded paths, etc.)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable stack, 30-day window)
