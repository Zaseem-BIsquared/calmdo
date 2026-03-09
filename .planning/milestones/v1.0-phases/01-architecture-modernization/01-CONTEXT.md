# Phase 1: Architecture Modernization - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure the codebase into feature-folder architecture (frontend + backend), add shared Zod validation, build a git-branch plugin system with 3 demo plugins, create 4 CLI generators using Plop.js, and document everything. All existing functionality must continue working (typecheck + tests pass).

</domain>

<decisions>
## Implementation Decisions

### Feature domain boundaries
- 6 feature domains: auth, onboarding, billing, dashboard, uploads, settings
- Onboarding is its own domain (NOT part of auth) — both frontend (`src/features/onboarding/`) and backend (`convex/onboarding/`)
- Settings is its own domain — has enough UI (general + billing tabs) to justify separation
- Frontend features live in `src/features/{domain}/` with components, hooks, barrel exports
- Backend features live in `convex/{domain}/` with queries, mutations, actions in separate files
- Dashboard shell (nav + header layout) placement is Claude's discretion

### Plugin branch fidelity
- All 3 plugins demonstrate full integration: i18n namespace files, nav item entries, and route files
- `plugin/feature-admin-panel`: Full CRUD for users (list, view details, edit roles, disable accounts) with its own Convex functions, schema table, nav item, and route guard
- `plugin/infra-ci-github-actions`: Both workflows — auto-rebase on main push (PLUG-05) AND CI checks on plugin branches (PLUG-06)
- `plugin/ui-command-palette`: Fidelity level is Claude's discretion

### Generator output style
- Tooling: Plop.js with Handlebars templates
- Invocation: Interactive prompts (user-friendly, discoverable)
- Scaffold output: Wired-up templates with imports, sample components/hooks/queries, and test files — not minimal stubs
- `gen:route` prompts for authentication requirement and places file under `_auth/` or `_app/` accordingly
- `gen:feature` creates both `src/features/{name}/` and matching `convex/{name}/` with barrel exports, sample component, sample hook, sample query, and test file

### Documentation depth
- Main README: Comprehensive — an LLM agent should be able to get a complete picture of how to use the starter kit with all its features
- Architecture diagram: Mermaid format (renders on GitHub, parseable by LLMs)
- Per-feature READMEs: Strict template with consistent sections (Purpose, Backend counterpart, Key files, Dependencies, Extension points)
- PROVIDERS.md: Includes swap guides for each vendor (what to change and where if replacing Resend, Stripe, GitHub OAuth, etc.)

### Claude's Discretion
- Dashboard shell placement (feature folder vs shared layout component)
- Command palette plugin polish level
- Exact Plop.js template contents beyond the wired-up pattern
- Loading skeleton design, spacing, typography in plugin UI

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/`: Radix UI wrappers (Button, Input, Select, Switch, DropdownMenu) with CVA variants — plugins should use these
- `src/utils/misc.ts`: `cn()` utility for Tailwind class merging
- `src/utils/validators.ts`: Existing Zod username validator — will move to `src/shared/schemas/`
- `src/test-helpers.tsx`: `renderWithRouter()` — reusable for feature tests
- `convex/email/`: Email infrastructure (sendEmail helper + React Email templates) — already domain-organized

### Established Patterns
- TanStack Router file-based routing with `_layout.tsx` convention
- Route-scoped UI uses `-ui.` prefix (TanStack Router ignores these files)
- Convex function naming: `PREAUTH_` and `UNAUTH_` prefixes for internal functions
- Data fetching: `useQuery(convexQuery(...))` pattern, never raw useEffect
- Mutations: `useMutation({ mutationFn: useConvexMutation(...) })` pattern
- Path aliases: `@/` (src), `@cvx/` (convex), `~/` (root)

### Integration Points
- `convex/schema.ts`: Central schema — admin panel plugin adds its table here
- `convex/app.ts`: Must be split into domain folders — all `api.app.*` imports must update
- `src/routes/`: Route files become thin wrappers importing from `src/features/`
- `public/locales/{lang}/translation.json`: Must be split into namespaces for plugin i18n
- `errors.ts`: Must be restructured into feature-grouped sections
- `src/i18n.ts`: Must be updated for namespace-based loading

</code_context>

<specifics>
## Specific Ideas

- README should be optimized for LLM agent consumption — structured, explicit about conventions and patterns, comprehensive enough that an AI agent can understand and use the starter kit without additional context
- Per-feature READMEs use a strict template so they're machine-parseable
- Admin panel plugin should be a convincing demo — full CRUD, not a toy

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-architecture-modernization*
*Context gathered: 2026-03-09*
