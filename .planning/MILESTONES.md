# Milestones

## v1.0 Architecture Modernization (Shipped: 2026-03-09)

**Phases completed:** 1 phase, 9 plans | 65 commits | 181 files changed | +17,820 / -5,335 lines

**Key accomplishments:**
- Restructured Convex backend into domain folders (users/, billing/, uploads/, onboarding/) with all api.* paths updated
- Extracted frontend into 6 feature folders with thin route wrappers under 20 lines each
- Built git-based plugin system with install script, 3 plugin branches (CI, command palette, admin panel), and multi-plugin merge
- Created 4 Plop.js CLI generators (feature, route, convex-function, form) with wired-up templates
- Shared Zod schemas validate on both client and server via zodToConvex + zCustomMutation
- Comprehensive docs: PROVIDERS.md, Mermaid architecture diagram, 6 per-feature READMEs

---

