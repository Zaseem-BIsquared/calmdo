import { Project, SyntaxKind, type SourceFile } from "ts-morph";
import * as path from "node:path";

export interface NavWiringConfig {
  featureName: string;
  label: string;
  path: string;
  icon: string;
  i18nKey?: string;
  section?: string;
}

function getNavFile(projectRoot: string): SourceFile {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const filePath = path.join(projectRoot, "src", "shared", "nav.ts");
  return project.addSourceFileAtPath(filePath);
}

export function wireNav(
  config: NavWiringConfig,
  projectRoot: string,
): void {
  const sourceFile = getNavFile(projectRoot);

  // Find navItems array
  const navItemsVar = sourceFile.getVariableDeclaration("navItems");
  if (!navItemsVar) {
    throw new Error("Could not find navItems variable in nav.ts");
  }

  const initializer = navItemsVar.getInitializer();
  if (
    !initializer ||
    initializer.getKind() !== SyntaxKind.ArrayLiteralExpression
  ) {
    throw new Error("navItems is not an array literal");
  }

  const arrayLiteral = initializer.asKindOrThrow(
    SyntaxKind.ArrayLiteralExpression,
  );

  // Check if item with matching path already exists (idempotent)
  const existingElement = arrayLiteral.getElements().find((el) => {
    const text = el.getText();
    return text.includes(`to: "${config.path}"`);
  });

  if (existingElement) return;

  // Find the Settings entry to insert before it (or before the dev mailbox spread)
  const elements = arrayLiteral.getElements();
  let insertIndex = elements.length;

  // Try to insert before Settings or dev mailbox
  for (let i = 0; i < elements.length; i++) {
    const text = elements[i].getText();
    if (text.includes('to: "/dashboard/settings"') || text.includes("import.meta.env.DEV")) {
      insertIndex = i;
      break;
    }
  }

  const i18nKey =
    config.i18nKey ||
    `${config.featureName}.nav.${config.featureName}`;

  const navItemText = `{
    label: "${config.label}",
    i18nKey: "${i18nKey}",
    to: "${config.path}",
  }`;

  arrayLiteral.insertElement(insertIndex, navItemText);

  sourceFile.saveSync();
}

export function unwireNav(
  featureName: string,
  projectRoot: string,
): void {
  const sourceFile = getNavFile(projectRoot);

  const navItemsVar = sourceFile.getVariableDeclaration("navItems");
  if (!navItemsVar) return;

  const initializer = navItemsVar.getInitializer();
  if (
    !initializer ||
    initializer.getKind() !== SyntaxKind.ArrayLiteralExpression
  )
    return;

  const arrayLiteral = initializer.asKindOrThrow(
    SyntaxKind.ArrayLiteralExpression,
  );

  // Remove element that contains the feature's path pattern
  const elements = arrayLiteral.getElements();
  for (let i = elements.length - 1; i >= 0; i--) {
    const text = elements[i].getText();
    if (text.includes(`/${featureName}"`)) {
      arrayLiteral.removeElement(i);
    }
  }

  sourceFile.saveSync();
}
