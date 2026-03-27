---
phase: 7
slug: mece-test-rewrite
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-27
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x with v8 coverage |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` (includes coverage thresholds at 100%) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

Phase 7 has no mapped requirement IDs (success criteria derived during planning). Each task is verified by:

| Task Pattern | Test Type | Automated Command | Status |
|-------------|-----------|-------------------|--------|
| Backend test rewrite | unit/integration | `npm test` | ⬜ pending |
| Frontend test rewrite | unit/integration | `npm test` | ⬜ pending |
| Utils/shared cleanup | unit | `npm test` | ⬜ pending |
| Coverage config update | config | `npm test` (100% thresholds) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
- `convex/test.setup.ts` — `createConvexTest` fixture
- `src/test-helpers.tsx` — `renderWithRouter` helper
- `vitest.config.ts` — coverage config with 100% thresholds
- `feather-testing-convex` — already installed and configured

No new test infrastructure needed. This phase only rewrites existing test files.

---

## Manual-Only Verifications

All phase behaviors have automated verification. The `npm test` command with 100% coverage thresholds ensures complete coverage.

---

## Validation Sign-Off

- [x] All tasks have automated verification via `npm test`
- [x] Sampling continuity: every task verified by same command
- [x] Wave 0 covers all requirements (existing infra)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
