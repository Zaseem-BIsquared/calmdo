import { Project, SyntaxKind, type SourceFile } from "ts-morph";
import * as path from "node:path";

export interface SchemaWiringConfig {
  featureName: string;
  tableName: string;
  importPath: string;
  importName: string;
}

function getOrCreateProject(projectRoot: string): Project {
  return new Project({
    tsConfigFilePath: path.join(projectRoot, "convex", "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });
}

function getSchemaFile(
  project: Project,
  projectRoot: string,
): SourceFile {
  const filePath = path.join(projectRoot, "convex", "schema.ts");
  return project.addSourceFileAtPath(filePath);
}

export function wireSchema(
  config: SchemaWiringConfig,
  projectRoot: string,
): void {
  const project = getOrCreateProject(projectRoot);
  const sourceFile = getSchemaFile(project, projectRoot);

  // Check if import already exists (idempotent)
  const existingImport = sourceFile.getImportDeclarations().find((imp) => {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    return moduleSpecifier === config.importPath;
  });

  if (!existingImport) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: config.importPath,
      namedImports: [config.importName],
    });
  }

  // Find defineSchema call
  const defineSchemaCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => call.getExpression().getText() === "defineSchema");

  if (!defineSchemaCall) {
    throw new Error("Could not find defineSchema() call in schema.ts");
  }

  const firstArg = defineSchemaCall.getArguments()[0];
  if (!firstArg || firstArg.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    throw new Error(
      "defineSchema() first argument is not an object literal",
    );
  }

  const objectLiteral = firstArg.asKindOrThrow(
    SyntaxKind.ObjectLiteralExpression,
  );

  // Check if property already exists (idempotent)
  const existingProp = objectLiteral
    .getProperties()
    .find((prop) => prop.getText().startsWith(config.tableName + ":"));

  if (existingProp) return;

  // Add the property after the last existing property
  objectLiteral.addPropertyAssignment({
    name: config.tableName,
    initializer: config.importName,
  });

  sourceFile.saveSync();
}

export function unwireSchema(
  featureName: string,
  projectRoot: string,
): void {
  const project = getOrCreateProject(projectRoot);
  const sourceFile = getSchemaFile(project, projectRoot);

  // Remove import that contains the feature name pattern
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const moduleSpec = imp.getModuleSpecifierValue();
    if (moduleSpec.includes(featureName)) {
      imp.remove();
    }
  }

  // Find defineSchema call and remove the property
  const defineSchemaCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => call.getExpression().getText() === "defineSchema");

  if (!defineSchemaCall) return;

  const firstArg = defineSchemaCall.getArguments()[0];
  if (!firstArg || firstArg.getKind() !== SyntaxKind.ObjectLiteralExpression)
    return;

  const objectLiteral = firstArg.asKindOrThrow(
    SyntaxKind.ObjectLiteralExpression,
  );

  const prop = objectLiteral
    .getProperties()
    .find((p) => p.getText().startsWith(featureName + ":"));

  if (prop) prop.remove();

  sourceFile.saveSync();
}
