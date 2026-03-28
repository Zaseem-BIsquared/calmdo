import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { wireNav, unwireNav } from "../nav-wirer";

describe("nav-wirer", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nav-wirer-"));
    const sharedDir = path.join(tempDir, "src", "shared");
    fs.mkdirSync(sharedDir, { recursive: true });
    fs.writeFileSync(
      path.join(sharedDir, "nav.ts"),
      `export interface NavItem {
  label: string;
  i18nKey: string;
  to: string;
  icon?: React.ComponentType;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    i18nKey: "dashboard.nav.dashboard",
    to: "/dashboard",
  },
  {
    label: "Settings",
    i18nKey: "dashboard.nav.settings",
    to: "/dashboard/settings",
  },
];
`,
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("wires a new nav item", () => {
    wireNav(
      {
        featureName: "widgets",
        label: "Widgets",
        path: "/dashboard/widgets",
        icon: "Box",
      },
      tempDir,
    );

    const content = fs.readFileSync(
      path.join(tempDir, "src", "shared", "nav.ts"),
      "utf-8",
    );
    expect(content).toContain('"Widgets"');
    expect(content).toContain('"/dashboard/widgets"');
  });

  it("inserts before Settings entry", () => {
    wireNav(
      {
        featureName: "widgets",
        label: "Widgets",
        path: "/dashboard/widgets",
        icon: "Box",
      },
      tempDir,
    );

    const content = fs.readFileSync(
      path.join(tempDir, "src", "shared", "nav.ts"),
      "utf-8",
    );
    const widgetsIdx = content.indexOf("/dashboard/widgets");
    const settingsIdx = content.indexOf("/dashboard/settings");
    expect(widgetsIdx).toBeLessThan(settingsIdx);
  });

  it("is idempotent — wiring same path twice produces no duplicate", () => {
    const config = {
      featureName: "widgets",
      label: "Widgets",
      path: "/dashboard/widgets",
      icon: "Box",
    };

    wireNav(config, tempDir);
    wireNav(config, tempDir);

    const content = fs.readFileSync(
      path.join(tempDir, "src", "shared", "nav.ts"),
      "utf-8",
    );
    const count = (content.match(/\/dashboard\/widgets/g) || []).length;
    expect(count).toBe(1);
  });

  it("unwires a nav item", () => {
    wireNav(
      {
        featureName: "widgets",
        label: "Widgets",
        path: "/dashboard/widgets",
        icon: "Box",
      },
      tempDir,
    );

    unwireNav("widgets", tempDir);

    const content = fs.readFileSync(
      path.join(tempDir, "src", "shared", "nav.ts"),
      "utf-8",
    );
    expect(content).not.toContain("Widgets");
    expect(content).not.toContain("/dashboard/widgets");
  });
});
