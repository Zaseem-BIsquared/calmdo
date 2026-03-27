# Phase 5: Subtasks & Work Logs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 05-subtasks-work-logs
**Areas discussed:** Task detail surface, Subtask presentation, Work log entry & display, Subtask promotion flow

---

## Task Detail Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Side panel / drawer | Click task → panel slides from right, list stays visible, URL updates | ✓ |
| Dedicated page | Full page at /dashboard/tasks/:id, back button to list | |
| Inline expansion | Accordion within list, no URL change | |

**User's choice:** Side panel / drawer (Linear-style)
**Notes:** Panel width and close behavior deferred to Claude's discretion

### Follow-up: Panel Width & Close

| Option | Description | Selected |
|--------|-------------|----------|
| ~40% width, click-outside closes | Like Linear's side peek | |
| ~50% width, explicit close only | More room, dimmed background | |
| You decide | Claude picks based on content needs | ✓ |

**User's choice:** Claude decides

---

## Subtask Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Checklist | Checkbox + title, compact, familiar (Linear/Notion) | ✓ |
| Mini cards | Small cards with title, assignee avatar, done state | |
| You decide | Claude picks | |

**User's choice:** Checklist style
**Notes:** Shows "3/5 done" count, drag-reorder, inline add

### Follow-up: Adding Subtasks

| Option | Description | Selected |
|--------|-------------|----------|
| Inline text input | Empty field at bottom, type + Enter | ✓ |
| "+ Add" button opens inline row | Button → row with title + assignee picker | |

**User's choice:** Inline text input (simplest)

---

## Work Log Entry & Display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline form below subtasks | Always visible, text area + time input | ✓ |
| Modal/dialog | Click "Log Work" → modal | |
| You decide | Claude picks | |

**User's choice:** Inline form

### Follow-up: Time Input Format

| Option | Description | Selected |
|--------|-------------|----------|
| Minutes only | Number input, display converts 90min → "1h 30m" | |
| Smart text parsing | Accept "30m", "1h30m", "1.5h" — parse to minutes | ✓ |
| You decide | Claude picks simplest | |

**User's choice:** Smart text parsing

---

## Subtask Promotion Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Create task + mark promoted | Subtask stays with ⇗ icon and link to new task | ✓ |
| Create task + remove subtask | Subtask disappears, cleaner list | |
| You decide | Claude picks per kiro spec | |

**User's choice:** Create task + mark promoted (keeps audit trail)

---

## Claude's Discretion

- Panel width and close behavior
- Edit/delete UI for work log entries
- Subtask assignee picker implementation
- Work log entry ordering

## Deferred Ideas

None
