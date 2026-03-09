---
phase: 1
slug: architecture-modernization
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 01-01-01 | 01 | 1 | STRUCT-07 | smoke | `npx vitest run --coverage` | N/A (config) | ⬜ pending |
| 01-01-02 | 01 | 1 | STRUCT-03 | unit | `npx vitest run` | Yes | ⬜ pending |
| 01-02-01 | 02 | 2 | STRUCT-02, STRUCT-06 | unit | `npx vitest run convex/` | Yes (adapt) | ⬜ pending |
| 01-02-02 | 02 | 2 | VAL-01, VAL-02 | unit | `npx vitest run src/shared/schemas/` | Wave 0 | ⬜ pending |
| 01-02-03 | 02 | 2 | VAL-03 | unit | `npx vitest run src/shared/schemas/` | Wave 0 | ⬜ pending |
| 01-02-04 | 02 | 2 | VAL-04, STRUCT-08 | unit | `npx vitest run convex/` | Wave 0 | ⬜ pending |
| 01-03-01 | 03 | 3 | STRUCT-01, STRUCT-04 | unit | `npx vitest run src/features/` | Wave 0 | ⬜ pending |
| 01-03-02 | 03 | 3 | STRUCT-05 | unit | `npx vitest run src/features/` | Wave 0 | ⬜ pending |
| 01-04-01 | 04 | 4 | PLUG-01 | unit | `npx vitest run src/shared/nav` | Wave 0 | ⬜ pending |
| 01-04-02 | 04 | 4 | PLUG-02 | unit | `npx vitest run src/i18n/` | Wave 0 | ⬜ pending |
| 01-04-03 | 04 | 4 | PLUG-03 | unit | `npx vitest run src/shared/errors/` | Wave 0 | ⬜ pending |
| 01-05-01 | 05 | 5 | PLUG-04-10 | manual | `bash scripts/plugin.sh list` | N/A | ⬜ pending |
| 01-06-01 | 06 | 6 | GEN-01-04 | smoke | `npx plop feature -- --name test-feat` | Wave 0 | ⬜ pending |
| 01-06-02 | 06 | 6 | DOC-01-03 | manual | File existence check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/shared/schemas/*.test.ts` — stubs for VAL-01, VAL-03
- [ ] Schema tests for zodToConvex enum derivation — covers VAL-04
- [ ] Navigation config unit tests — covers PLUG-01
- [ ] Generator output smoke tests (Plop programmatic API) — covers GEN-01-04

*Existing infrastructure covers: STRUCT-06, STRUCT-07, STRUCT-08*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| plugin.sh commands work | PLUG-04 | Shell script CLI testing | Run `bash scripts/plugin.sh list`, verify output |
| Multi-plugin merge succeeds | PLUG-10 | Git branch operations | Create two plugin branches, merge both, verify no conflicts |
| README/docs accuracy | DOC-01-03 | Content quality judgment | Review generated docs for accuracy and completeness |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
