import { Project, SyntaxKind, type SourceFile, type ObjectLiteralExpression } from "ts-morph";
import * as path from "node:path";

export interface ErrorsWiringConfig {
  featureName: string;
  errors: Record<string, string>;
}

function getErrorsFile(projectRoot: string): SourceFile {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const filePath = path.join(projectRoot, "src", "shared", "errors.ts");
  return project.addSourceFileAtPath(filePath);
}

function findObjectLiteral(errorsVar: ReturnType<SourceFile["getVariableDeclaration"]>): ObjectLiteralExpression {
  if (!errorsVar) throw new Error("Could not find 'ERRORS' variable in errors.ts");

  const initializer = errorsVar.getInitializer();
  if (!initializer) throw new Error("'ERRORS' has no initializer");

  // Direct object literal
  if (initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
    return initializer.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  }

  // Handle `{ ... } as const` — AsExpression wrapping an ObjectLiteralExpression
  if (initializer.getKind() === SyntaxKind.AsExpression) {
    const asExpr = initializer.asKindOrThrow(SyntaxKind.AsExpression);
    const expr = asExpr.getExpression();
    if (expr.getKind() === SyntaxKind.ObjectLiteralExpression) {
      return expr.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    }
  }

  throw new Error("'ERRORS' is not an object literal (or 'as const' assertion)");
}

export function wireErrors(
  config: ErrorsWiringConfig,
  projectRoot: string,
): void {
  const sourceFile = getErrorsFile(projectRoot);

  const errorsVar = sourceFile.getVariableDeclaration("ERRORS");
  const objectLiteral = findObjectLiteral(errorsVar);

  // Check if feature group already exists (idempotent)
  const existingProp = objectLiteral
    .getProperties()
    .find((prop) =>
      prop.getText().startsWith(config.featureName + ":"),
    );

  if (existingProp) return;

  // Build the error object entries
  const errorEntries = Object.entries(config.errors)
    .map(([key, message]) => `    ${key}: "${message}"`)
    .join(",\n");

  objectLiteral.addPropertyAssignment({
    name: config.featureName,
    initializer: `{\n${errorEntries},\n  }`,
  });

  sourceFile.saveSync();
}

export function unwireErrors(
  featureName: string,
  projectRoot: string,
): void {
  const sourceFile = getErrorsFile(projectRoot);

  const errorsVar = sourceFile.getVariableDeclaration("ERRORS");
  if (!errorsVar) return;

  let objectLiteral: ObjectLiteralExpression;
  try {
    objectLiteral = findObjectLiteral(errorsVar);
  } catch {
    return;
  }

  const prop = objectLiteral
    .getProperties()
    .find((p) => p.getText().startsWith(featureName + ":"));

  if (prop) prop.remove();

  sourceFile.saveSync();
}
