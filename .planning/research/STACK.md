# Stack Research

**Domain:** Architecture modernization tooling for React + Convex SaaS starter kit
**Researched:** 2026-03-09
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zod | ^4.3.6 (installed) | Shared client-server schema validation | Already in project. v4 has 14x faster string parsing, native JSON Schema via `.toJSONSchema()`, and metadata support for schema-driven form generation. Convex-helpers 0.1.114 ships with Zod v4 support. |
| Plop.js | ^4.0.5 | CLI code generators | Lightweight handlebars-based micro-generator. No runtime dependency -- generates static files. Well-maintained (last publish ~Feb 2026). Only serious option for template-based scaffolding without framework lock-in. |
| convex-helpers | ^0.1.114 (installed) | Zod validation wrappers for Convex mutations | Already installed and confirmed compatible with Zod v4. Provides `zCustomQuery`, `zCustomMutation`, `zodToConvex` for typed server-side validation. **Critical:** import from `"convex-helpers/server/zod4"` (not `"convex-helpers/server/zod"` which targets v3). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-form | ^1.28.4 (installed) | Form handling with Zod validation | Already integrated. Connect shared Zod schemas to form validators for single-source-of-truth validation. Verify adapter compatibility with Zod v4 before wiring. |
| handlebars | (bundled with plop) | Template engine for generators | Used internally by Plop. No separate install needed. Write `.hbs` templates in `plop-templates/`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| plop (CLI) | Run generators via `npx plop` | Add `"generate": "plop"` script to package.json. Uses `plopfile.mjs` (ESM) at project root. |
| git merge (branches) | Plugin installation mechanism | Plain `git merge plugin/branch-name --no-ff`. No submodules, no subtree. Simplest approach for a starter kit where plugins are branches of the same repo. |

## Installation

```bash
# New dependency (only one)
npm install -D plop

# Already installed -- no changes needed
# zod@^4.3.6
# convex-helpers@^0.1.114
# @tanstack/react-form@^1.28.4
```

## Architecture Tooling Decisions

### Feature Folders: Convention Only, No Library

Feature-folder architecture is a **file organization convention**, not a library. Follow the bulletproof-react pattern adapted for Convex:

```
src/features/{name}/
  components/     # React components scoped to feature
  hooks/          # Custom hooks scoped to feature
  types.ts        # TypeScript types
  index.ts        # Public API barrel export

convex/{name}/
  queries.ts      # Convex queries for this domain
  mutations.ts    # Convex mutations for this domain
  actions.ts      # Convex actions (if needed)

src/shared/
  schemas/        # Zod schemas (shared with backend via ~/ alias)
  errors/         # Error constants, namespaced by domain
  types/          # Cross-feature TypeScript types
  config/         # Site config, nav config
```

Each feature's `index.ts` is the public API boundary. Other features import only from the barrel, never from internal paths.

**Note on Convex paths:** Convex domain folders go directly under `convex/` (e.g., `convex/user/`, not `convex/features/user/`) because Convex generates API paths from file paths. `convex/user/queries.ts` creates `api.user.queries.X` which is clean and readable.

**Note on barrel exports in Convex:** Do NOT create `convex/user/index.ts` barrels. Convex would generate `api.user.index.X` paths. Import directly from the specific file.

**Confidence:** HIGH -- bulletproof-react is the de facto standard. Convex path behavior verified against codebase.

### Git-Based Plugins: Branch Merge Strategy

Use **git branches** in the same repository, installed via `git merge`. Not submodules (too complex for end users), not subtree (overkill for same-repo plugins), not npm packages (wrong granularity for full-stack feature slices).

Plugin workflow:
1. Plugin lives on `plugin/feature-name` branch
2. User runs `git merge plugin/feature-name --no-ff`
3. Plugin adds files to `src/features/`, `convex/`, i18n namespaces, nav entries
4. Merge conflicts are minimized by making shared files data-driven (arrays/objects, not procedural code)

**Confidence:** HIGH -- this is the fullproduct.dev pattern the project explicitly follows.

### Shared Zod Schemas: `src/shared/schemas/` with `~/` Alias

Zod v4 schemas live in `src/shared/schemas/` and are imported by both:
- Frontend: `@tanstack/react-form` validators (import via `@/shared/schemas/user`)
- Backend: `convex-helpers` zod wrappers (import via `~/src/shared/schemas/user`)

The `~/` path alias is already configured in `convex/tsconfig.json` (`"~/*": ["../*"]`) and is actively used in the codebase (e.g., `~/errors`). Convex's bundler resolves these paths at deploy time.

**Requirements for shared schemas:**
1. Schema files must be pure TypeScript -- no React, no DOM, no browser-only APIs
2. Add schema directory to convex tsconfig `include`: `"../src/shared/schemas/**/*"`
3. Use `"convex-helpers/server/zod4"` import (not `/zod`) for Zod v4 compatibility

**Confidence:** HIGH -- `~/` alias verified in `convex/tsconfig.json` and actively used in `convex/email/`, `convex/init.ts`, etc.

### Plop.js Generators: ESM Plopfile

Plop v4 supports ESM plopfiles natively. Since the project has `"type": "module"` in package.json, use `plopfile.mjs`.

**Note:** Plop does NOT support native TypeScript plopfiles (no `.ts` without a compile step). Use `.mjs` with JSDoc annotations if type safety is needed.

Generators to build:
- `plop feature` -- scaffold `src/features/{name}/` + `convex/{name}/`
- `plop route` -- scaffold a TanStack Router route file importing from a feature
- `plop convex-function` -- scaffold a typed Convex query/mutation/action with Zod validation
- `plop form` -- scaffold a form component with shared Zod schema + TanStack Form

Templates live in `plop-templates/` at project root.

**Confidence:** HIGH -- Plop v4 ESM support verified via official docs.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Plop.js | Hygen | If you need YAML front-matter templates and dislike Handlebars. But Plop's adoption is much wider and Hygen is less maintained. |
| Plop.js | Turbo generators | If already using Turborepo. This project explicitly avoids monorepo tooling. |
| Plop.js | Custom Node scripts | Never. Reinventing what Plop already solves. |
| git merge (branches) | git subtree | If plugins come from external repos. Here plugins are same-repo branches. |
| git merge (branches) | git submodules | Never for a starter kit. Submodules add friction for every user. |
| git merge (branches) | npm packages | If plugins are runtime-only (no file generation). Full-stack feature slices need file-level integration. |
| Direct Zod imports | tRPC | If you had a REST/GraphQL API. Convex has its own RPC layer; tRPC is redundant. |
| Convention (barrel exports) | @nx/enforce-module-boundaries | If using Nx. This project avoids monorepo tooling. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Yeoman | Heavyweight, outdated generator framework. Massive boilerplate for simple scaffolding. | Plop.js |
| tRPC | Redundant with Convex's built-in typed RPC. Adds unnecessary abstraction layer. | Direct Convex API + Zod validation |
| git submodules | Terrible DX for starter kit users. Requires init, update, recursive clone. Users will abandon the project. | git merge branches |
| Zod v3 (`zod@3.x`) | v4 is stable, 14x faster, already installed. No reason to downgrade. | Zod v4 (`zod@^4.3.6`) |
| @zod/mini | Too limited for server-side validation (no transforms, no refinements). Only useful for tiny client bundles. | Full `zod` package |
| zodvex (third-party) | Unnecessary now that convex-helpers natively supports Zod v4. Adds a dependency for something already built-in. | convex-helpers Zod wrappers |
| Nx / Turborepo | Project constraint: single package, no monorepo tooling. These tools solve problems this project doesn't have. | Folder conventions + barrel exports |
| eslint-plugin-import (for boundaries) | Heavy, slow, frequent false positives. Convention + code review is sufficient for a starter kit. | Naming conventions + barrel exports |
| `convex-helpers/server/zod` | Targets Zod v3. This project uses Zod v4. Will cause runtime errors about missing `._def` property. | `convex-helpers/server/zod4` |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| convex-helpers@0.1.114 | zod@4.3.6 | Verified: npm tree shows direct resolution. Import from `convex-helpers/server/zod4` for v4 support. |
| plop@4.0.5 | Node 18+ / ESM projects | Works with `"type": "module"`. Use `plopfile.mjs` or `plopfile.js`. |
| @tanstack/react-form@1.28.4 | zod@4.3.6 | TanStack Form has a Zod adapter. Verify the adapter works with Zod v4 before full integration (MEDIUM confidence). |
| @tanstack/router-plugin@1.166.3 | zod@3.25.76 (internal) | Router plugin bundles its own Zod v3 internally. Does NOT conflict with project's Zod v4 -- npm resolves both. |
| zod@4.3.6 | TypeScript 5.9+ | Zod v4 requires TS 5.0+. Project uses 5.9.3, fully compatible. |

## Sources

- [convex-helpers Zod v4 issue #558](https://github.com/get-convex/convex-helpers/issues/558) -- confirmed resolved, Zod v4 supported
- [Zod v4 release notes](https://zod.dev/v4) -- performance benchmarks, API changes, migration guide
- [Plop.js official documentation](https://plopjs.com/documentation/) -- ESM support, TypeScript limitations
- [Plop.js npm](https://www.npmjs.com/package/plop) -- v4.0.5 latest
- [bulletproof-react project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) -- feature folder conventions
- [Robin Wieruch React Folder Structure 2025](https://www.robinwieruch.de/react-folder-structure/) -- progressive folder organization guide
- [Convex Zod validation article](https://stack.convex.dev/typescript-zod-function-validation) -- zCustomQuery/zCustomMutation patterns
- [Convex project configuration](https://docs.convex.dev/production/project-configuration) -- convex.json options, folder configuration
- npm dependency tree verification (local) -- confirmed convex-helpers@0.1.114 resolves zod@4.3.6
- `convex/tsconfig.json` analysis (local) -- `~/` alias configuration verified

---
*Stack research for: Architecture modernization of feather-starter-convex*
*Researched: 2026-03-09*
