---
phase: 2
slug: auth-dx-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (unit/integration) + Playwright latest (E2E) |
| **Config file** | `vitest.config.ts` (exists), `playwright.config.ts` (Wave 0) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage && npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --coverage && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | unit | `npx vitest run src/features/auth/` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-01 | E2E | `npx playwright test e2e/auth.spec.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | DX-02 | manual-only | `git commit` triggers Lefthook | N/A | ⬜ pending |
| 02-03-01 | 03 | 2 | DX-01 | unit | `npx vitest run convex/devEmails/` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | AUTH-02 | unit | `npx vitest run src/features/auth/` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 3 | DX-03 | E2E | `npx playwright test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` — Playwright configuration
- [ ] `e2e/fixtures.ts` — Convex Playwright test setup with `createConvexTest()`
- [ ] `e2e/auth.spec.ts` — Auth flow E2E test stubs
- [ ] `convex/testing/clearAll.ts` — Mutation to clear all test data
- [ ] Framework install: `npm install -D @playwright/test lefthook && npx playwright install chromium`

*Note: DX-01 (dev mailbox) is verified by unit tests in Plan 03 (`convex/devEmails/*.test.ts`). No separate E2E spec needed — the dev mailbox route is exercised indirectly by the password reset E2E test in `e2e/auth.spec.ts` (which reads the reset code from the dev mailbox).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pre-commit hook runs coverage | DX-02 | Requires actual git commit trigger | 1. Stage a file 2. Run `git commit` 3. Verify Lefthook runs vitest coverage 4. Verify commit blocked if coverage < 100% |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
