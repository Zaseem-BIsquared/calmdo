import type { EntityDraft } from "./conversation-state";

// ── Convert entity name to UPPER_CASE for Mermaid ──────────────────────────

function toMermaidName(name: string): string {
  return name.replace(/-/g, "_").toUpperCase();
}

// ── Map field type to Mermaid-compatible type label ────────────────────────

function toMermaidType(type: string): string {
  switch (type) {
    case "text":
      return "text";
    case "number":
      return "int";
    case "boolean":
      return "bool";
    case "enum":
      return "enum";
    case "date":
      return "date";
    case "reference":
      return "ref";
    case "email":
      return "string";
    case "url":
      return "string";
    case "currency":
      return "decimal";
    case "percentage":
      return "int";
    default:
      return type;
  }
}

// ── Generate Mermaid erDiagram from entities ───────────────────────────────

export function generateErDiagram(entities: EntityDraft[]): string {
  const lines: string[] = ["erDiagram"];

  // Build a set of all entity names for relationship validation
  const entityNames = new Set(entities.map((e) => e.name));

  // Relationships
  for (const entity of entities) {
    for (const rel of entity.relationships) {
      if (!entityNames.has(rel.target)) continue;

      const parent = toMermaidName(rel.target);
      const child = toMermaidName(entity.name);
      const notation = rel.required ? "||--||" : "||--o{";
      const label = rel.type === "belongs_to" ? "has" : "contains";
      lines.push(`    ${parent} ${notation} ${child} : ${label}`);
    }
  }

  // Entity blocks with fields
  for (const entity of entities) {
    const mermaidName = toMermaidName(entity.name);
    lines.push("");
    lines.push(`    ${mermaidName} {`);
    for (const [fieldName, fieldDef] of Object.entries(entity.fields)) {
      lines.push(`        ${toMermaidType(fieldDef.type)} ${fieldName}`);
    }
    lines.push("    }");
  }

  return lines.join("\n");
}

// ── Generate entity summary string ─────────────────────────────────────────

export function generateEntitySummary(entities: EntityDraft[]): string {
  const entityCount = entities.length;
  let fieldCount = 0;
  let relationshipCount = 0;

  for (const entity of entities) {
    fieldCount += Object.keys(entity.fields).length;
    relationshipCount += entity.relationships.length;
  }

  const entityWord = entityCount === 1 ? "entity" : "entities";
  const fieldWord = fieldCount === 1 ? "field" : "fields";
  const relWord = relationshipCount === 1 ? "relationship" : "relationships";

  return `${entityCount} ${entityWord}, ${fieldCount} ${fieldWord}, ${relationshipCount} ${relWord}`;
}
