import { expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test } from "@cvx/test.setup";
import { api } from "~/convex/_generated/api";
import { renderWithRouter } from "@/test-helpers";
import { UsernamePage } from "./index";

test("renders welcome form with lowercase hint", async ({ client }) => {
  renderWithRouter(<UsernamePage />, client);

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: /welcome/i }),
    ).toBeInTheDocument();
  });

  expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /continue/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/lowercase and alphanumeric/i),
  ).toBeInTheDocument();
});

test("submits valid username", async ({ client }) => {
  renderWithRouter(<UsernamePage />, client);

  const user = userEvent.setup();

  await waitFor(() => {
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
  });

  const input = screen.getByPlaceholderText("Username");
  await user.type(input, "newuser");

  const continueButton = screen.getByRole("button", { name: /continue/i });
  await user.click(continueButton);

  // Verify the backend mutation ran -- completeOnboarding sets the username
  await waitFor(async () => {
    const updatedUser = await client.query(api.users.queries.getCurrentUser, {});
    expect(updatedUser?.username).toBe("newuser");
  });
});

test("shows validation error for short username", async ({ client }) => {
  renderWithRouter(<UsernamePage />, client);

  const user = userEvent.setup();

  await waitFor(() => {
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
  });

  const input = screen.getByPlaceholderText("Username");
  await user.type(input, "ab");

  const continueButton = screen.getByRole("button", { name: /continue/i });
  await user.click(continueButton);

  // TanStack Form applies destructive border to the input when validation fails
  await waitFor(() => {
    expect(input.className).toContain("border-destructive");
  });
});
