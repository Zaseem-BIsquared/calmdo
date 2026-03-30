import type { EntityDraft } from "./conversation-state";

// ── Deterministic pseudo-random number generator (seeded) ──────────────────

function createSeededRng(seed: number): () => number {
  let state = seed;
  return (): number => {
    // Mulberry32 PRNG
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash;
}

// ── Sample value generators by field type ──────────────────────────────────

function generateStringValue(
  entityLabel: string,
  fieldName: string,
  index: number,
): string {
  const suffixes = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
  const suffix = suffixes[index % suffixes.length];
  return `${entityLabel} ${fieldName} ${suffix}`;
}

function generateTextValue(entityLabel: string, index: number): string {
  const templates = [
    `This is a detailed description for ${entityLabel} item ${index + 1}. It contains relevant information about the record.`,
    `${entityLabel} record ${index + 1} captures important data. This description provides context for the entry.`,
    `Documentation for ${entityLabel} entry ${index + 1}. Contains notes and relevant details for reference.`,
  ];
  return templates[index % templates.length];
}

function generateNumberValue(
  rng: () => number,
  min?: number,
  max?: number,
): number {
  const lo = min ?? 0;
  const hi = max ?? 100;
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

function generateDateValue(rng: () => number): string {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const offset = Math.floor(rng() * thirtyDaysMs);
  return new Date(now - offset).toISOString().split("T")[0];
}

function generateCurrencyValue(rng: () => number): number {
  return Math.round((rng() * 9990 + 10) * 100) / 100;
}

function generatePercentageValue(rng: () => number): number {
  return Math.round(rng() * 100);
}

// ── Main: generate sample rows for an entity ───────────────────────────────

export function generateSampleRows(
  entity: EntityDraft,
  count: number = 3,
): Record<string, unknown>[] {
  const seed = hashString(entity.name);
  const rng = createSeededRng(seed);
  const rows: Record<string, unknown>[] = [];

  for (let i = 0; i < count; i++) {
    const row: Record<string, unknown> = {};

    for (const [fieldName, fieldDef] of Object.entries(entity.fields)) {
      switch (fieldDef.type) {
        case "string":
          row[fieldName] = generateStringValue(entity.label, fieldName, i);
          break;
        case "text":
          row[fieldName] = generateTextValue(entity.label, i);
          break;
        case "number":
          row[fieldName] = generateNumberValue(rng, fieldDef.min, fieldDef.max);
          break;
        case "boolean":
          row[fieldName] = i % 2 === 0;
          break;
        case "enum":
          if (fieldDef.values && fieldDef.values.length > 0) {
            row[fieldName] = fieldDef.values[i % fieldDef.values.length];
          } else {
            row[fieldName] = `value_${i + 1}`;
          }
          break;
        case "date":
          row[fieldName] = generateDateValue(rng);
          break;
        case "reference":
          row[fieldName] = `ref_${String(i + 1).padStart(3, "0")}`;
          break;
        case "email":
          row[fieldName] = `user${i + 1}@example.com`;
          break;
        case "url":
          row[fieldName] = `https://example.com/${entity.name}/${i + 1}`;
          break;
        case "currency":
          row[fieldName] = generateCurrencyValue(rng);
          break;
        case "percentage":
          row[fieldName] = generatePercentageValue(rng);
          break;
        default:
          row[fieldName] = `sample_${i + 1}`;
      }
    }

    rows.push(row);
  }

  return rows;
}

// ── Generate sample data for all entities ──────────────────────────────────

export function generateSampleDataForAll(
  entities: EntityDraft[],
): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {};
  for (const entity of entities) {
    result[entity.name] = generateSampleRows(entity);
  }
  return result;
}

// ── Format sample data as a markdown table ─────────────────────────────────

function truncate(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return value.slice(0, maxLen - 3) + "...";
}

export function formatSampleTable(
  entityName: string,
  rows: Record<string, unknown>[],
): string {
  if (rows.length === 0) return `### ${entityName}\n\nNo sample data.\n`;

  const columns = Object.keys(rows[0]);
  const MAX_VALUE_LEN = 30;

  // Header
  const header = `| ${columns.join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;

  // Rows
  const dataRows = rows.map((row) => {
    const cells = columns.map((col) => {
      const val = row[col];
      const str = val === null || val === undefined ? "" : String(val);
      return truncate(str, MAX_VALUE_LEN);
    });
    return `| ${cells.join(" | ")} |`;
  });

  return [
    `### ${entityName}`,
    "",
    header,
    separator,
    ...dataRows,
    "",
  ].join("\n");
}
