# Research Summary: Feather Starter Convex -- Architecture Modernization

**Domain:** SaaS starter kit restructure (React + Convex + Stripe)
**Researched:** 2026-03-09
**Overall confidence:** HIGH

## Executive Summary

The architecture modernization of feather-starter-convex requires exactly one new dependency: `plop@^4.0.5` for CLI generators. Everything else -- Zod v4, convex-helpers with Zod v4 support, TanStack Form -- is already installed and compatible. The project's existing `~/` path alias in `convex/tsconfig.json` enables the critical shared-schema pattern (Zod schemas in `src/shared/schemas/` imported by both frontend and Convex backend).

The restructure follows well-established patterns: bulletproof-react's feature-folder convention for frontend organization, domain-folder organization for Convex backend functions, and the fullproduct.dev git-branch-merge pattern for plugins. None of these require new libraries -- they are file organization conventions enforced by barrel exports and code review.

The highest-risk operation is the Convex backend restructure (splitting `convex/app.ts` into domain folders), which changes every `api.*` import path across the entire codebase. This must be done atomically in a single commit. TypeScript catches all broken references, so the risk is manageable if `typecheck` is run before committing.

The critical discovery is that `convex-helpers` maintains separate import paths for Zod v3 and v4: the project must use `"convex-helpers/server/zod4"` (not `"convex-helpers/server/zod"`). Using the wrong path will cause runtime errors.

## Key Findings

**Stack:** Only one new dependency needed: `plop@^4.0.5`. All other tooling is already installed.
**Architecture:** Feature folders (bulletproof-react pattern) + domain-organized Convex backend + git-branch plugins.
**Critical pitfall:** Convex API path breakage -- reorganizing `convex/` changes ALL `api.*` paths atomically. Must update all references in one commit.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Shared Infrastructure** - Build `src/shared/` with schemas, errors, types, config, navigation
   - Addresses: Shared types/schemas, path alias setup, plugin-friendly file design
   - Avoids: Building features before their foundation exists
   - Includes: Converting vitest coverage config to globs (prerequisite for safe file moves)

2. **Convex Backend Restructure** - Split `convex/app.ts` and `convex/stripe.ts` into domain folders
   - Addresses: Backend feature-folder organization, API path migration
   - Avoids: Partial migrations that leave code in un-buildable state (Pitfall 1)
   - Risk: MEDIUM -- atomic commit required, typecheck is the safety net

3. **Frontend Feature Folders** - Extract components from routes into `src/features/`
   - Addresses: Thin route files, co-located tests, barrel exports
   - Avoids: Moving route files out of `src/routes/` (TanStack Router constraint)
   - Depends on: Stable API paths from Phase 2

4. **i18n Namespaces + Zod Server Validation** - Split translations, wire shared schemas
   - Addresses: Namespaced i18n (plugin-friendly), shared Zod validation, username bug fix
   - Avoids: Using wrong convex-helpers import path (must use `/zod4`)
   - Includes: Verifying TanStack Form Zod v4 adapter compatibility

5. **Plugin Infrastructure + CLI Generators** - Plop.js generators, git plugin system, first plugin branches
   - Addresses: Developer velocity, plugin installation workflow
   - Avoids: Creating generators before conventions are finalized (Pitfall 12)
   - Depends on: All previous phases being stable

**Phase ordering rationale:**
- Shared infrastructure must exist before features can import from it
- Backend restructure must happen before frontend features (frontend needs stable API paths)
- Plugin-friendly files must be designed before plugin branches exist
- Generators must be last because they codify the final structure

**Research flags for phases:**
- Phase 2: High attention needed -- API path breakage is the riskiest operation
- Phase 4: Needs verification -- TanStack Form Zod v4 adapter compatibility is MEDIUM confidence
- Phase 5: Standard patterns, but test two-plugin merge scenario before shipping

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only one new dependency (plop). All versions verified via npm. |
| Features | HIGH | Feature list derived from PROJECT.md requirements + bulletproof-react conventions. |
| Architecture | HIGH | `~/` alias verified in convex/tsconfig.json. Feature folder pattern well-established. |
| Pitfalls | HIGH | All critical pitfalls verified against codebase analysis. Convex API path behavior confirmed. |
| Zod v4 + convex-helpers | HIGH | npm tree confirms zod@4.3.6 resolved for convex-helpers@0.1.114. |
| TanStack Form + Zod v4 | MEDIUM | Adapter exists but Zod v4 compatibility not directly verified. Needs testing. |
| Plop ESM support | HIGH | Official docs confirm ESM plopfile support. TS not supported natively. |

## Gaps to Address

- TanStack Form's Zod adapter needs hands-on verification with Zod v4 (test a simple form before full migration)
- The exact `convex-helpers/server/zod4` import API (function signatures) should be verified against current docs when building Phase 4
- Plugin branch merge testing with two concurrent plugins has not been validated -- needs real-world testing in Phase 5
- Whether `convex/tsconfig.json` `include` needs updating to cover `../src/shared/schemas/**/*` for full type coverage
