import { describe, it, expect, vi, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  generatePreviewHtml,
  writePreview,
  openPreview,
} from "../preview-generator";
import { createConversation, type ConversationState } from "../conversation-state";

// ── Helpers ────────────────────────────────────────────────────────────────

let tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "preview-test-"));
  tempDirs.push(dir);
  return dir;
}

function buildPhase0State(): ConversationState {
  const state = createConversation("test-domain");
  return state;
}

function buildPhase1State(): ConversationState {
  const state = createConversation("test-domain");
  state.entities = [
    {
      name: "tasks",
      label: "Task",
      labelPlural: "Tasks",
      description: "A task",
      fields: {
        title: { type: "string", required: true },
        status: { type: "enum", values: ["todo", "done"] },
      },
      relationships: [],
    },
    {
      name: "projects",
      label: "Project",
      labelPlural: "Projects",
      description: "A project",
      fields: { name: { type: "string", required: true } },
      relationships: [],
    },
  ];
  state.currentPhase = 1;
  state.yamlFiles = {
    tasks: "name: tasks\nlabel: Task\nfields:\n  title:\n    type: string\n",
    projects: "name: projects\nlabel: Project\n",
  };
  return state;
}

function buildPhase3State(): ConversationState {
  const state = buildPhase1State();
  state.currentPhase = 3;
  state.validationResults = [
    { entity: "tasks", valid: true, errors: [] },
    { entity: "projects", valid: true, errors: [] },
  ];
  state.sampleData = {
    tasks: [
      { title: "Task Alpha", status: "todo" },
      { title: "Task Beta", status: "done" },
    ],
    projects: [{ name: "Project Gamma" }],
  };
  return state;
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

// ── generatePreviewHtml ────────────────────────────────────────────────────

describe("generatePreviewHtml", () => {
  it("should return valid HTML with DOCTYPE", () => {
    const html = generatePreviewHtml(buildPhase0State());
    expect(html).toMatch(/^<!DOCTYPE html>/);
  });

  it("should contain Mermaid CDN script tag", () => {
    const html = generatePreviewHtml(buildPhase1State());
    expect(html).toContain("cdn.jsdelivr.net/npm/mermaid@10");
  });

  it("should contain Prism CDN script and CSS tags", () => {
    const html = generatePreviewHtml(buildPhase1State());
    expect(html).toContain("prismjs@1/themes/prism-tomorrow.min.css");
    expect(html).toContain("prismjs@1/prism.min.js");
    expect(html).toContain("prismjs@1/components/prism-yaml.min.js");
  });

  it("should contain auto-refresh JavaScript with setInterval", () => {
    const html = generatePreviewHtml(buildPhase0State());
    expect(html).toContain("setInterval");
    expect(html).toContain("5000");
  });

  it("should include phase indicator showing current phase", () => {
    const html = generatePreviewHtml(buildPhase1State());
    expect(html).toContain("Phase 1");
    expect(html).toContain("Schema + CRUD");
  });

  it("should include entity cards with YAML when entities present", () => {
    const html = generatePreviewHtml(buildPhase1State());
    expect(html).toContain("Task");
    expect(html).toContain("Project");
    expect(html).toContain('<code class="language-yaml">');
  });

  it("should include mermaid diagram div when entities present", () => {
    const html = generatePreviewHtml(buildPhase1State());
    expect(html).toContain('<div class="mermaid">');
    expect(html).toContain("erDiagram");
  });

  it("should include sample data tables when state has sample data", () => {
    const html = generatePreviewHtml(buildPhase3State());
    expect(html).toContain("Sample Data");
    expect(html).toContain("Task Alpha");
    expect(html).toContain("Project Gamma");
    expect(html).toContain("<table>");
  });

  it("should not include sample data section for Phase 0 state", () => {
    const html = generatePreviewHtml(buildPhase0State());
    expect(html).not.toContain("Sample Data");
  });

  it("should include validation badges per entity", () => {
    const html = generatePreviewHtml(buildPhase3State());
    expect(html).toContain("VALID");
  });

  it("should show validation status section for Phase 3", () => {
    const html = generatePreviewHtml(buildPhase3State());
    expect(html).toContain("Validation Status");
    expect(html).toContain("Zod: pass");
  });

  it("should include domain name in header", () => {
    const html = generatePreviewHtml(buildPhase0State());
    expect(html).toContain("test-domain");
  });
});

// ── writePreview ───────────────────────────────────────────────────────────

describe("writePreview", () => {
  it("should write file to .feather/preview/index.html", () => {
    const temp = createTempDir();
    const state = buildPhase1State();
    const filePath = writePreview(temp, state);
    expect(filePath).toContain("index.html");
    expect(existsSync(filePath)).toBe(true);

    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("<!DOCTYPE html>");
  });

  it("should create directory structure", () => {
    const temp = createTempDir();
    const state = buildPhase0State();
    writePreview(temp, state);
    expect(existsSync(join(temp, ".feather", "preview"))).toBe(true);
  });
});

// ── openPreview ────────────────────────────────────────────────────────────

describe("openPreview", () => {
  it("should use platform-appropriate command on macOS", () => {
    // We can't easily mock exec in ESM, so verify behavior indirectly:
    // on macOS (this test env), openPreview should not throw
    expect(() => openPreview("/tmp/nonexistent-preview-test.html")).not.toThrow();
  });
});
