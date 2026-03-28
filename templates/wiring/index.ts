export { wireSchema, unwireSchema } from "./schema-wirer";
export type { SchemaWiringConfig } from "./schema-wirer";

export { wireNav, unwireNav } from "./nav-wirer";
export type { NavWiringConfig } from "./nav-wirer";

export { wireI18nNamespace, unwireI18nNamespace } from "./i18n-wirer";

export { wireErrors, unwireErrors } from "./errors-wirer";
export type { ErrorsWiringConfig } from "./errors-wirer";

// ── Combined Feature Wiring ─────────────────────────────────────────────────

import { wireSchema, unwireSchema } from "./schema-wirer";
import { wireNav, unwireNav } from "./nav-wirer";
import { wireI18nNamespace, unwireI18nNamespace } from "./i18n-wirer";
import { wireErrors, unwireErrors } from "./errors-wirer";

export interface FeatureWiringConfig {
  featureName: string;
  label: string;
  labelPlural: string;
  path: string;
  icon: string;
  schemaImportPath: string;
  schemaImportName: string;
  i18nNamespace: string;
  errors: Record<string, string>;
}

interface WiringStepResult {
  success: boolean;
  message: string;
}

export interface WiringResult {
  schema: WiringStepResult;
  nav: WiringStepResult;
  i18n: WiringStepResult;
  errors: WiringStepResult;
}

function tryStep(
  name: string,
  fn: () => void,
): WiringStepResult {
  try {
    fn();
    return { success: true, message: `${name} wired successfully` };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    return { success: false, message: `${name} failed: ${message}` };
  }
}

export function wireFeature(
  config: FeatureWiringConfig,
  projectRoot: string,
): WiringResult {
  return {
    schema: tryStep("schema", () =>
      wireSchema(
        {
          featureName: config.featureName,
          tableName: config.featureName,
          importPath: config.schemaImportPath,
          importName: config.schemaImportName,
        },
        projectRoot,
      ),
    ),
    nav: tryStep("nav", () =>
      wireNav(
        {
          featureName: config.featureName,
          label: config.label,
          path: config.path,
          icon: config.icon,
        },
        projectRoot,
      ),
    ),
    i18n: tryStep("i18n", () =>
      wireI18nNamespace(config.i18nNamespace, projectRoot),
    ),
    errors: tryStep("errors", () =>
      wireErrors(
        {
          featureName: config.featureName,
          errors: config.errors,
        },
        projectRoot,
      ),
    ),
  };
}

export function unwireFeature(
  featureName: string,
  projectRoot: string,
): WiringResult {
  return {
    schema: tryStep("schema", () => unwireSchema(featureName, projectRoot)),
    nav: tryStep("nav", () => unwireNav(featureName, projectRoot)),
    i18n: tryStep("i18n", () =>
      unwireI18nNamespace(featureName, projectRoot),
    ),
    errors: tryStep("errors", () =>
      unwireErrors(featureName, projectRoot),
    ),
  };
}
