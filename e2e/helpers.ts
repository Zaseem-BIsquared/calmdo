import type { Session } from "feather-testing-core/playwright";

/**
 * Reusable sign-up helper: creates a new account, completes onboarding,
 * and ends on /dashboard.
 */
export function signUp(
  session: Session,
  email: string,
  password: string,
  username: string,
): Session {
  return session
    .visit("/login")
    .click("Create an account")
    .fillIn("Email", email)
    .fillIn("Password", password)
    .clickButton("Sign Up")
    .fillIn("Username", username)
    .clickButton("Continue")
    .assertPath("/dashboard");
}
