import { Project, SyntaxKind, type SourceFile } from "ts-morph";
import * as path from "node:path";

function getI18nFile(projectRoot: string): SourceFile {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const filePath = path.join(projectRoot, "src", "i18n.ts");
  return project.addSourceFileAtPath(filePath);
}

export function wireI18nNamespace(
  namespace: string,
  projectRoot: string,
): void {
  const sourceFile = getI18nFile(projectRoot);

  // Find the ns variable declaration
  const nsVar = sourceFile.getVariableDeclaration("ns");
  if (!nsVar) {
    throw new Error("Could not find 'ns' variable in i18n.ts");
  }

  const initializer = nsVar.getInitializer();
  if (
    !initializer ||
    initializer.getKind() !== SyntaxKind.ArrayLiteralExpression
  ) {
    throw new Error("'ns' is not an array literal");
  }

  const arrayLiteral = initializer.asKindOrThrow(
    SyntaxKind.ArrayLiteralExpression,
  );

  // Check if namespace already exists (idempotent)
  const existingElement = arrayLiteral.getElements().find((el) => {
    const text = el.getText();
    return text === `"${namespace}"` || text === `'${namespace}'`;
  });

  if (existingElement) return;

  arrayLiteral.addElement(`"${namespace}"`);

  sourceFile.saveSync();
}

export function unwireI18nNamespace(
  namespace: string,
  projectRoot: string,
): void {
  const sourceFile = getI18nFile(projectRoot);

  const nsVar = sourceFile.getVariableDeclaration("ns");
  if (!nsVar) return;

  const initializer = nsVar.getInitializer();
  if (
    !initializer ||
    initializer.getKind() !== SyntaxKind.ArrayLiteralExpression
  )
    return;

  const arrayLiteral = initializer.asKindOrThrow(
    SyntaxKind.ArrayLiteralExpression,
  );

  const elements = arrayLiteral.getElements();
  for (let i = elements.length - 1; i >= 0; i--) {
    const text = elements[i].getText();
    if (text === `"${namespace}"` || text === `'${namespace}'`) {
      arrayLiteral.removeElement(i);
    }
  }

  sourceFile.saveSync();
}
