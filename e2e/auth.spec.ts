import { test, expect } from "./fixtures";
import { signUp } from "./helpers";

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("Auth flows", () => {
  test("sign up with email/password", async ({ session }) => {
    const email = uniqueEmail();

    await signUp(session, email, "password123", "testuser");

    // Should be on dashboard after onboarding
    await session.assertPath("/dashboard");
  });

  test("sign out", async ({ session }) => {
    const email = uniqueEmail();

    await signUp(session, email, "password123", "testuser");

    // Open user menu and click Log Out
    await session.click("Log Out");

    // Should be back at login
    await session.assertPath("/login");
  });

  test("sign in with email/password", async ({ session }) => {
    const email = uniqueEmail();
    const password = "password123";

    // First sign up
    await signUp(session, email, password, "testuser");

    // Sign out
    await session.click("Log Out");
    await session.assertPath("/login");

    // Sign in
    await session
      .fillIn("Email", email)
      .fillIn("Password", password)
      .clickButton("Sign In")
      .assertPath("/dashboard");
  });

  test("password reset flow", async ({ session, page }) => {
    const email = uniqueEmail();
    const originalPassword = "password123";
    const newPassword = "newpassword456";

    // Sign up first
    await signUp(session, email, originalPassword, "testuser");

    // Sign out
    await session.click("Log Out");
    await session.assertPath("/login");

    // Start password reset
    await session.click("Forgot password?");
    await session.assertText("Reset your password");

    await session
      .fillIn("Email", email)
      .clickButton("Send Reset Code");

    // Wait for the reset code email
    await session.assertText("Enter reset code");

    // Visit dev mailbox to get the reset code
    await session.visit("/dev/mailbox");

    // Get the reset code from the dev mailbox page
    // The email subject should contain reset info; expand it to get the code
    const emailEntry = page.locator("button", { hasText: email });
    await emailEntry.click();

    // Extract the code from the expanded email HTML
    const emailHtml = page.locator(".prose");
    const codeText = await emailHtml.textContent();
    // The reset code is typically an 8+ char alphanumeric token in the email body
    const codeMatch = codeText?.match(/\b[A-Za-z0-9]{8,}\b/);
    expect(codeMatch).toBeTruthy();
    const resetCode = codeMatch![0];

    // Go back to login and reset password
    await session
      .visit("/login")
      .click("Forgot password?")
      .fillIn("Email", email)
      .clickButton("Send Reset Code");

    await session.assertText("Enter reset code");

    await session
      .fillIn("Reset Code", resetCode)
      .fillIn("New Password", newPassword)
      .clickButton("Reset Password");

    // Should be signed in after successful reset
    await session.assertPath("/dashboard");

    // Verify: sign out and sign in with new password
    await session.click("Log Out");
    await session
      .fillIn("Email", email)
      .fillIn("Password", newPassword)
      .clickButton("Sign In")
      .assertPath("/dashboard");
  });
});
