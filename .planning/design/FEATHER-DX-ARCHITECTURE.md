# Feather DX Architecture — Design Document

**Started:** 2026-03-28
**Status:** Research complete, decisions pending
**Context:** Designing the developer experience for Feather as a framework (v3.0+)

## 1. The Vision

Feather evolves from a starter kit (clone and customize) to a framework with:
- `feather start project` CLI for one-command setup
- LLM-driven feature creation (YAML spec + behavioral spec)
- Generated/custom code split (updates don't break customizations)
- Telemetry to collect what users build and surface errors
- Plugin/bundle/feature composability (WordPress-like flexibility)

## 2. Architecture Decision: Option C — Declarative Config + Generated/Custom Split

**Decided:** 2026-03-28

```
my-project/
  feather.yaml              # declares features, config, branding
  specs/                    # behavioral specs (LLM input)
  src/generated/            # auto-generated from feather.yaml (regeneratable)
  src/custom/               # user's custom code (never touched by generator)
  convex/generated/         # auto-generated backend
  convex/custom/            # user's custom backend code
```

**Key principle:** Generated code is always replaceable. Custom code is always safe.

**Upstream updates:** `feather update` regenerates `generated/` from latest templates. `custom/` untouched.

### Alternatives considered:
- **Option A (WordPress model):** Core as npm package + features in separate tree. Too much framework investment.
- **Option B (shadcn/ui model):** Copy features, own the code. No update path.

## 3. Feature/Bundle/Custom Layering

**Decided:** 2026-03-28

| Concept | Definition | Example |
|---------|-----------|---------|
| **Feature** | Atomic unit: one entity with schema, backend, frontend, tests | tasks, projects, subtasks |
| **Bundle** | Curated set of features that work together + wiring | "project-management" = tasks + projects + subtasks + work-logs + activity-logs |
| **Custom code** | User-written code in `custom/` that extends generated features | Priority scoring, kanban view, custom business rules |

```yaml
# feather.yaml
features:
  tasks:
    schema: tasks.yaml
    spec: specs/tasks.md

bundles:
  - feather/project-management
  - feather/auth

custom:
  tasks:
    - src/custom/tasks/priority-scoring.ts
```

## 4. The "Beyond CRUD" Framework — Dimensions of Feature Complexity

### 4.1 Research Sources

| Source | Key Contribution |
|--------|-----------------|
| User's Gemini notes (Aug 2025) | WHO/WHAT/WHERE/WHEN/HOW entity discovery; spreadsheet-as-spec; sample data validation |
| Sonnet critique | Merge Guards+Boundaries; add Schedules+Integrations; 3-tier generatability |
| Opus critique | Stress-tested against 5 complex systems (Stripe, GitHub, Slack, Notion, Calendar); generatability % per dimension |
| Analytics research | Per-entity (Computed Values) vs cross-entity (Aggregations) is an architectural boundary |
| Frappe Framework deep dive | DocType universal declaration; Submit/Cancel/Amend lifecycle; `fetch_from` pattern; 3-layer permissions; naming/identity |
| Glide Apps deep dive | Computed columns as composable pipeline; "Golden Triangle" (Data+Layout+Actions); Row Owners; convention-driven UI |

### 4.2 The Framework (v2 — post-research)

Every feature has **Schema + CRUD** as the baseline (fields, types, validation, create/read/update/delete, list/detail/form views). Everything beyond that falls into 8 dimensions:

| # | Dimension | Question | Gen % | Sub-concerns |
|---|-----------|----------|-------|--------------|
| 1 | **Access Control** | Who can see/do this? | 75% | Data-level (which rows), feature-level (which actions), field-level (which columns) |
| 2 | **Status Flow** | What states and transitions? | 70% | State machines, transition guards, Submit/Cancel/Amend for immutable docs |
| 3 | **Side Effects** | When X happens, what else? | 40% | Data-change triggers, lifecycle cascades, notifications. Trigger types: user action, data change, webhook |
| 4 | **Derived Data** | What values are calculated? | 50% | Per-entity computed fields, cross-entity aggregations, time-series rollups. Composable pipeline (Relation -> Lookup -> Math -> Rollup) |
| 5 | **Custom Views** | Non-standard presentations? | 30% | Convention-driven: field type -> component type -> layout preset. Kanban, calendar, timeline, dashboard |
| 6 | **Schedules** | What happens based on time? | 75% | Cron jobs, delayed actions, deadline enforcement, expiry, recurring processes |
| 7 | **Integrations** | External system interactions? | 20% | Inbound (webhooks, API sources) + outbound (API calls, email, SMS) |
| 8 | **Identity & Naming** | How are records identified? | 85% | Auto-increment, UUID, expression-based series, human-readable codes (INV-2026-001) |

**Generatability spectrum (3 tiers):**

| Tier | What | Example |
|------|------|---------|
| Auto-generated | Pure CRUD from schema | Schema, mutations, queries, list/detail/form views, routes, tests |
| Declarable | Common patterns expressed in YAML | State machines, cascade rules, role-based access, schedule expressions, naming formats, simple aggregations |
| Fully custom | Domain-specific logic in `custom/` | Complex business rules, custom views, integration handlers, scoring algorithms |

### 4.3 Conversation Model vs Spec Model

**For the LLM architect conversation** (talking to users), use Glide's "Golden Triangle":

```
DATA    — What information exists? (entities, fields, relations, derived data, access)
LAYOUT  — How should it look? (views, components, presets, visibility)
ACTIONS — What should happen? (side effects, workflows, schedules, integrations)
```

**For the generated spec** (consumed by generator/developer), decompose into 8 dimensions.

### 4.4 The LLM Architect Conversation Flow

```
PHASE 0: Entity Discovery (user's WHO/WHAT/WHERE/WHEN/HOW framework)
  "Walk me through what your users do, step by step."
  For each step: Who does it? What info do they need/produce?
  -> produces: entity list + relationships
  -> validated with: sample data rows (2-3 per table)

PHASE 1: Schema + CRUD (generator baseline)
  Fields, types, validation rules, naming/identity
  -> produces: YAML for generator
  -> validated with: generated prototype

PHASE 2: Behavior Overlay (8 dimensions, adaptive probing)
  Always ask: Access Control, Side Effects
  Conditional: Status Flow (if entity has lifecycle), Schedules (if time-dependent)
  Always probe: Cascades (users won't volunteer this)
  Then explore: Derived Data, Custom Views, Integrations
  -> produces: behavioral spec

PHASE 3: Validation
  "What reports do you need?" — proves data model captures the right data
  Pivot table / aggregation test on sample data
  -> produces: confidence in model completeness
```

### 4.5 Comparison with User's Original Framework (Aug 2025)

| User's Original (Gemini Notes) | Maps To | Notes |
|-------------------------------|---------|-------|
| Permissions (role x table x CRUD) | Access Control | Direct match; user's matrix format is more concrete |
| Input Validation | Schema baseline | Field-level constraints (format, range, uniqueness) |
| Business Rules | Access Control + Side Effects | Straddles: some are constraints, some trigger actions |
| Workflows | Status Flow + Side Effects + Schedules | User treated as unified; we decompose for implementation |
| Reports | Derived Data (Aggregations) | User's "Reports" = our cross-entity aggregations |
| WHO/WHAT/WHERE/WHEN/HOW | Phase 0 (entity discovery) | Unique contribution — systematic entity identification |
| Sample data validation | Phase 3 (validation) | Unique contribution — low-tech model verification |
| Spreadsheet-as-spec | feather.yaml | The YAML IS the requirements document |

**What user had that we adopted:** Entity discovery methodology, sample data validation, spreadsheet-as-spec concept, permissions matrix.

**What we added beyond user's original:** Schedules, Custom Views, Integrations, Identity & Naming, composable derived data pipeline, 3-tier generatability.

## 5. Patterns to Steal

### From Frappe Framework

| Pattern | What It Does | Feather Application |
|---------|-------------|-------------------|
| Universal DocType declaration | One definition generates schema + form + list + API + permissions + audit | Our YAML should aspire to this: one feature definition generates everything |
| Graduated complexity | No-code -> low-code -> pro-code for every capability | 3-tier: auto-generated / declarable / custom |
| Submit/Cancel/Amend | Immutable document lifecycle for financial records | Declare as `lifecycle: submittable` in YAML |
| `fetch_from` | Auto-populate field from linked record | Declare in YAML: `fetch_from: project.status` |
| Three-layer permissions | Role (actions) + permlevel (fields) + user permissions (rows) | Our Access Control 3-layer model |
| hooks.py doc_events | Declarative event handlers per lifecycle stage | Our Side Effects trigger system |
| Frappe Apps | Installable modules that extend core DocTypes | Our Bundle concept |

### From Glide Apps

| Pattern | What It Does | Feather Application |
|---------|-------------|-------------------|
| Computed columns pipeline | 18 composable column types as a declarative query language | Derived Data as composable YAML declarations, not scattered query code |
| Row Owners | Security as a data property (email in column = access) | Simple ownership model in YAML: `owner_field: creatorId` |
| Golden Triangle | Data + Layout + Actions as 3 meta-dimensions | Conversation model for LLM architect |
| Convention-driven UI | Column type -> component type -> layout preset | Generator uses field types to pick form inputs, list columns, view options |
| Visibility conditions | Show/hide any component based on data | Generate conditional rendering from Access Control declarations |
| Escape hatch | Explicit ceiling with way out | Every generated line is editable — no ceiling |

## 6. Open Questions

1. **YAML schema format** — What does `feather.yaml` actually look like? Need to design the full schema.
2. **Generator implementation** — Extend existing Plop.js generators or build a new generation pipeline?
3. **Telemetry** — How to collect what users build (custom/ directory patterns) and surface errors without requiring accounts?
4. **Bundle distribution** — Registry? npm packages? Git-based? How do users discover and install bundles?
5. **Safe upstream updates** — Regeneration strategy: how to handle conflicts when user has modified generated code?
6. **PR #8 integration** — Zaseem's setup script is the v1 of `feather start project`. How does it evolve?

## 7. Relationship to PR #8

Zaseem's PR (#8) implements the first step:
- `scripts/create.sh` — one-command project creation
- `scripts/setup.ts` — interactive branding setup
- `convex/config.ts` — centralized backend config

This is the v1 "project creation" experience. The DX architecture described here is v3.0+ evolution:
- PR #8 `create.sh` -> evolves into `feather start project`
- PR #8 `setup.ts` -> evolves into LLM architect conversation
- PR #8 branding config -> evolves into `feather.yaml`

## 8. Research Artifacts

Full research outputs available (not committed — too large):
- `~/Desktop/gemini-conv-1.md` — User's Gemini conversation: Agile Requirements and Rapid Development
- `~/Desktop/gemini-conv-2.md` — User's Gemini conversation: User-Centric Software Requirements Framework
- `docs/FRAPPE-RESEARCH.md` — Frappe Framework deep dive (1,146 lines)
- Sonnet critique, Opus critique, Analytics research, Glide research — in agent output files

---

*Design document created: 2026-03-28*
*Last updated: 2026-03-28*
