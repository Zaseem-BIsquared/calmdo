# Domain Pitfalls

**Domain:** Codebase architecture modernization (React + Convex SaaS starter kit)
**Researched:** 2026-03-09

## Critical Pitfalls

Mistakes that cause rewrites, broken deployments, or cascading failures.

### Pitfall 1: Convex API Path Breakage Is Not Incremental

**What goes wrong:** Moving `convex/app.ts` to `convex/users/queries.ts` changes every generated API reference from `api.app.getCurrentUser` to `api.users.queries.getCurrentUser`. Convex auto-generates `_generated/api.d.ts` based on file paths -- there is no aliasing, no re-export trick, no backwards-compatible shim. Every `useQuery(convexQuery(api.app.X))` call in the frontend and every `internal.stripe.X` call in the backend breaks simultaneously.

**Why it happens:** Convex's code generation walks the `convex/` directory tree and derives the API namespace directly from the file path. This is a fundamental design constraint, not something you can work around with barrel exports or path aliases.

**Consequences:** If you move files without updating all consumers in the same commit, `npx convex dev` will regenerate `api.d.ts`, TypeScript will emit errors on every stale reference, and the app will not compile. Partial migrations leave the codebase in an un-buildable state.

**Warning signs:**
- Planning to "move a few files first, then update references later"
- Treating the convex restructure as separate from the frontend update
- Forgetting that `internal.*` references within `convex/` itself also break (e.g., `internal.stripe.PREAUTH_createStripeCustomer` in `convex/app.ts`)

**Prevention:**
1. Do the entire `convex/` restructure in a single atomic commit -- move files AND update all references together
2. Build a reference map BEFORE moving: grep for `api.app.`, `api.stripe.`, `internal.stripe.`, `internal.init.` across the entire codebase (currently ~20 `api.app.*` references in frontend, ~30 `internal.*` references in backend)
3. After moving, run `npx convex dev` to regenerate `_generated/api.d.ts`, then run `npm run typecheck` to catch any missed references
4. The test suite is your safety net -- `npm run test` must pass after the restructure

**Detection:** `npm run typecheck` will immediately surface every broken reference. Do not suppress TypeScript errors during this phase.

**Phase mapping:** This must be the FIRST phase. Everything else (feature folders, shared schemas, plugins) depends on the new API path structure being stable.

---

### Pitfall 2: Convex schema.ts Cannot Be Split Across Feature Folders

**What goes wrong:** The natural instinct in a feature-folder restructure is to define each feature's tables in its own folder (e.g., `convex/billing/schema.ts`, `convex/users/schema.ts`). Convex requires a single `convex/schema.ts` at the root with a single `defineSchema()` call. There is no schema composition API.

**Why it happens:** Convex's schema definition is monolithic by design -- `defineSchema()` produces the complete schema that gets deployed. Unlike Prisma or Drizzle, there is no `schema.d/` directory or `extend` mechanism.

**Consequences:** Attempting to split the schema will either fail at deploy time or force you to build a fragile custom merge script. Plugin branches that each define their own tables will ALL conflict on `schema.ts`.

**Warning signs:**
- Planning feature folders that include "their own schema"
- Plugin branches that add tables without a merge strategy for `schema.ts`
- Assuming `defineSchema` supports spreading from multiple files

**Prevention:**
1. Accept `convex/schema.ts` as a shared, cross-cutting file -- it does NOT belong to any feature
2. Extract validators and constants (like `currencyValidator`, `PLANS`, `INTERVALS`) into separate files (e.g., `convex/validators.ts`) that features can import without touching `schema.ts`
3. For plugins: design `schema.ts` with clearly delimited sections using comments (`// === Billing Tables ===`). Use additive-only changes to minimize merge conflicts
4. Consider a `convex/tables/` directory with one file per domain that exports `defineTable()` calls, then compose them in the single `schema.ts`. This gives the illusion of separation without fighting the framework

**Detection:** If `convex/schema.ts` appears in more than one plugin branch's diff, you will get merge conflicts.

**Phase mapping:** Address in the convex restructure phase. The validator extraction should happen before or alongside file moves.

---

### Pitfall 3: vitest Coverage Config Has Hardcoded File Paths

**What goes wrong:** The current `vitest.config.ts` has 25+ explicit file paths in `coverage.include` and `coverage.exclude` (e.g., `"convex/app.ts"`, `"src/routes/_app/_auth/dashboard/_layout.index.tsx"`). Moving files without updating every path in this config will silently drop files from coverage -- tests may still pass but the 100% coverage threshold will fail, or worse, coverage will appear to pass because uncovered files are no longer in the include list.

**Why it happens:** The coverage config uses exact file paths, not glob patterns. When files move, the config still points at the old locations.

**Consequences:**
- Coverage threshold fails (100% statements/branches/functions/lines) -- CI breaks
- OR: moved files silently fall out of coverage scope, giving false confidence
- Developers waste time debugging "why is coverage failing" when the answer is just stale paths

**Warning signs:**
- Moving source files without simultaneously updating `vitest.config.ts`
- Coverage passing with fewer files than expected (file count decreased)
- New feature folders not appearing in coverage reports

**Prevention:**
1. Replace explicit file paths with glob patterns BEFORE restructuring: `"src/features/**/**.{ts,tsx}"` instead of listing individual files
2. If explicit paths are kept, create a checklist: every file move requires updating the corresponding `vitest.config.ts` entry
3. After restructuring, verify coverage file count matches expectations (count files in include vs. what coverage reports)
4. Consider setting `coverage.all: true` with proper excludes instead of whitelisting includes

**Detection:** Run `npm run test -- --coverage` after each structural change. Compare the list of files in the coverage report against expected files.

**Phase mapping:** Convert coverage config to globs in the FIRST phase, before any file moves. This is a prerequisite, not an afterthought.

---

### Pitfall 4: TanStack Router Route Files Cannot Move to Feature Folders

**What goes wrong:** Developers try to move route files from `src/routes/_app/_auth/dashboard/` into `src/features/dashboard/routes/` to achieve "true" feature folders. TanStack Router's file-based routing requires route files in `src/routes/` with its specific naming convention (`_layout.tsx`, `_layout.settings.tsx`). Moving them breaks route tree generation entirely.

**Why it happens:** TanStack Router's `TanStackRouterVite()` plugin scans a configured `routesDirectory` (defaults to `src/routes`) and generates `routeTree.gen.ts`. It derives route hierarchy from the file system structure. Files outside this directory are invisible to the router.

**Consequences:** Moving route files causes `routeTree.gen.ts` to lose routes. The app will compile but pages will 404 at runtime. No TypeScript error warns you -- it is a silent failure until you navigate to the missing route.

**Warning signs:**
- Planning to put route files in `src/features/*/routes/`
- Assuming TanStack Router supports multiple route directories
- Conflating "route file" (must stay in `src/routes/`) with "route component" (can live anywhere)

**Prevention:**
1. Route FILES stay in `src/routes/` -- this is non-negotiable with file-based routing
2. Make route files THIN: they import and re-export components from `src/features/*/components/`
3. Use TanStack Router's `-` prefix convention for colocated non-route files (e.g., `src/routes/_app/_auth/dashboard/-ui.navigation.tsx` -- this already exists in the codebase)
4. The feature folder pattern for routes is: route file in `src/routes/` that imports from `src/features/dashboard/components/DashboardPage.tsx`

**Detection:** After any route restructure, run the dev server and navigate to every route. Check `routeTree.gen.ts` to verify all routes are present.

**Phase mapping:** Feature folder phase. Route files stay put; the extracted components move to `src/features/`.

---

### Pitfall 5: Navigation Component Hardcodes Route Imports -- Plugin Nightmare

**What goes wrong:** The current `-ui.navigation.tsx` hardcodes imports from specific route files (`Route as DashboardRoute`, `Route as SettingsRoute`, `Route as BillingSettingsRoute`). Each navigation tab is a handwritten `<Link>` with hardcoded route references. When a plugin branch adds a new nav item (e.g., "Admin"), it must modify this same file -- guaranteed merge conflict with every other plugin branch.

**Why it happens:** Navigation was built for a fixed set of routes. The plugin model assumes features can be added/removed independently, but the nav component is monolithic.

**Consequences:** Every plugin branch that adds navigation entries will conflict on the same file. Merge resolution becomes manual and error-prone. With 3+ plugin branches, this becomes the primary source of merge pain.

**Warning signs:**
- Navigation component with `import { Route } from` at the top
- Hardcoded JSX for each nav item instead of data-driven rendering
- Multiple plugin branches touching the same component

**Prevention:**
1. Convert navigation to data-driven: a nav config array (e.g., `navItems: Array<{ label: string, path: string, icon: Component }>`) that the component iterates over
2. Each plugin/feature registers its nav items by appending to the array, not by editing JSX
3. Use a registry pattern: `src/shared/nav-registry.ts` exports a mutable array, features push to it at module load time
4. Alternative: use a static config file (`nav.config.ts`) that is additive-only -- plugins append lines rather than editing existing ones

**Detection:** If `git diff` for a plugin branch shows changes to the navigation component's JSX structure (not just imports), the approach is wrong.

**Phase mapping:** Must be addressed in the plugin-friendly shared files phase, BEFORE creating any plugin branches. If plugins are created first, every plugin will need rebasing after the nav refactor.

---

## Moderate Pitfalls

### Pitfall 6: Zod v4 Import Path for convex-helpers

**What goes wrong:** Using `import { zCustomQuery } from "convex-helpers/server/zod"` with Zod v4 installed. The base `/zod` endpoint exports the Zod v3 implementation. With Zod v4 (which this project uses -- `"zod": "^4.3.6"`), you must import from `"convex-helpers/server/zod4"`.

**Why it happens:** convex-helpers maintains separate entry points for Zod v3 and v4 compatibility. The generic `/zod` path defaults to v3 for backwards compatibility.

**Prevention:**
1. Always use `import { ... } from "convex-helpers/server/zod4"` in this project
2. Add an ESLint rule or code review checkpoint to catch `convex-helpers/server/zod` imports (without the `4` suffix)
3. Verify convex-helpers version supports Zod v4 -- the project has `"convex-helpers": "^0.1.114"`, which should include Zod v4 support (added in late 2025)

**Detection:** Runtime errors about `_def` not existing on Zod schemas, or TypeScript errors about incompatible Zod types.

**Phase mapping:** Shared Zod schemas phase. Verify compatibility before building any shared validation.

---

### Pitfall 7: Circular Dependencies Between Feature Folders

**What goes wrong:** Feature A imports from Feature B, and Feature B imports from Feature A. Example: `features/billing/` needs the `User` type from `features/users/`, and `features/users/` needs `Subscription` type from `features/billing/`. With the current `types.ts`, the `User` type already includes `subscription` data -- this cross-cutting type will resist clean feature boundaries.

**Why it happens:** In a flat structure, everything can import from everything. Feature folders impose boundaries, but real domain models have relationships that cross those boundaries.

**Prevention:**
1. Create `src/shared/types/` for cross-cutting types (like `User` with subscription data)
2. Rule: features can import from `shared/`, but never from other features
3. If two features need to communicate, the shared type or interface goes in `shared/`
4. For Convex specifically: the `User` type (currently in root `types.ts`) depends on both `Doc<"users">` and `Doc<"subscriptions">` -- it belongs in `shared/`, not in either feature

**Detection:** TypeScript will catch circular imports, but the real warning sign is needing to import from `../other-feature/` -- that import should go through `shared/`.

**Phase mapping:** Feature folder phase. Define the `shared/` boundary before creating feature folders.

---

### Pitfall 8: i18n Single-File Translation Blocks Plugin Composition

**What goes wrong:** Currently, all translations live in a single `public/locales/en/translation.json`. When plugins add their own translation keys, every plugin branch modifies the same JSON file. JSON does not support comments, so there are no section markers. Merge conflicts on JSON are especially painful because a missing comma or bracket breaks the entire file.

**Why it happens:** i18next defaults to a single namespace per language. The project has not set up namespace-based loading.

**Prevention:**
1. Switch to namespace-based i18n: each feature/plugin gets its own namespace file (e.g., `public/locales/en/billing.json`, `public/locales/en/admin.json`)
2. Configure i18next to load multiple namespaces: `i18n.init({ ns: ['common', 'billing', 'admin'], defaultNs: 'common' })`
3. Use namespaced keys in components: `t('billing:upgradeButton')` instead of `t('upgradeButton')`
4. The base `translation.json` becomes `common.json` for shared strings

**Detection:** If a plugin branch adds keys to `translation.json`, the approach is wrong.

**Phase mapping:** Plugin-friendly shared files phase. Must be done before any plugin branches add translations.

---

### Pitfall 9: errors.ts as a Merge Conflict Magnet

**What goes wrong:** Similar to navigation and i18n, the `errors.ts` file is a single flat object. Every plugin that introduces new error types must add entries to this file. With 3+ plugins, merge conflicts are certain.

**Why it happens:** Error constants are defined as a single `ERRORS` object in one file. No namespace separation.

**Prevention:**
1. Group errors by domain: `ERRORS.AUTH.*`, `ERRORS.STRIPE.*`, `ERRORS.ONBOARDING.*`
2. Use a registry pattern: each feature exports its own error constants, a central file merges them
3. Or: split into `errors/auth.ts`, `errors/stripe.ts`, etc., with a barrel `errors/index.ts` that re-exports. New plugins add new files rather than editing existing ones
4. Prefer additive-only patterns: plugins create new error files, the index re-exports with spread

**Detection:** Multiple plugin branches modifying the same `ERRORS` object.

**Phase mapping:** Plugin-friendly shared files phase, alongside nav and i18n.

---

### Pitfall 10: Test File Relocation Breaks environmentMatchGlobs

**What goes wrong:** The current `vitest.config.ts` uses `environmentMatchGlobs: [["convex/**", "edge-runtime"]]` to run Convex backend tests in edge-runtime instead of jsdom. If backend tests are moved (e.g., from `convex/app.test.ts` to `convex/users/queries.test.ts`), the glob still matches. But if they are moved OUTSIDE `convex/` (e.g., to `src/features/users/api/__tests__/`), they will run in jsdom instead of edge-runtime, causing cryptic failures.

**Why it happens:** Convex backend tests require edge-runtime because Convex functions use APIs not available in jsdom. The glob pattern ties this to the file path.

**Prevention:**
1. Keep Convex backend tests inside the `convex/` directory -- they should move WITH their source files within `convex/`
2. If tests must live outside `convex/`, update `environmentMatchGlobs` to include the new paths
3. Never move backend tests to `src/` without updating the environment configuration

**Detection:** Backend tests failing with errors about missing `Convex` globals or `EdgeRuntime` not being defined.

**Phase mapping:** Convex restructure phase. Tests move alongside their source files within `convex/`.

---

## Minor Pitfalls

### Pitfall 11: Path Alias Updates in Multiple tsconfig Files

**What goes wrong:** The project has three tsconfig files (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`) plus `convex/tsconfig.json`, plus path aliases in `vite.config.ts` AND `vitest.config.ts`. Adding or changing a path alias (e.g., adding `@features/*`) requires updating it in ALL relevant configs. Missing one causes "module not found" errors that vary by context (build vs. dev vs. test).

**Prevention:**
1. Document which aliases exist and where they are defined
2. When adding a new alias, update all configs in the same commit
3. Current aliases: `~` (project root), `@` (src/), `@cvx` (convex/) -- defined in both vite.config.ts and vitest.config.ts

**Detection:** "Cannot find module" errors that only appear in specific contexts (tests pass but build fails, or vice versa).

**Phase mapping:** Feature folder phase, when new aliases might be introduced.

---

### Pitfall 12: Plop Generator Templates Hardcode Old Paths

**What goes wrong:** If CLI generators (Plop.js) are created before the restructure is complete, the templates will embed the old file structure. When the structure changes, generators produce files in wrong locations or with wrong import paths.

**Prevention:**
1. Create Plop generators AFTER the restructure is finalized, not during or before
2. Generators should be the LAST phase -- they codify the final structure

**Detection:** Generated files placed in unexpected locations or with broken imports.

**Phase mapping:** CLI generators phase. This must be the final phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Convex backend restructure | API path breakage (Pitfall 1), schema splitting attempt (Pitfall 2) | Atomic commit, keep schema.ts at root, grep all references first |
| Frontend feature folders | Route files moved out of src/routes/ (Pitfall 4), circular deps (Pitfall 7) | Thin route files, shared/ for cross-cutting types |
| Coverage maintenance | Hardcoded paths in vitest config (Pitfall 3), environment globs (Pitfall 10) | Convert to globs FIRST, keep backend tests in convex/ |
| Plugin-friendly shared files | Nav conflicts (Pitfall 5), i18n conflicts (Pitfall 8), errors conflicts (Pitfall 9) | Data-driven nav, namespaced i18n, domain-grouped errors -- all before plugin branches |
| Shared Zod schemas | Wrong convex-helpers import path (Pitfall 6) | Use `convex-helpers/server/zod4`, verify version compatibility |
| CLI generators | Templates embed old structure (Pitfall 12) | Create generators last, after structure is stable |

## Recommended Phase Order (Based on Pitfalls)

1. **Prerequisites** -- Convert vitest coverage to globs, extract validators from schema.ts
2. **Convex restructure** -- Move backend files + update ALL api/internal references atomically
3. **Frontend feature folders** -- Extract components from routes, establish shared/ boundary
4. **Plugin-friendly shared files** -- Data-driven nav, namespaced i18n, grouped errors
5. **Plugin branches** -- Only after shared files are merge-friendly
6. **Shared Zod schemas** -- After convex restructure settles (new paths stable)
7. **CLI generators** -- Last, codifying the final structure

## Sources

- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices) -- File organization, helper patterns
- [Convex API Generation Internals](https://stack.convex.dev/code-spelunking-uncovering-convex-s-api-generation-secrets) -- How folder structure maps to API paths
- [convex-helpers Zod v4 Issue #558](https://github.com/get-convex/convex-helpers/issues/558) -- Zod v4 compatibility status and import paths
- [TanStack Router Colocation Discussion #3046](https://github.com/TanStack/router/discussions/3046) -- routeFileIgnorePrefix/Pattern for non-route files
- [TanStack Router Routing Concepts](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts) -- File-based routing constraints
- [Vitest Coverage Config](https://vitest.dev/config/coverage) -- Include/exclude path configuration
- [Convex Feature Proposal: Escaped Files #102](https://github.com/get-convex/convex-backend/issues/102) -- Convex file organization limitations
- Codebase analysis: `convex/_generated/api.d.ts`, `vitest.config.ts`, `-ui.navigation.tsx`, `errors.ts`, `src/i18n.ts`
