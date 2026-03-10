# Review Feedback — Consolidated (2026-03-10)

Feedback from 4 viewer reviews, triaged and categorized.

---

## Priority 1: `feather install <module>` CLI (UX Vision)

**The #1 request.** Replace the current multi-generator workflow with a single command that handles the entire "Adding a New Entity" checklist:

```bash
feather install tasks
```

This one command should:
1. Create Zod schema in `src/shared/schemas/{name}.ts`
2. Add table to `convex/schema.ts` using `zodToConvex()`
3. Scaffold backend mutations/queries in `convex/{name}/`
4. Scaffold frontend components in `src/features/{name}/`
5. Create thin route in `src/routes/_app/_auth/`
6. Append nav entry to `src/shared/nav.ts`
7. Append i18n namespace to `src/i18n.ts`
8. Create translation files in `public/locales/{en,es}/`
9. Add error constants to `src/shared/errors.ts`
10. Generate test stubs

**Key requirement:** If interrupted mid-way, running the same command again detects what's done and resumes from where it left off.

**Replaces:** `gen:feature`, `gen:route`, `gen:convex-function`, `gen:form` — all merged into one unified CLI.

**When:** After CalmDo v2.0 proves the patterns with 2-3 real modules built manually.

---

## Priority 2: Move Billing/Stripe Out of Core

Billing is inherited from the starter kit and is not core to Feather or CalmDo. It should become an optional plugin, not part of the default template.

**Approach:** Extract to `plugin/feature-billing` branch using the existing `plugin.sh` system. New projects start without billing; opt in via `feather install billing` (or `git merge plugin/feature-billing` until the CLI exists).

**When:** Next phase (Phase 2 polish or Phase 3).

---

## Priority 3: Bugs to Fix

All confirmed by multiple reviewers. Small scope, high impact.

| # | Bug | Files | Effort |
|---|-----|-------|--------|
| 1 | Missing `await` on `ctx.db.patch` in `updateUserImage` and `removeUserImage` | `convex/users/mutations.ts` | 2 min |
| 2 | Silent auth errors — commented-out error display in login forms | `src/routes/_app/login/_layout.index.tsx` | 15 min |
| 3 | Username uniqueness not enforced (index + check needed) | `convex/schema.ts`, `convex/onboarding/mutations.ts`, `convex/users/mutations.ts` | 15 min |
| 4 | `deleteCurrentUserAccount` race condition — user deleted before scheduled action queries it | `convex/users/mutations.ts` | 15 min |
| 5 | Hardcoded provider list in account deletion (`["resend-otp", "github"]`) | `convex/users/mutations.ts` | 10 min |
| 6 | Unused `userId` arg in `createSubscriptionCheckout` / `createCustomerPortal` | `convex/billing/actions.ts` | 5 min |

**When:** During Phase 2 or as a `/gsd:quick` batch.

---

## Priority 4: Code Quality Improvements

Real issues, not blocking. Fold into Phase 2 plans or a cleanup decimal phase.

| # | Issue | Notes |
|---|-------|-------|
| 1 | Auth guard inconsistency — some mutations return silently, others throw | Create `requireAuth(ctx)` helper |
| 2 | Generic `SOMETHING_WENT_WRONG` errors everywhere | Add specific error constants per failure case |
| 3 | Root `errors.ts` and `types.ts` shims still exist | Move to `src/shared/`, delete shims |
| 4 | `CheckoutPage` 8-second hardcoded timeout | Replace with reactive subscription check |
| 5 | `BillingSettings` stale `selectedPlanId` from `useState` | Sync with `useEffect` or derive from data |
| 6 | `useSignOut` lives in `misc.ts` | Move to `src/shared/hooks/` or `src/features/auth/` |
| 7 | `ensureQueryData` in `_app.tsx` blocks unauthenticated pages | Move to `_auth.tsx` layout only |
| 8 | Excessive `v8 ignore` blocks (~20+) | Audit — test the branches instead |
| 9 | `convex/http.ts` excluded from coverage | Add tests with mocked ctx objects |
| 10 | Route `beforeLoad` tests use fragile `as any` mocking | Improve type safety |
| 11 | Hardcoded English strings despite i18n setup | Move to translation files |
| 12 | Test suppression via string matching in `test-setup.ts` | Fix root cause instead |
| 13 | `NavItem.i18nKey` defined but never used | Wire up or remove |
| 14 | `getLocaleCurrency` only supports USD/EUR | Expand or document limitation |
| 15 | Empty `hooks/.gitkeep` files in feature dirs | Remove clutter |

**When:** Phase 2 polish or Phase 3.

---

## Priority 5: Future Architecture (Deferred to Post-v2.0)

Two architecture proposals captured for future consideration. Both agree: **build 2-3 modules first, extract the platform second.**

### Event System

Modules communicate via events instead of direct coupling:
- `platform/events/` with constants like `task.created`, `project.completed`
- Modules emit events; subscribers (notifications, activity logs, analytics) consume them
- Decouples modules and enables extensibility

### Permission Framework

Declarative RBAC from model definition:
- 4-layer model: atomic permissions → scopes → roles → grants
- Declared in model config, enforced server-side
- Already designed in `_methodologies/superpowers/permission-framework.md`

### Platform/Modules Split

Separate platform infrastructure from domain modules:
- `platform/`: auth, organizations, permissions, activity, notifications, files, comments, events
- `modules/`: tasks, projects, CRM, tickets — self-contained vertical slices
- Modules interact via DB relations, platform services, and events (no cross-module imports)

**Decision:** These are valid directions but premature without real module experience. CalmDo v2.0 (tasks, projects, subtasks, work logs, activity) will reveal the right abstractions. Revisit after v2.0 ships.

See also: `docs/VISION.md` for the full long-term platform arc (Phases 7-14).

---

*Captured: 2026-03-10*
