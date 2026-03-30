import { mkdirSync, writeFileSync } from "node:fs";
import { exec } from "node:child_process";
import { join, resolve } from "node:path";
import type { ConversationState } from "./conversation-state";
import { getPhaseLabel } from "./conversation-state";
import { loadConversation } from "./conversation-io";
import { generateErDiagram, generateEntitySummary } from "./mermaid-generator";
import { generateSampleRows, formatSampleTable } from "./sample-data";

// ── Escape HTML special characters ─────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Generate sample data HTML tables ───────────────────────────────────────

function generateSampleDataHtml(state: ConversationState): string {
  if (Object.keys(state.sampleData).length === 0 && state.currentPhase < 3) {
    return "";
  }

  const sections: string[] = [];
  for (const entity of state.entities) {
    const rows =
      state.sampleData[entity.name] ?? generateSampleRows(entity, 3);
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    const headerCells = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
    const bodyRows = rows
      .map((row) => {
        const cells = columns
          .map((col) => {
            const val = row[col];
            const str = val === null || val === undefined ? "" : String(val);
            return `<td>${escapeHtml(str)}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("\n          ");

    sections.push(`
      <div class="sample-card">
        <h3>${escapeHtml(entity.label)}</h3>
        <table>
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`);
  }

  if (sections.length === 0) return "";

  return `
    <section id="sample-data">
      <h2>Sample Data</h2>
      ${sections.join("\n")}
    </section>`;
}

// ── Generate validation status HTML ────────────────────────────────────────

function generateValidationHtml(state: ConversationState): string {
  if (state.currentPhase < 3 && state.validationResults.length === 0) {
    return "";
  }

  const zodStatus =
    state.validationResults.length > 0
      ? state.validationResults.every((r) => r.valid)
        ? "pass"
        : "fail"
      : "pending";

  const sampleStatus =
    Object.keys(state.sampleData).length > 0 ? "reviewed" : "pending";

  const dryRunStatus = state.dryRunResult
    ? state.dryRunResult.success
      ? "pass"
      : "fail"
    : "pending";

  return `
    <section id="validation">
      <h2>Validation Status</h2>
      <div class="validation-summary">
        <span class="badge ${zodStatus}">Zod: ${zodStatus}</span>
        <span class="badge ${sampleStatus}">Sample Data: ${sampleStatus}</span>
        <span class="badge ${dryRunStatus}">Dry Run: ${dryRunStatus}</span>
      </div>
    </section>`;
}

// ── Generate entity cards with YAML ────────────────────────────────────────

function generateEntityCardsHtml(state: ConversationState): string {
  if (state.entities.length === 0) {
    return `
    <section id="entities">
      <h2>Entity Definitions</h2>
      <p class="empty">No entities discovered yet. Start the conversation to discover entities.</p>
    </section>`;
  }

  const cards = state.entities
    .map((entity) => {
      const yamlContent = state.yamlFiles[entity.name] ?? "";
      const validation = state.validationResults.find(
        (r) => r.entity === entity.name,
      );
      const badgeClass = validation
        ? validation.valid
          ? "pass"
          : "fail"
        : "pending";
      const badgeText = validation
        ? validation.valid
          ? "VALID"
          : "INVALID"
        : "PENDING";

      const yamlDisplay = yamlContent
        ? `<pre><code class="language-yaml">${escapeHtml(yamlContent)}</code></pre>`
        : `<p class="empty">YAML not yet generated (Phase 1)</p>`;

      return `
      <div class="entity-card">
        <div class="entity-header">
          <h3>${escapeHtml(entity.label)} <small>(${escapeHtml(entity.name)})</small></h3>
          <span class="validation-badge ${badgeClass}">${badgeText}</span>
        </div>
        ${yamlDisplay}
      </div>`;
    })
    .join("\n");

  return `
    <section id="entities">
      <h2>Entity Definitions</h2>
      ${cards}
    </section>`;
}

// ── CSS Styles ─────────────────────────────────────────────────────────────

const CSS = `
    <style>
      :root {
        --bg: #1a1b26;
        --surface: #24283b;
        --border: #414868;
        --text: #c0caf5;
        --text-dim: #565f89;
        --accent: #7aa2f7;
        --green: #9ece6a;
        --red: #f7768e;
        --yellow: #e0af68;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        background: var(--bg); color: var(--text);
        max-width: 1200px; margin: 0 auto; padding: 2rem;
      }
      header { margin-bottom: 2rem; }
      h1 { color: var(--accent); font-size: 1.8rem; margin-bottom: 0.5rem; }
      h2 { color: var(--accent); font-size: 1.3rem; margin: 2rem 0 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
      h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
      h3 small { color: var(--text-dim); font-weight: normal; }
      .phase-indicator { color: var(--yellow); font-size: 1rem; margin-bottom: 0.25rem; }
      .stats { color: var(--text-dim); font-size: 0.9rem; }
      .entity-card {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 8px; padding: 1rem; margin-bottom: 1rem;
      }
      .entity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
      .validation-badge {
        padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
      }
      .validation-badge.pass { background: var(--green); color: var(--bg); }
      .validation-badge.fail { background: var(--red); color: var(--bg); }
      .validation-badge.pending { background: var(--border); color: var(--text-dim); }
      pre { background: #1e1e2e; border-radius: 4px; padding: 1rem; overflow-x: auto; margin: 0; }
      code { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.85rem; }
      .mermaid { background: var(--surface); border-radius: 8px; padding: 1rem; text-align: center; }
      .sample-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
      table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.85rem; }
      th { background: var(--bg); padding: 0.5rem; text-align: left; border-bottom: 2px solid var(--border); }
      td { padding: 0.5rem; border-bottom: 1px solid var(--border); }
      .validation-summary { display: flex; gap: 1rem; flex-wrap: wrap; }
      .badge {
        padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.85rem;
      }
      .badge.pass { background: rgba(158, 206, 106, 0.2); color: var(--green); }
      .badge.fail { background: rgba(247, 118, 142, 0.2); color: var(--red); }
      .badge.pending { background: rgba(86, 95, 137, 0.2); color: var(--text-dim); }
      .badge.reviewed { background: rgba(224, 175, 104, 0.2); color: var(--yellow); }
      .empty { color: var(--text-dim); font-style: italic; }
      footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--text-dim); font-size: 0.8rem; display: flex; justify-content: space-between; }
    </style>`;

// ── Main HTML Generator ────────────────────────────────────────────────────

export function generatePreviewHtml(state: ConversationState): string {
  const erDiagram = generateErDiagram(state.entities);
  const summary = generateEntitySummary(state.entities);
  const timestamp = new Date().toISOString();

  const erSection =
    state.entities.length > 0
      ? `
    <section id="er-diagram">
      <h2>Entity Relationships</h2>
      <div class="mermaid">
${escapeHtml(erDiagram)}
      </div>
    </section>`
      : "";

  const entityCards = generateEntityCardsHtml(state);
  const sampleDataSection = generateSampleDataHtml(state);
  const validationSection = generateValidationHtml(state);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Feather Architect - ${escapeHtml(state.domain)}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-tomorrow.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-yaml.min.js"></script>
  ${CSS}
</head>
<body>
  <header>
    <h1>Feather Architect - ${escapeHtml(state.domain)}</h1>
    <div class="phase-indicator">Phase ${state.currentPhase}: ${escapeHtml(getPhaseLabel(state.currentPhase))}</div>
    <div class="stats">${escapeHtml(summary)}</div>
  </header>
  ${erSection}
  ${entityCards}
  ${sampleDataSection}
  ${validationSection}
  <footer>
    <div class="last-updated">Last updated: ${timestamp}</div>
    <div class="auto-refresh">Auto-refreshing every 5s</div>
  </footer>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    Prism.highlightAll();
    let lastModified = '${timestamp}';
    setInterval(async () => {
      try {
        const resp = await fetch(window.location.href, { method: 'HEAD' });
        const modified = resp.headers.get('last-modified');
        if (modified && modified !== lastModified) {
          lastModified = modified;
          window.location.reload();
        }
      } catch (e) { /* offline or file:// -- skip */ }
    }, 5000);
  </script>
</body>
</html>`;
}

// ── Write preview to disk ──────────────────────────────────────────────────

export function writePreview(
  projectRoot: string,
  state: ConversationState,
): string {
  const html = generatePreviewHtml(state);
  const previewDir = resolve(projectRoot, ".feather", "preview");
  mkdirSync(previewDir, { recursive: true });
  const filePath = join(previewDir, "index.html");
  writeFileSync(filePath, html, "utf-8");
  return filePath;
}

// ── Open preview in browser ────────────────────────────────────────────────

export function openPreview(filePath: string): void {
  const platform = process.platform;
  let cmd: string;
  if (platform === "darwin") {
    cmd = `open "${filePath}"`;
  } else if (platform === "win32") {
    cmd = `start "" "${filePath}"`;
  } else {
    cmd = `xdg-open "${filePath}"`;
  }
  exec(cmd, () => {
    // Fire and forget — errors are non-critical
  });
}

// ── CLI entry point ────────────────────────────────────────────────────────

/* v8 ignore start — CLI entry point only used when run directly */
if (
  typeof process !== "undefined" &&
  process.argv[1]?.endsWith("preview-generator.ts")
) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    console.log("Usage: npx tsx lib/conversation/preview-generator.ts <conversation-id> [--no-open]");
    console.log("\nGenerates an HTML preview dashboard for the conversation.");
    process.exit(0);
  }

  const conversationId = args.find((a) => !a.startsWith("--")) ?? "";
  const noOpen = args.includes("--no-open");

  const state = loadConversation(".", conversationId);
  if (!state) {
    console.error(`Conversation not found: ${conversationId}`);
    process.exit(1);
  }

  const path = writePreview(".", state);
  console.log(`Preview written to: ${path}`);

  if (!noOpen) {
    openPreview(path);
    console.log("Opened in browser.");
  }
}
/* v8 ignore stop */
