import YAML from "yaml";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type {
  EntityDraft,
  BehaviorOverlay,
  ConversationState,
} from "./conversation-state";

// ── Build feather.yaml object from entity draft + overlay ──────────────────

function buildFeatureYamlObject(
  entity: EntityDraft,
  overlay?: BehaviorOverlay,
): Record<string, unknown> {
  const yamlObj: Record<string, unknown> = {
    name: entity.name,
    label: entity.label,
    labelPlural: entity.labelPlural,
  };

  // Fields — expand with defaults matching the schema expectations
  const fields: Record<string, Record<string, unknown>> = {};
  for (const [fieldName, fieldDef] of Object.entries(entity.fields)) {
    const field: Record<string, unknown> = { type: fieldDef.type };
    if (fieldDef.required !== undefined) field.required = fieldDef.required;
    if (fieldDef.max !== undefined) field.max = fieldDef.max;
    if (fieldDef.min !== undefined) field.min = fieldDef.min;
    if (fieldDef.default !== undefined) field.default = fieldDef.default;
    if (fieldDef.values !== undefined) field.values = fieldDef.values;
    fields[fieldName] = field;
  }
  yamlObj.fields = fields;

  // Identity (from overlay or default)
  yamlObj.identity = overlay?.identity ?? { type: "auto-increment" };

  // Relationships — convert array to record keyed by target name
  if (entity.relationships.length > 0) {
    const rels: Record<string, Record<string, unknown>> = {};
    for (const rel of entity.relationships) {
      const relObj: Record<string, unknown> = {
        type: rel.type,
        target: rel.target,
      };
      if (rel.required !== undefined) relObj.required = rel.required;
      if (rel.column !== undefined) relObj.column = rel.column;
      rels[rel.target] = relObj;
    }
    yamlObj.relationships = rels;
  }

  // Behavior overlay dimensions
  if (overlay) {
    if (overlay.access) yamlObj.access = overlay.access;
    if (overlay.statusFlow) yamlObj.statusFlow = overlay.statusFlow;
    if (overlay.hooks) yamlObj.hooks = overlay.hooks;
    if (overlay.derivedData) yamlObj.derivedData = overlay.derivedData;
    if (overlay.views) yamlObj.views = overlay.views;
    if (overlay.schedules) yamlObj.schedules = overlay.schedules;
    if (overlay.integrations) yamlObj.integrations = overlay.integrations;
    if (overlay.behaviors) yamlObj.behaviors = overlay.behaviors;
  }

  return yamlObj;
}

// ── Generate feather.yaml string from entity draft + overlay ───────────────

export function generateFeatherYaml(
  entity: EntityDraft,
  overlay?: BehaviorOverlay,
): string {
  const yamlObj = buildFeatureYamlObject(entity, overlay);
  return YAML.stringify(yamlObj, { lineWidth: 120 });
}

// ── Generate YAML for all entities in a conversation ───────────────────────

export function generateAllYaml(
  state: ConversationState,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entity of state.entities) {
    const overlay = state.behaviors[entity.name];
    result[entity.name] = generateFeatherYaml(entity, overlay);
  }
  return result;
}

// ── Write YAML files to feature directories ────────────────────────────────

export function writeYamlFiles(
  projectRoot: string,
  yamlMap: Record<string, string>,
): string[] {
  const writtenPaths: string[] = [];
  for (const [entityName, yamlContent] of Object.entries(yamlMap)) {
    const featureDir = resolve(projectRoot, "src", "features", entityName);
    mkdirSync(featureDir, { recursive: true });
    const filePath = join(featureDir, "feather.yaml");
    writeFileSync(filePath, yamlContent, "utf-8");
    writtenPaths.push(filePath);
  }
  return writtenPaths;
}
