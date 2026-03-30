import { describe, test, expect } from "vitest";
import {
  runWizard,
  toTitleCase,
  toKebab,
  EXAMPLE_APPS,
  AUTH_PROVIDERS,
} from "./prompts";

describe("runWizard (non-interactive)", () => {
  test("should return defaults in non-interactive mode", async () => {
    const answers = await runWizard({
      defaultName: "test",
      nonInteractive: true,
    });

    expect(answers.projectName).toBe("test");
    expect(answers.authProviders).toEqual(["password"]);
    expect(answers.exampleApps).toEqual(["todos", "tickets", "contacts"]);
  });

  test("should always include password in auth providers", async () => {
    const answers = await runWizard({
      defaultName: "test",
      nonInteractive: true,
    });

    expect(answers.authProviders).toContain("password");
  });

  test("should default to all example apps", async () => {
    const answers = await runWizard({
      defaultName: "test",
      nonInteractive: true,
    });

    expect(answers.exampleApps).toHaveLength(EXAMPLE_APPS.length);
    for (const app of EXAMPLE_APPS) {
      expect(answers.exampleApps).toContain(app.name);
    }
  });

  test("should use provided defaultName as project name", async () => {
    const answers = await runWizard({
      defaultName: "my-cool-app",
      nonInteractive: true,
    });

    expect(answers.projectName).toBe("my-cool-app");
  });

  test("should fall back to 'my-project' when no name provided in non-interactive", async () => {
    const answers = await runWizard({ nonInteractive: true });

    expect(answers.projectName).toBe("my-project");
  });
});

describe("toTitleCase", () => {
  test("should convert kebab-case to Title Case", () => {
    expect(toTitleCase("my-cool-project")).toBe("My Cool Project");
  });

  test("should handle single word", () => {
    expect(toTitleCase("project")).toBe("Project");
  });

  test("should handle multiple hyphens", () => {
    expect(toTitleCase("my-very-cool-project")).toBe(
      "My Very Cool Project",
    );
  });
});

describe("toKebab", () => {
  test("should convert Title Case to kebab-case", () => {
    expect(toKebab("My Cool Project")).toBe("my-cool-project");
  });

  test("should handle spaces and special characters", () => {
    expect(toKebab("My Project!")).toBe("my-project");
  });

  test("should strip leading/trailing hyphens", () => {
    expect(toKebab(" My Project ")).toBe("my-project");
  });
});

describe("EXAMPLE_APPS", () => {
  test("should contain correct entries", () => {
    expect(EXAMPLE_APPS).toHaveLength(3);
    expect(EXAMPLE_APPS.map((a) => a.name)).toEqual([
      "todos",
      "tickets",
      "contacts",
    ]);
  });

  test("should have complexity labels", () => {
    for (const app of EXAMPLE_APPS) {
      expect(app.complexity).toBeTruthy();
      expect(app.label).toBeTruthy();
    }
  });
});

describe("AUTH_PROVIDERS", () => {
  test("should have password as default", () => {
    const passwordProvider = AUTH_PROVIDERS.find(
      (p) => p.id === "password",
    );
    expect(passwordProvider?.default).toBe(true);
  });

  test("should have otp and github as non-default", () => {
    const otpProvider = AUTH_PROVIDERS.find((p) => p.id === "otp");
    const githubProvider = AUTH_PROVIDERS.find(
      (p) => p.id === "github",
    );
    expect(otpProvider?.default).toBe(false);
    expect(githubProvider?.default).toBe(false);
  });
});
