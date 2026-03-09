---
phase: 1
slug: architecture-modernization
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 + feather-testing-convex 0.5.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm run typecheck && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | STRUCT-07 | smoke | `npx vitest run --coverage` | N/A (config) | pending |
| 01-01-02 | 01 | 1 | STRUCT-03 | unit | `npx vitest run` | Yes | pending |
| 01-02-01 | 02 | 2 | VAL-01, VAL-02 | unit | `npx vitest run src/shared/schemas/` | Created in task | pending |
| 01-02-02 | 02 | 2 | STRUCT-02, STRUCT-06 | unit | `npx vitest run convex/` | Yes (adapt) | pending |
| 01-02-03 | 02 | 2 | VAL-03, VAL-04, STRUCT-08 | unit | `npx vitest run --coverage` | Yes (split) | pending |
| 01-03-01 | 03 | 3 | STRUCT-01, STRUCT-04 | unit | `npx vitest run src/features/dashboard` | Yes (moved) | pending |
| 01-03-02 | 03 | 3 | STRUCT-01 | unit | `npx vitest run src/features/billing src/features/settings` | Yes (moved) | pending |
| 01-04-01 | 04 | 4 | STRUCT-04 | unit | `npx vitest run src/features/onboarding` | Yes (moved) | pending |
| 01-04-02 | 04 | 4 | STRUCT-05 | unit | `npx vitest run --coverage` | N/A (route thinning) | pending |
| 01-05-01 | 05 | 5 | PLUG-01, PLUG-03 | unit | `npx vitest run src/shared/nav src/shared/errors` | Created in task | pending |
| 01-05-02 | 05 | 5 | PLUG-02 | unit | `npx vitest run --coverage` | N/A (config + JSON) | pending |
| 01-06-01 | 06 | 6 | PLUG-04 | smoke | `bash scripts/plugin.sh` | N/A (script) | pending |
| 01-06-02 | 06 | 6 | PLUG-05, PLUG-06 | manual | `git log plugin/infra-ci-github-actions` | N/A | pending |
| 01-06-03 | 06 | 6 | PLUG-08 | manual | `git log plugin/ui-command-palette` | N/A | pending |
| 01-06-04 | 06 | 6 | PLUG-07, PLUG-09, PLUG-10 | manual | `git branch -a \| grep plugin/` | N/A | pending |
| 01-07-01 | 07 | 7 | GEN-01-04 | smoke | `npx plop feature -- --name test-feat` | N/A (generator) | pending |
| 01-07-02 | 07 | 7 | DOC-01-03 | manual | File existence check | N/A | pending |
| 01-07-03 | 07 | 7 | All | full | `npm run typecheck && npx vitest run --coverage` | All | pending |

---

## Wave 0 Requirements — RESOLVED

Test stubs are created inline by the plans that need them:

- **Plan 02, Task 1** creates `src/shared/schemas/billing.test.ts` — covers VAL-01, VAL-02, VAL-04
- **Plan 05, Task 1** creates `src/shared/nav.test.ts` — covers PLUG-01
- **Plan 05, Task 1** creates `src/shared/errors.test.ts` — covers PLUG-03

Existing test infrastructure covers: STRUCT-06, STRUCT-07, STRUCT-08 (existing test files are split/moved, not created from scratch).

No separate Wave 0 plan needed — test creation is embedded in the plans that create the production code.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| plugin.sh commands work | PLUG-04 | Shell script CLI testing | Run `bash scripts/plugin.sh list`, verify output |
| Multi-plugin merge succeeds | PLUG-10 | Git branch operations | Create two plugin branches, merge both, verify no conflicts |
| README/docs accuracy | DOC-01-03 | Content quality judgment | Review generated docs for accuracy and completeness |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (resolved inline)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
