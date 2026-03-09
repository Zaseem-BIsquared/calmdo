import { expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { test, seedPlans, seedSubscription } from "@cvx/test.setup";
import { renderWithRouter } from "@/test-helpers";
import { DashboardPage } from "./index";

test("renders dashboard page with get started content", async ({
  client,
  testClient,
  userId,
}) => {
  const { freePlanId } = await seedPlans(testClient);
  await seedSubscription(testClient, { userId, planId: freePlanId });

  renderWithRouter(<DashboardPage />, client);

  await waitFor(() => {
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });

  expect(
    screen.getByText(
      "Explore the Dashboard and get started with your first app.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByText(/go to settings/i)).toBeInTheDocument();
});
