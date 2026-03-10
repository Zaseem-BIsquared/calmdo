# Feather Starter Convex

## What This Is

A full-stack SaaS starter kit built on React + Convex + Stripe, featuring feature-folder architecture, shared Zod validation across client and server, git-based plugins, and CLI generators. Used both as an open-source boilerplate for other developers and as the foundation for the author's own products.

## Core Value

Developer velocity — new features are faster to build because every file has a clear, predictable home, and common patterns are automated through generators and shared schemas.

## Requirements

### Validated

- ✓ Email OTP authentication with Resend — existing
- ✓ GitHub OAuth authentication — existing
- ✓ Stripe subscription billing (checkout, portal, webhooks) — existing
- ✓ User profile management (username, avatar upload) — existing
- ✓ Onboarding flow with username setup — existing
- ✓ Dashboard with sidebar navigation — existing
- ✓ i18n support (English, Spanish) — existing
- ✓ Account deletion with Stripe cleanup — existing
- ✓ 100% test coverage (frontend + backend) — existing
- ✓ SEO with react-helmet-async — existing
- ✓ Feature-folder structure for frontend (`src/features/`) — v1.0
- ✓ Feature-folder structure for backend (`convex/` by domain) — v1.0
- ✓ Shared cross-feature code in `src/shared/` — v1.0
- ✓ Thin route files (routes import from features) — v1.0
- ✓ Git-based plugin infrastructure (install script, CI, docs) — v1.0
- ✓ Plugin-friendly shared files (data-driven nav, namespace i18n, error groups) — v1.0
- ✓ First plugin branches (CI, command palette, admin panel) — v1.0
- ✓ Shared Zod schemas for client-server validation — v1.0
- ✓ Zod validation in Convex mutations via zCustomMutation — v1.0
- ✓ CLI generators via Plop.js (route, feature, convex-function, form) — v1.0
- ✓ Architecture documentation (PROVIDERS.md, feature READMEs, updated README) — v1.0

### Active

#### Current Milestone: v2.0 CalmDo Core

**Goal:** Build a task management system for a small team — tasks, projects, subtasks, time logging, and audit trail — as vertical slices showcasing the starter template architecture.

**Target features:**
- Quick Tasks with private/shared visibility and status workflow
- Projects with status management (active/on_hold/completed/archived)
- Subtasks with promotion to full tasks
- Task Links (spawned_from, blocked_by)
- Work Logs with optional time tracking
- Activity Logs (auto-generated audit trail)
- Filters (status, priority, project)
- Text search across tasks and projects

### Out of Scope

- Workspace drivers / backend abstraction layer — Convex is un-abstractable by design
- Universal (web + mobile) — web-only starter kit
- Monorepo tooling — using folders within single package, not Turborepo/Nx
- Runtime plugin system — git-branch merge is simpler and more transparent
- Auto-generated CRUD — too opinionated, limits flexibility
- Organization/multi-org schema — deferred; v2.0 scopes to user-level, no org layer yet

## Context

- **CalmDo vision:** Consolidated from 7+ attempts across Phoenix, React Native, Convex — see `_calmdo/` for product spec, domain model, roadmap, and lessons learned
- **Reference artifacts:** Kiro feature specs (7 areas), permission framework, schema design — see `_reference/`
- **Shipped v1.0** on 2026-03-09: 65 commits, 181 files changed, ~17.8k lines added
- **Tech stack:** React + TanStack Router, Convex, Stripe, Zod v4, Plop.js, Vitest, i18next
- **Structure:** 6 frontend feature folders, 4 backend domain folders, shared schemas in `src/shared/schemas/`
- **Plugins:** 3 plugin branches (infra-ci, command-palette, admin-panel), install via `scripts/plugin.sh`
- **Generators:** 4 CLI generators scaffolding wired-up TypeScript files
- **Known tech debt:** Pre-existing TS2554 in convex/http.ts, infra-ci branch local-only (needs workflow token), NavItem.i18nKey unused (designed deferral)

## Constraints

- **Convex schema**: `schema.ts` must remain at convex root (Convex framework requirement)
- **TanStack Router**: Route files must stay in `src/routes/` with their naming convention (framework requirement)
- **API path breakage**: Reorganizing `convex/` changes all `api.*` paths — all frontend calls must be updated in lockstep
- **Plugin merge conflicts**: Shared files (nav, i18n, errors) must be designed for clean git merges
- **Test coverage**: Must maintain 100% coverage throughout any restructure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Folders over monorepo | Single package keeps Convex integration simple, avoids tooling overhead | ✓ Good — feature folders work well within single package |
| Break all API paths at once | One-time cost vs incremental migration; cleaner result | ✓ Good — highest risk operation but completed cleanly |
| Plop.js for generators | Lightweight, template-based, well-maintained; no lock-in | ✓ Good — 4 generators with Handlebars templates |
| Tests co-located with features | Keeps feature folders self-contained; easier to move/delete features | ✓ Good — tests move naturally with their source |
| Zod v4 for shared schemas | Already installed; enables client-server schema sharing | ✓ Good — zodToConvex + zCustomMutation bridges the gap |
| All work in one phase | Interconnected changes; partial adoption leaves awkward state | ✓ Good — 9 plans in dependency order, completed in one session |
| String path constants in nav | Avoids circular dependency between features and routes | ✓ Good — simple, no import cycles |
| Namespace-based i18n | Per-feature JSON files instead of monolithic translation.json | ✓ Good — clean plugin extension point |
| Git-branch plugins over runtime | Simpler, more transparent, full TypeScript support | ✓ Good — 3 demo plugins prove the pattern |

| Skip org layer for v2.0 | User-scoped tasks are simpler; multi-org adds complexity without immediate value for 2-person team | — Pending |
| Vertical slices over horizontal | Each phase delivers complete feature (schema+backend+frontend+tests); maintains 100% coverage | — Pending |

---
*Last updated: 2026-03-10 after v2.0 milestone start*
