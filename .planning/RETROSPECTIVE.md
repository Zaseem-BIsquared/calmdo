# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Architecture Modernization

**Shipped:** 2026-03-09
**Phases:** 1 | **Plans:** 9 | **Sessions:** 1

### What Was Built
- Feature-folder architecture: 6 frontend domains, 4 backend domains, shared schemas
- Git-based plugin system with 3 demo plugins and install script
- 4 CLI generators producing wired-up TypeScript via Plop.js + Handlebars
- Shared Zod validation bridging client and Convex server via zodToConvex + zCustomMutation
- Comprehensive documentation: PROVIDERS.md, architecture diagram, 6 feature READMEs

### What Worked
- Single-phase consolidation: 9 plans in dependency order avoided cross-phase coordination overhead
- Wave-based execution: plans 01-01 through 01-07 sequential, 01-08/01-09 gap closure in parallel
- Atomic API path migration (01-02): highest-risk operation completed cleanly by updating all paths in one commit
- GSD audit loop: verification caught 4 gaps (typecheck errors, missing Zod wiring), gap closure plans fixed them

### What Was Inefficient
- Traceability table statuses in REQUIREMENTS.md never updated from "Pending" during execution — had to fix post-audit
- ROADMAP.md plan checkboxes for gap closure plans (01-08, 01-09) not checked after execution
- Summary one_liner fields not populated (CLI extract returned null) — manual extraction needed at milestone completion

### Patterns Established
- Feature folder convention: `src/features/{name}/components/`, `hooks/`, `index.ts` barrel + matching `convex/{name}/`
- Plugin extension points: data-driven navItems array, namespace-based i18n JSON files, feature-grouped ERRORS constant
- Thin routes: route files under 20 lines, import page components from feature folders
- Backward compat shims: re-export files at old paths during migration (validators.ts, errors.ts)

### Key Lessons
1. Plan status tracking (checkboxes, traceability) should update during execution, not after — saves cleanup
2. Gap closure plans are natural and cheap — the audit loop is worth running before milestone completion
3. One mega-phase with ordered plans works well for tightly coupled changes; multiple phases better for independent work

### Cost Observations
- Model mix: 100% opus (quality profile)
- Sessions: 1 (full milestone in single session)
- Notable: 41 minutes total execution for 9 plans — 4.6min average per plan

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 1 | First milestone — established GSD workflow patterns |

### Cumulative Quality

| Milestone | Tests | Coverage | Plans |
|-----------|-------|----------|-------|
| v1.0 | All pass | 100% | 9 |

### Top Lessons (Verified Across Milestones)

1. (Accumulates after 2+ milestones)
