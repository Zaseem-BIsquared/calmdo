import { wireFeature, type WiringResult } from "../wiring";
import type { FeatureYaml } from "../schema/feather-yaml.schema";

// ── Wire result type ─────────────────────────────────────────────────────────

export type WireResult = WiringResult;

// ── Derive wiring config from validated YAML ─────────────────────────────────

function deriveIcon(config: FeatureYaml): string {
  // Default icon based on feature name conventions
  const iconMap: Record<string, string> = {
    tasks: "ListTodo",
    projects: "FolderKanban",
    contacts: "Users",
    orders: "ShoppingCart",
    products: "Package",
    tickets: "Ticket",
    invoices: "Receipt",
  };
  return iconMap[config.name] || "Box";
}

function deriveErrors(config: FeatureYaml): Record<string, string> {
  const errors: Record<string, string> = {
    NOT_FOUND: `${config.label} not found.`,
  };

  // Add status transition error if statusFlow is defined
  if (config.statusFlow) {
    errors.INVALID_STATUS_TRANSITION = "Invalid status transition.";
  }

  return errors;
}

function deriveI18nNamespace(config: FeatureYaml): string {
  // Convert camelCase to kebab-case for i18n namespace
  return config.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// ── Pipeline wire function ───────────────────────────────────────────────────

export function wirePipeline(
  config: FeatureYaml,
  projectRoot: string,
): WireResult {
  return wireFeature(
    {
      featureName: config.name,
      label: config.labelPlural || config.label + "s",
      labelPlural: config.labelPlural || config.label + "s",
      path: `/dashboard/${config.name}`,
      icon: deriveIcon(config),
      schemaImportPath: `./generated/${config.name}/schema.fragment`,
      schemaImportName: `${config.name}Table`,
      i18nNamespace: deriveI18nNamespace(config),
      errors: deriveErrors(config),
    },
    projectRoot,
  );
}
