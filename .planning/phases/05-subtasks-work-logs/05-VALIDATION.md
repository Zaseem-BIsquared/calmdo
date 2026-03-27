---
phase: 5
slug: subtasks-work-logs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit/integration) + feather-testing-convex (Convex test helpers) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --silent` |
| **Full suite command** | `npm test -- --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --silent`
- **After every plan wave:** Run `npm test -- --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SUB-01..07, WLOG-01..04 | unit | `npm test -- convex/subtasks convex/workLogs --silent` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | SUB-01..07 | unit | `npm test -- convex/subtasks --silent` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | WLOG-01..04 | unit | `npm test -- convex/workLogs --silent` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | VIEW-05 | unit | `npm test -- src/features/subtasks src/features/workLogs --silent` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | SUB-01, SUB-02, SUB-05 | unit | `npm test -- src/ui/sheet --silent` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `convex/subtasks/mutations.test.ts` — stubs for SUB-01..07
- [ ] `convex/subtasks/queries.test.ts` — stubs for subtask listing
- [ ] `convex/workLogs/mutations.test.ts` — stubs for WLOG-01..03
- [ ] `convex/workLogs/queries.test.ts` — stubs for WLOG-04

*Existing test infrastructure (feather-testing-convex, vitest config) covers all phase requirements. Generator will scaffold test stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Side panel slide animation | VIEW-05 | CSS animation not testable in jsdom | Open panel, verify smooth slide-in from right |
| Drag-reorder subtasks | SUB-05 | dnd-kit pointer simulation not available in jsdom | Drag subtask to new position, verify reorder persists |
| Sheet overlay click-outside close | VIEW-05 | Radix portal interactions not testable in jsdom | Click overlay area, verify panel closes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
