import { describe, test, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { getAuthTemplate, applyAuthConfig } from "./auth-config";
import type { AuthSelection } from "./auth-config";

// ── Test fixtures ───────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "auth-config-test-"));
  // Create minimal project structure
  fs.mkdirSync(path.join(tmpDir, "convex/otp"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "convex/password"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, "convex/otp/ResendOTP.ts"),
    "export const ResendOTP = {};\n",
  );
  fs.writeFileSync(
    path.join(tmpDir, "convex/password/ResendOTPPasswordReset.ts"),
    "export const ResendOTPPasswordReset = {};\n",
  );
  fs.writeFileSync(
    path.join(tmpDir, "convex/auth.ts"),
    "// original auth.ts\n",
  );
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── getAuthTemplate ─────────────────────────────────────────────────────────

describe("getAuthTemplate", () => {
  test("should select password-only template for password-only selection", () => {
    const result = getAuthTemplate({ providers: ["password"] });
    expect(result).toBe("password-only");
  });

  test("should select password-otp template for password+otp selection", () => {
    const result = getAuthTemplate({ providers: ["password", "otp"] });
    expect(result).toBe("password-otp");
  });

  test("should select full template for all providers", () => {
    const result = getAuthTemplate({
      providers: ["password", "otp", "github"],
    });
    expect(result).toBe("password-otp-github");
  });

  test("should include otp when github is selected (github implies otp)", () => {
    const result = getAuthTemplate({
      providers: ["password", "github"],
    });
    expect(result).toBe("password-otp-github");
  });
});

// ── applyAuthConfig ─────────────────────────────────────────────────────────

describe("applyAuthConfig", () => {
  test("should copy correct template file for password-only", async () => {
    const selection: AuthSelection = { providers: ["password"] };
    const result = await applyAuthConfig(tmpDir, selection);

    expect(result.templateName).toBe("password-only");

    const authContent = fs.readFileSync(
      path.join(tmpDir, "convex/auth.ts"),
      "utf-8",
    );
    expect(authContent).toContain("Password");
    expect(authContent).not.toContain("ResendOTP");
    expect(authContent).not.toContain("GitHub");
  });

  test("should remove OTP files for password-only mode", async () => {
    const selection: AuthSelection = { providers: ["password"] };
    await applyAuthConfig(tmpDir, selection);

    expect(fs.existsSync(path.join(tmpDir, "convex/otp"))).toBe(false);
    expect(
      fs.existsSync(
        path.join(tmpDir, "convex/password/ResendOTPPasswordReset.ts"),
      ),
    ).toBe(false);
  });

  test("should keep OTP files for password-otp mode", async () => {
    const selection: AuthSelection = { providers: ["password", "otp"] };
    await applyAuthConfig(tmpDir, selection);

    expect(fs.existsSync(path.join(tmpDir, "convex/otp"))).toBe(true);
    expect(
      fs.existsSync(
        path.join(tmpDir, "convex/password/ResendOTPPasswordReset.ts"),
      ),
    ).toBe(true);
  });

  test("should write .env.local with github credentials when provided", async () => {
    const selection: AuthSelection = {
      providers: ["password", "otp", "github"],
      githubClientId: "my-client-id",
      githubClientSecret: "my-client-secret",
    };
    await applyAuthConfig(tmpDir, selection);

    const envContent = fs.readFileSync(
      path.join(tmpDir, ".env.local"),
      "utf-8",
    );
    expect(envContent).toContain("AUTH_GITHUB_ID=my-client-id");
    expect(envContent).toContain("AUTH_GITHUB_SECRET=my-client-secret");
  });

  test("should write .env.local with placeholder comments when credentials not provided", async () => {
    const selection: AuthSelection = {
      providers: ["password", "otp", "github"],
    };
    await applyAuthConfig(tmpDir, selection);

    const envContent = fs.readFileSync(
      path.join(tmpDir, ".env.local"),
      "utf-8",
    );
    expect(envContent).toContain("# AUTH_GITHUB_ID=your_client_id");
    expect(envContent).toContain("# AUTH_GITHUB_SECRET=your_client_secret");
  });

  test("should include dev mailbox hint for OTP users", async () => {
    const selection: AuthSelection = { providers: ["password", "otp"] };
    const result = await applyAuthConfig(tmpDir, selection);

    expect(result.envHints.some((h) => h.includes("/dev/mailbox"))).toBe(true);
  });

  test("should not create .env.local for password-only mode", async () => {
    const selection: AuthSelection = { providers: ["password"] };
    await applyAuthConfig(tmpDir, selection);

    expect(fs.existsSync(path.join(tmpDir, ".env.local"))).toBe(false);
  });

  test("should copy password-otp template with correct content", async () => {
    const selection: AuthSelection = { providers: ["password", "otp"] };
    await applyAuthConfig(tmpDir, selection);

    const authContent = fs.readFileSync(
      path.join(tmpDir, "convex/auth.ts"),
      "utf-8",
    );
    expect(authContent).toContain("Password");
    expect(authContent).toContain("ResendOTP");
    expect(authContent).not.toContain("GitHub");
  });

  test("should copy full template with all providers", async () => {
    const selection: AuthSelection = {
      providers: ["password", "otp", "github"],
    };
    await applyAuthConfig(tmpDir, selection);

    const authContent = fs.readFileSync(
      path.join(tmpDir, "convex/auth.ts"),
      "utf-8",
    );
    expect(authContent).toContain("Password");
    expect(authContent).toContain("ResendOTP");
    expect(authContent).toContain("GitHub");
  });

  test("should report actions taken in result", async () => {
    const selection: AuthSelection = { providers: ["password"] };
    const result = await applyAuthConfig(tmpDir, selection);

    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions.some((a) => a.includes("Copied auth template"))).toBe(
      true,
    );
  });
});
