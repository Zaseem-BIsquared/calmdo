# /feather:architect — Domain Modeling Conversation

## Trigger

When the user types `/feather:architect` or asks to "design a feature", "model my domain", "create entities from description", or "architect my schema".

## Overview

Guide the developer through a 4-phase conversation to produce validated `feather.yaml` files from a plain English domain description. The conversation discovers entities, defines schemas, overlays business behaviors, and validates everything with sample data and dry-run generation.

**Phases:**
- Phase 0: Entity Discovery (WHO/WHAT/WHERE/WHEN/HOW)
- Phase 1: Schema + CRUD (fields, types, relationships, YAML generation)
- Phase 2: Behavior Overlay (8 dimensions: access, hooks, status flow, etc.)
- Phase 3: Validation (Zod, sample data, dry-run generation)

## On Start

1. Check for existing conversations:
```bash
ls .feather/conversations/*.json 2>/dev/null
```

2. **If conversations exist:** Show a list with domain, current phase, and last updated. Offer:
   - "Resume {id} (Phase {N}: {label})?"
   - "Start new conversation"

3. **If starting new:** Ask for the domain name. Create conversation state:
```bash
npx tsx -e "
import { createConversation } from './lib/conversation/conversation-state';
import { saveConversation } from './lib/conversation/conversation-io';
const state = createConversation('{domain}');
saveConversation('.', state);
console.log(JSON.stringify({ id: state.id, phase: state.currentPhase }));
"
```

4. **If resuming:** Load checkpoint and display summary:
```bash
npx tsx -e "
import { loadConversation } from './lib/conversation/conversation-io';
import { summarizeState } from './lib/conversation/conversation-state';
const state = loadConversation('.', '{id}');
if (state) console.log(summarizeState(state));
"
```

## Phase 0: Entity Discovery

**Goal:** Discover all entities in the developer's domain using the WHO/WHAT/WHERE/WHEN/HOW framework.

**Opening prompt:**
> "Walk me through what your users do, step by step. Describe the core workflow of your application."

**For each step the developer mentions, probe:**
- **WHO** performs this action? (actors become entities or roles)
- **WHAT** information do they need or produce? (data becomes fields)
- **WHERE** does this happen? (locations may become entities or fields)
- **WHEN** does this happen? (time aspects become date fields, schedules)
- **HOW** does the process work? (workflows become status flows)

**Build entity list progressively.** After each entity is discovered:
1. Name it (kebab-case, e.g., `work-logs`)
2. Label it (human readable singular + plural, e.g., "Work Log" / "Work Logs")
3. List preliminary fields with types
4. Identify relationships to other discovered entities

**Completion check:**
When the developer says they're done describing their domain:
1. Display an entity summary table: name, field count, relationship count
2. Ask: "Does this capture your domain? Anything missing?"
3. If confirmed: save checkpoint, advance to Phase 1

**Save checkpoint and update preview after confirmation:**
```bash
npx tsx lib/conversation/preview-generator.ts {conversation-id}
```

## Phase 1: Schema + CRUD

**Goal:** Define complete schemas for each entity and generate valid `feather.yaml` files.

**For each entity from Phase 0:**
1. Review and refine fields -- add types, required flags, defaults, max lengths
2. Smart defaults from `templates/defaults.yaml` are applied automatically (Tableau Standard)
3. Define relationships formally (belongs_to/has_many with column names)
4. Set identity strategy (auto-increment by default)
5. Generate feather.yaml using `generateFeatherYaml()` from `lib/conversation/yaml-generator.ts`
6. Validate with: `npx tsx bin/feather.ts validate src/features/{name}/feather.yaml`
7. **If validation fails:** auto-fix the YAML, show a diff of changes, confirm with user

**After all entities defined:**
1. Show complete entity-relationship summary
2. Ask: "Ready to add behaviors and business rules?"
3. Save checkpoint, advance to Phase 2

**Update preview after phase completion:**
```bash
npx tsx lib/conversation/preview-generator.ts {conversation-id}
```

## Phase 2: Behavior Overlay (8 Dimensions)

**Goal:** Add business rules and behaviors to each entity via adaptive probing.

**For each entity, probe these dimensions in order:**

1. **Access Control** (always ask): "Who can see and modify {entity}?"
   - Produces: scope, permissions, sharing rules

2. **Side Effects** (always ask): "When a {entity} changes, what else should happen?"
   - Produces: hooks, cascades, notifications

3. **Status Flow** (if entity has enum fields): "Does {entity} have a lifecycle?"
   - Produces: transitions, guards

4. **Schedules** (if time-dependent indicators): "Any time-based automation for {entity}?"
   - Produces: cron rules, deadlines

5. **Cascades** (always probe -- users won't volunteer): "If you delete a {parent}, what happens to its {children}?"
   - Produces: cascade rules in hooks

6. **Derived Data**: "Any calculated fields? Counts, sums, averages from related data?"
   - Produces: derivedData section

7. **Custom Views**: "How should {entity} be displayed? List? Cards? Kanban?"
   - Produces: views section

8. **Integrations** (if business indicates external systems): "Any external systems involved?"
   - Produces: integrations section

**After each entity's overlay:**
- Update the feather.yaml with new sections
- Re-validate
- Show what was added

**Save checkpoint after all entities overlaid, advance to Phase 3.**

**Update preview:**
```bash
npx tsx lib/conversation/preview-generator.ts {conversation-id}
```

## Phase 3: Validation

**Goal:** Three-layer validation to ensure the domain model is correct and generator-compatible.

**Layer 1 -- Zod schema validation:**
```bash
npx tsx bin/feather.ts validate src/features/
```
Show results. Auto-fix any failures, show diff, confirm.

**Layer 2 -- Sample data test:**
Generate 2-3 example rows per entity and display as markdown tables. Ask:
> "Does this data look right? Does it capture what your {entity} should hold?"

**Layer 3 -- Dry-run generation:**
```bash
npx tsx bin/feather.ts generate {entity} --dry-run
```
Show files that would be generated. Report any generation errors.

**Reports question:**
> "What reports or aggregations do you need? This validates your data model captures the right relationships."

**After validation passes:**
1. Display final summary: entities, fields, relationships, behaviors
2. Save final checkpoint
3. Show next steps: `feather generate {entity}` for each entity

**Update preview (final):**
```bash
npx tsx lib/conversation/preview-generator.ts {conversation-id}
```

## Phase Navigation

At any point, the user can say "go back to Phase {N}" or "add another entity".

**Protocol:**
1. Save current state
2. Ask: "Clear downstream data or keep it?" (explain what will be cleared)
3. Set currentPhase backward
4. If clearing: show what was cleared, confirm
5. If not clearing: preserve downstream data, reopen phase for additions

## Cascade Detection

When revisiting Phase 0 (adding/modifying entities):
- Detect what changed (new entity, modified fields, removed entity)
- For each change, infer downstream impacts:
  - **New entity:** suggest relationships to existing entities
  - **Modified fields:** update YAML, re-validate
  - **Removed entity:** warn about broken relationships, remove from YAML map
- Show proposed cascades, confirm before applying

## Preview Dashboard

After each phase, the preview dashboard at `.feather/preview/index.html` updates with:
- ER diagram showing entity relationships (Phase 0+)
- Syntax-highlighted YAML for each entity (Phase 1+)
- Behavior overlay details (Phase 2+)
- Sample data tables and validation status (Phase 3)

The browser auto-refreshes every 5 seconds. On first phase completion, the browser opens automatically. On subsequent phases, changes are picked up by auto-refresh.

**On-demand refresh:** If the user asks to "refresh preview" or "show dashboard":
```bash
npx tsx lib/conversation/preview-generator.ts {conversation-id}
```

## Error Handling

**YAML validation fails:** Show the error with the specific field/line. Auto-fix the YAML, display a diff of changes, confirm with the user.

**Dry-run generation fails:** Explain the error. Suggest specific manual fixes, or offer to skip the failing entity and continue with others.

**Checkpoint file corrupt:** Offer two options: "Start fresh" or "Recover from last known good state". If starting fresh, archive the corrupt file.

**No entities discovered:** Encourage with example prompts:
> "Try describing what happens from a user's perspective. For example: 'A customer places an order for products, and a warehouse worker picks and ships it.'"

## Edge Cases

- **Single entity:** Skip ER diagram (no relationships to show). Proceed normally.
- **Entity with no fields:** Warn: "An entity needs at least one field. What information does a {entity} hold? At minimum, a name or title."
- **Skip a phase:** Save checkpoint at current phase, jump ahead. Warn about potentially incomplete output.
- **Export without all phases:** Generate partial YAML, show clear warning about missing dimensions.

## Help Command

If the user types `/feather:architect help`:
- Show available commands: `new`, `resume`, `status`, `preview`, `export`, `help`
- Show current conversation status (if active)
- Phase timeline: Phase 0 (5-10 min), Phase 1 (5-15 min), Phase 2 (10-20 min), Phase 3 (5 min)

## Export Command

If the user types `/feather:architect export`:
- Show location of generated YAML files (`src/features/{name}/feather.yaml`)
- Show preview dashboard location (`.feather/preview/index.html`)
- Next steps:
```bash
npx tsx bin/feather.ts generate {entity-name}   # Generate code for one entity
npx tsx bin/feather.ts generate --all            # Generate all at once
```

## Getting Started Examples

**E-commerce:** "Customers browse products, add them to a cart, place orders. The warehouse receives order items and ships them."

**HR System:** "Employees belong to departments. They submit leave requests which managers approve or deny. Payroll runs monthly."

**Project Management:** "Teams create projects with tasks. Tasks have subtasks, time tracking, and activity logs. Tasks move through todo/in-progress/done."
