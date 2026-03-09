---
phase: 01-architecture-modernization
plan: 06
subsystem: plugins, infra, ui
tags: [git-branch-plugins, github-actions, cmdk, command-palette, admin-panel, shell-script]

# Dependency graph
requires:
  - phase: 01-architecture-modernization/01-05
    provides: "Data-driven navItems array, namespace i18n, feature-grouped ERRORS constant"
provides:
  - "Plugin management shell script (scripts/plugin.sh) with list/preview/install"
  - "GitHub Actions CI workflows on plugin/infra-ci-github-actions branch"
  - "Command palette plugin (plugin/ui-command-palette) with cmdk + i18n"
  - "Admin panel plugin (plugin/feature-admin-panel) with full CRUD + schema + nav + route"
  - "Multi-plugin merge compatibility tested"
affects: [01-07, README, documentation]

# Tech tracking
tech-stack:
  added: [cmdk]
  patterns: [git-branch-plugin-system, plugin-ci-pipeline, admin-route-guard]

key-files:
  created:
    - scripts/plugin.sh
    - .github/workflows/rebase-plugins.yml (on plugin/infra-ci-github-actions)
    - .github/workflows/plugin-ci.yml (on plugin/infra-ci-github-actions)
    - src/features/command-palette/components/CommandPalette.tsx (on plugin/ui-command-palette)
    - src/features/command-palette/index.ts (on plugin/ui-command-palette)
    - convex/admin/queries.ts (on plugin/feature-admin-panel)
    - convex/admin/mutations.ts (on plugin/feature-admin-panel)
    - src/features/admin/components/AdminPage.tsx (on plugin/feature-admin-panel)
    - src/features/admin/components/UserDetail.tsx (on plugin/feature-admin-panel)
    - src/features/admin/index.ts (on plugin/feature-admin-panel)
    - src/routes/_app/_auth/dashboard/_layout.admin.tsx (on plugin/feature-admin-panel)
  modified:
    - convex/schema.ts (on plugin/feature-admin-panel - added role + disabled fields)
    - src/shared/nav.ts (on plugin/feature-admin-panel - added admin nav item)
    - src/shared/errors.ts (on plugin/feature-admin-panel - added admin error group)
    - src/i18n.ts (on each plugin branch - added respective namespace)

key-decisions:
  - "Infra-ci branch cannot push to remote due to OAuth token lacking workflow scope -- local only"
  - "Multi-plugin merge has one conflict in i18n.ts ns array (trivial one-line resolve)"
  - "Admin plugin adds role field as v.optional(roleValidator) for backward compat with existing users"

patterns-established:
  - "Plugin branches fork from main, modify only their own feature files + append to shared extension points"
  - "i18n ns array is the main conflict point when merging multiple plugins"
  - "Admin route guard checks currentUser.role in route component (not beforeLoad)"

requirements-completed: [PLUG-04, PLUG-05, PLUG-06, PLUG-07, PLUG-08, PLUG-09, PLUG-10]

# Metrics
duration: 8min
completed: 2026-03-09
---

# Phase 1 Plan 6: Plugin System Summary

**Git-branch plugin system with management script, CI workflows, and three demo plugins (infra-ci, command-palette, admin-panel) proven mergeable**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-09T09:42:51Z
- **Completed:** 2026-03-09T09:50:41Z
- **Tasks:** 4
- **Files modified:** 27 (across main + 3 plugin branches)

## Accomplishments
- Plugin management script (scripts/plugin.sh) with list/preview/install commands on main
- GitHub Actions workflows for auto-rebase and CI on plugin/infra-ci-github-actions branch
- Command palette plugin with cmdk, Cmd+K shortcut, keyboard navigation, i18n (en/es)
- Admin panel plugin with full CRUD: user table, detail view, role toggle, enable/disable, Convex queries/mutations, admin route guard, schema additions, nav item, error constants, i18n
- Multi-plugin merge test: command-palette + admin-panel merge with one trivial i18n conflict, typecheck passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create plugin shell script on main** - `dbc7880` (feat)
2. **Task 2: Create plugin/infra-ci-github-actions branch** - `ff00f3a` (feat, on plugin branch)
3. **Task 3: Create plugin/ui-command-palette branch** - `756d89b` (feat, on plugin branch)
4. **Task 4: Create plugin/feature-admin-panel branch** - `08a08e3` (feat, on plugin branch)

## Files Created/Modified

**On main:**
- `scripts/plugin.sh` - Plugin management script (list/preview/install)

**On plugin/infra-ci-github-actions:**
- `.github/workflows/rebase-plugins.yml` - Auto-rebase on main push
- `.github/workflows/plugin-ci.yml` - Typecheck/lint/test on plugin branches

**On plugin/ui-command-palette:**
- `src/features/command-palette/components/CommandPalette.tsx` - cmdk-based command palette
- `src/features/command-palette/index.ts` - Barrel export
- `public/locales/{en,es}/command-palette.json` - i18n namespaces
- `src/i18n.ts` - Added "command-palette" namespace
- `src/routes/_app/_auth/dashboard/_layout.tsx` - Wired CommandPalette component

**On plugin/feature-admin-panel:**
- `convex/admin/queries.ts` - listUsers, getUserDetail with admin guard
- `convex/admin/mutations.ts` - updateUserRole, toggleUserDisabled with admin guard
- `convex/schema.ts` - Added ROLES constant, role + disabled fields to users table
- `src/features/admin/components/AdminPage.tsx` - User management table with role/status badges
- `src/features/admin/components/UserDetail.tsx` - Detail view with role toggle, enable/disable
- `src/features/admin/index.ts` - Barrel export
- `src/routes/_app/_auth/dashboard/_layout.admin.tsx` - Route with admin guard + search params for userId
- `src/shared/nav.ts` - Appended admin nav item
- `src/shared/errors.ts` - Added admin error group (UNAUTHORIZED, USER_NOT_FOUND, CANNOT_MODIFY_SELF)
- `src/i18n.ts` - Added "admin" namespace
- `public/locales/{en,es}/admin.json` - i18n namespaces

## Decisions Made
- **Infra-ci branch local only:** The OAuth token used by Claude Code lacks `workflow` scope required to push `.github/workflows/` files. The branch exists locally and can be pushed manually by the user.
- **Admin role as optional field:** Added `role: v.optional(roleValidator)` to users schema so existing users don't break. Defaults to "user" in queries.
- **i18n ns array conflict:** When two plugins both append to the ns array, a merge conflict occurs. This is trivial to resolve (combine both additions) but worth noting for documentation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- **GitHub push rejected for workflow files:** The OAuth App token lacks `workflow` scope, so `plugin/infra-ci-github-actions` branch cannot be pushed to remote. The branch exists locally with both CI workflow files. The other two plugin branches pushed successfully.

## Compatibility Matrix

| Plugin A | Plugin B | Conflicts | Resolution |
|----------|----------|-----------|------------|
| command-palette | admin-panel | 1 (src/i18n.ts ns array) | Combine both namespace additions into single array |
| command-palette | infra-ci | 0 | No overlapping files |
| admin-panel | infra-ci | 0 | No overlapping files |

## User Setup Required
- **GitHub token with workflow scope:** To push `plugin/infra-ci-github-actions` branch, the user needs to push it manually or configure a token with `workflow` scope.

## Next Phase Readiness
- All three plugin branches exist and demonstrate full integration
- Plugin system ready for documentation in Plan 01-07
- Compatibility matrix documented for README

---
*Phase: 01-architecture-modernization*
*Completed: 2026-03-09*
