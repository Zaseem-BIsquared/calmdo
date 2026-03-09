# Feature Research

**Domain:** SaaS starter kit architecture (React + Convex)
**Researched:** 2026-03-09
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features developers assume exist in a well-structured starter kit. Missing these means the kit feels amateur or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Feature-folder organization (frontend) | Bulletproof-react, create-t3-app, and every serious React project uses this pattern. Flat `src/ui/` with 15 files and 250-line route files signals a toy project. | MEDIUM | Move components, hooks, and types into `src/features/{auth,billing,settings,onboarding,dashboard}`. Each feature exports through `index.ts` barrel file. |
| Feature-folder organization (backend) | Same principle for `convex/`. The existing `convex/email/` and `convex/otp/` already prove the pattern works; `app.ts` at 183 lines is the anti-pattern that needs splitting. | MEDIUM | Split `app.ts` into `convex/users/`, `convex/billing/`, etc. This breaks all `api.*` import paths -- one-time migration cost. |
| Thin route files | Route files should be ~20-30 lines: imports from feature folder, passes props, renders. Settings route at 232 lines and billing at 256 lines are red flags. | MEDIUM | Routes become `import { SettingsPage } from '@/features/settings'` + loader/component wiring. Logic lives in feature folders. |
| Shared code layer (`src/shared/`) | Bulletproof-react's unidirectional architecture: `shared -> features -> app`. Shared UI, hooks, utils, and types need a clear home separate from features. | LOW | Move current `src/ui/`, `src/utils/`, `src/types/` into `src/shared/`. Enforce: features import from shared, never from other features. |
| Co-located tests | Standard practice since 2023+. Tests next to source files (`feature/component.test.tsx` beside `feature/component.tsx`) instead of a separate `tests/` tree. | LOW | Move test files from top-level into their feature folders. Test helpers stay in `src/shared/testing/`. |
| Shared Zod schemas (client-server) | Single source of truth for validation. Username bug (UI says 32 max, Zod says 20) is exactly the problem shared schemas solve. Zod v4 already installed. | MEDIUM | `src/shared/schemas/` with schemas imported by both frontend forms and Convex mutations. Requires verifying convex-helpers Zod v4 compatibility. |
| Path aliases (`@/`) | Every modern React starter uses `@/` or `~/` aliases. Makes imports readable and refactor-safe vs `../../../shared/ui/button`. | LOW | Ensure `@/features/*`, `@/shared/*` work everywhere via Vite + TSConfig. |
| Architecture documentation | README, feature READMEs, PROVIDERS.md. Developers clone the repo and need to understand the structure in 5 minutes. ShipFast and create-t3-app both emphasize this. | LOW | One root architecture doc + per-feature README explaining the folder's purpose and public API. |

### Differentiators (Competitive Advantage)

Features that set feather-starter apart from generic SaaS boilerplates. These are where the kit competes.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Git-based plugin system | FullProduct.dev's killer innovation: features live on git branches, installed via `git merge`. Developers review the diff as a PR, understand exactly what code changes, and can customize before merging. No runtime plugin abstraction, no dependency hell. No other React+Convex starter does this. | HIGH | Requires: (1) install script to automate `git remote add` + `git merge`, (2) plugin branches that merge cleanly into main, (3) shared files designed for merge (data-driven nav, namespaced i18n, error code ranges). |
| Plugin-friendly shared files | The hidden prerequisite to git plugins. Navigation config must be data-driven (array of items, not JSX). i18n must be namespaced per feature. Error codes must use non-overlapping ranges. Without this, every plugin merge creates conflicts. | HIGH | Design `site.config.ts` nav as a data array, i18n as `{feature}.{key}` namespaces, errors as `{FEATURE}_{CODE}` ranges. This is architectural -- must be right before any plugins ship. |
| CLI generators (Plop.js) | `npm run gen:feature auth` scaffolds the entire feature folder structure. `npm run gen:route dashboard/analytics` creates route + feature wiring. Eliminates the "where do I put this?" question. ShipFast gets praise for AI-friendly structure; generators go further by automating it. | MEDIUM | Plop.js over Hygen because Plop is programmatic (JS config), Hygen is file-based. Plop integrates better with existing build tooling. Generators: `feature`, `route`, `convex-function`, `form`. |
| First-party plugin catalog | Three initial plugin branches: CI pipeline, command palette, admin panel. These serve as proof-of-concept AND useful features. Developers see the plugin system works by using it. | HIGH | Each plugin is a git branch with a README showing the diff. CI plugin is lowest risk (no UI changes). Command palette is medium. Admin panel is highest complexity. |
| Zod validation in Convex mutations | Most Convex starters skip server-side validation or use ad-hoc checks. Shared Zod schemas in mutations close the validation gap. Type-safe from form to database. | MEDIUM | convex-helpers provides Zod integration, but Zod v4 compatibility needs verification. If incompatible, pin Zod v3 for server or use Convex validators with a Zod-to-Convex adapter. |
| Feature-scoped barrel exports (`index.ts`) | Each feature folder exposes a public API via `index.ts`. Other features and routes can ONLY import from this barrel. Enforces encapsulation, makes features portable, and enables the plugin system. ESLint rules can enforce this boundary. | LOW | Add `eslint-plugin-boundaries` or custom ESLint rule: `no-restricted-imports` from feature internals. This is what makes features truly modular vs just "files in a folder." |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Backend abstraction layer | "Support Supabase/Firebase too" | Convex is fundamentally un-abstractable (reactive queries, server functions, file storage are tightly coupled). Abstraction would gut Convex's advantages and create a leaky abstraction nobody trusts. | Stay Convex-only. The feature-folder architecture IS the abstraction -- if someone wants to swap backends, they replace feature internals, not an abstraction layer. |
| Monorepo with Turborepo/Nx | "Separate packages for shared code" | Single-package with folders is simpler for Convex (which needs direct access to schema/functions). Monorepo adds tooling overhead (workspace resolution, build orchestration) without proportional benefit for a starter kit. | Use `src/shared/` and `convex/` as logical boundaries within one package. Path aliases provide the same import ergonomics as separate packages. |
| Runtime plugin registry | "Plugins register at runtime like WordPress" | Runtime plugins need a stable API contract, versioning strategy, and sandbox. This is a framework, not a starter kit. Git merge plugins are reviewable, customizable, and zero-runtime-cost. | Git-based plugins. The diff IS the documentation. No runtime overhead, no API versioning. |
| Universal (web + mobile) support | "Add React Native/Expo" | Doubles the surface area, requires platform-specific UI, and fundamentally changes the architecture. FullProduct.dev does this but it IS the product. For a web SaaS starter, it's scope creep. | Stay web-only. Feature-folder architecture would support a future mobile layer, but don't build for it now. |
| "Everything is a plugin" maximalism | "Make auth, billing, dashboard all plugins" | Core features that every user needs should not be optional. Making auth a plugin means the base kit is broken without it. Plugins are for OPTIONAL features (command palette, admin panel, analytics). | Core features stay in `main`. Only truly optional features become plugins. Rule of thumb: if removing it breaks the app, it's not a plugin. |
| Auto-generated CRUD for all models | "Generate full CRUD from schema" | Convex functions are intentionally hand-written with business logic. Auto-CRUD encourages thin-server thinking that misses Convex's strengths (optimistic updates, reactive queries, server-side logic). | Generators scaffold the boilerplate structure, but business logic is always hand-written. Generator creates the file, developer fills in the logic. |
| npm-packaged plugins | "Publish plugins to npm" | Full-stack feature slices span frontend, backend, schemas, i18n, and config. npm packages cannot modify files across these boundaries. A plugin that adds a nav item, an i18n namespace, a Convex function, AND a route cannot be an npm package. | Git branches that add files to the right locations. The merge IS the install. |

## Feature Dependencies

```
Feature-folder organization (frontend)
    +-- requires --> Shared code layer (src/shared/)
    +-- requires --> Path aliases (@/)
    +-- enables --> Co-located tests
    +-- enables --> Feature-scoped barrel exports

Feature-folder organization (backend)
    +-- enables --> Zod validation in Convex mutations
    (note: breaks all api.* paths, must update frontend in lockstep)

Shared Zod schemas
    +-- requires --> Feature-folder organization (both frontend + backend)
    +-- enables --> Zod validation in Convex mutations

Plugin-friendly shared files
    +-- requires --> Feature-folder organization (frontend)
    +-- requires --> Thin route files
    +-- enables --> Git-based plugin system

Git-based plugin system
    +-- requires --> Plugin-friendly shared files
    +-- requires --> Feature-scoped barrel exports
    +-- requires --> Architecture documentation
    +-- enables --> First-party plugin catalog

CLI generators
    +-- requires --> Feature-folder organization (established conventions)
    +-- independent of --> Plugin system (generators work without plugins)

Thin route files
    +-- requires --> Feature-folder organization (frontend)
```

### Dependency Notes

- **Feature folders require shared layer:** You need `src/shared/` to exist before features can import from it. Build the container before filling it.
- **Backend restructure breaks API paths:** Reorganizing `convex/` changes every `api.app.getUser` to `api.users.get`. All frontend calls must update simultaneously. This is a big-bang migration, not incremental.
- **Plugin-friendly files require feature folders:** You cannot design merge-friendly navigation config until you know how features are structured. The data-driven nav array reflects the feature list.
- **Git plugins require documentation:** A plugin branch without a README showing what it adds is useless. Documentation is a prerequisite, not an afterthought.
- **CLI generators are independent:** Generators can be built any time after feature folder conventions are established. They don't block or depend on the plugin system.

## MVP Definition

### Launch With (v1 -- the restructure itself)

Minimum viable architecture modernization. This is what makes the codebase "feature-folder organized."

- [ ] Shared code layer (`src/shared/`) -- foundation everything else builds on
- [ ] Feature-folder organization (frontend) -- the core deliverable
- [ ] Feature-folder organization (backend) -- with lockstep API path migration
- [ ] Thin route files -- routes become glue, features hold logic
- [ ] Co-located tests -- tests move with their features
- [ ] Path aliases -- clean imports across the new structure
- [ ] Shared Zod schemas -- fix the validation gap (username bug is the poster child)

### Add After Validation (v1.x -- plugin infrastructure)

Features to add once the feature-folder structure is proven stable.

- [ ] Plugin-friendly shared files -- refactor nav/i18n/errors for clean merges
- [ ] Feature-scoped barrel exports with ESLint enforcement -- formalize boundaries
- [ ] CLI generators (Plop.js) -- automate the now-established patterns
- [ ] Architecture documentation -- document the conventions generators enforce

### Future Consideration (v2+ -- plugin ecosystem)

Features to defer until the architecture is battle-tested.

- [ ] Git-based plugin system (install script, CI) -- needs stable base to merge into
- [ ] First plugin: CI pipeline -- lowest risk proof of concept
- [ ] First plugin: command palette -- medium complexity, high developer value
- [ ] First plugin: admin panel -- highest complexity, needs stable feature boundaries

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Shared code layer (`src/shared/`) | HIGH | LOW | P1 |
| Feature-folder organization (frontend) | HIGH | MEDIUM | P1 |
| Feature-folder organization (backend) | HIGH | MEDIUM | P1 |
| Thin route files | HIGH | MEDIUM | P1 |
| Co-located tests | MEDIUM | LOW | P1 |
| Shared Zod schemas | HIGH | MEDIUM | P1 |
| Path aliases | MEDIUM | LOW | P1 |
| Zod in Convex mutations | MEDIUM | MEDIUM | P1 |
| Plugin-friendly shared files | HIGH | HIGH | P2 |
| Feature-scoped barrel exports + ESLint | MEDIUM | LOW | P2 |
| CLI generators (Plop.js) | MEDIUM | MEDIUM | P2 |
| Architecture documentation | MEDIUM | LOW | P2 |
| Git-based plugin system | HIGH | HIGH | P3 |
| First-party plugin catalog | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (the restructure itself)
- P2: Should have, add when possible (plugin infrastructure)
- P3: Nice to have, future consideration (plugin ecosystem)

## Competitor Feature Analysis

| Feature | create-t3-app | FullProduct.dev | ShipFast | Bulletproof-react | Our Approach |
|---------|---------------|-----------------|----------|-------------------|--------------|
| Feature folders | No (type-based default) | Yes (core philosophy) | No (flat, "AI-friendly") | Yes (gold standard docs) | Yes -- follow Bulletproof-react conventions |
| Plugin system | No | Git-based (branch merge) | No | No | Git-based, inspired by FullProduct.dev |
| CLI generators | `create-t3-app` itself | Not documented | No | No | Plop.js for features, routes, functions |
| Shared validation | tRPC + Zod (different stack) | Zod schemas in feature folders | Not documented | Not opinionated | Zod v4 shared schemas, client + Convex server |
| Test co-location | Not opinionated | Not documented | Not documented | Recommended | Tests live in feature folders |
| Barrel exports | Not enforced | Uses them | Not documented | Enforced (public API per feature) | Enforced with ESLint boundaries |
| Architecture docs | Excellent (create.t3.gg) | Good (fullproduct.dev/docs) | Minimal | Excellent (GitHub docs) | Feature READMEs + PROVIDERS.md |
| Backend organization | Next.js API routes | Feature-colocated resolvers | Next.js API routes | Not backend-focused | Feature-organized Convex functions |

## Sources

- [Bulletproof React - Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) -- gold standard for React feature-folder architecture
- [FullProduct.dev - Project Structure](https://fullproduct.dev/docs/project-structure) -- git-based plugin and feature-folder patterns
- [FullProduct.dev - Universal App Router](https://github.com/FullProduct-dev/universal-app-router) -- `git merge with/green-stack` plugin pattern
- [Create T3 App - Folder Structure](https://create.t3.gg/en/folder-structure-app) -- mainstream starter kit conventions
- [ShipFast](https://shipfa.st/) -- SaaS boilerplate feature expectations and DX patterns
- [Robin Wieruch - React Folder Structure in 5 Steps](https://www.robinwieruch.de/react-folder-structure/) -- progressive folder structure guide
- [Plop.js vs Hygen vs Yeoman comparison](https://npm-compare.com/hygen,plop,yeoman-generator) -- scaffolding tool analysis
- [SaaS Pegasus - Boilerplates Guide](https://www.saaspegasus.com/guides/saas-boilerplates-and-starter-kits/) -- SaaS starter kit landscape
- PROJECT.md constraints and existing codebase analysis

---
*Feature research for: SaaS starter kit architecture (React + Convex)*
*Researched: 2026-03-09*
