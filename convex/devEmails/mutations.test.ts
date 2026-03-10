import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { test } from "../test.setup";

describe("devEmails mutations", () => {
  test("store inserts an email record", async ({ testClient }) => {
    await testClient.mutation(api.devEmails.mutations.store, {
      to: ["user@example.com"],
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
      sentAt: 1000,
    });

    const emails = await testClient.run(async (ctx: any) => {
      return ctx.db.query("devEmails").collect();
    });
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toEqual(["user@example.com"]);
    expect(emails[0].subject).toBe("Test Subject");
    expect(emails[0].html).toBe("<p>Hello</p>");
    expect(emails[0].text).toBe("Hello");
    expect(emails[0].sentAt).toBe(1000);
  });

  test("store works without optional text field", async ({ testClient }) => {
    await testClient.mutation(api.devEmails.mutations.store, {
      to: ["a@b.com"],
      subject: "No text",
      html: "<p>Only HTML</p>",
      sentAt: 2000,
    });

    const emails = await testClient.run(async (ctx: any) => {
      return ctx.db.query("devEmails").collect();
    });
    expect(emails).toHaveLength(1);
    expect(emails[0].text).toBeUndefined();
  });

  test("clearAll removes all email records", async ({ testClient }) => {
    // Insert two emails
    await testClient.mutation(api.devEmails.mutations.store, {
      to: ["a@b.com"],
      subject: "First",
      html: "<p>1</p>",
      sentAt: 1000,
    });
    await testClient.mutation(api.devEmails.mutations.store, {
      to: ["c@d.com"],
      subject: "Second",
      html: "<p>2</p>",
      sentAt: 2000,
    });

    // Verify they exist
    let emails = await testClient.run(async (ctx: any) => {
      return ctx.db.query("devEmails").collect();
    });
    expect(emails).toHaveLength(2);

    // Clear all
    await testClient.mutation(api.devEmails.mutations.clearAll, {});

    // Verify empty
    emails = await testClient.run(async (ctx: any) => {
      return ctx.db.query("devEmails").collect();
    });
    expect(emails).toHaveLength(0);
  });
});
