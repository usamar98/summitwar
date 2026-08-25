import { expect, test } from "@playwright/test";

test("renders the live homepage without browser errors", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(
    page.getByRole("heading", { name: /highest point on the internet/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /weekly startup mountain/i }),
  ).toBeVisible();
  await expect(page.getByText("#1 · Capture the Summit")).toBeVisible();
  await expect(page.getByText("#2–9 · Knocked down")).toBeVisible();
  await expect(
    page.getByText("Previous winner · Reclaim the Summit"),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ranks 1–8" })).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Challenge sector #1 with your project",
    }),
  ).toBeVisible();
  await expect(page.getByText("Currently held by").first()).toBeVisible();
  await expect(page.getByText("Open camp")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Rank / })).toHaveCount(50);
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ),
  ).toHaveCount(0);
  await page.locator("#base-camp").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Base Camp" })).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("creates a listing through the development payment adapter", async ({
  page,
}) => {
  await page.route("**/api/project-preview", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        heading: "Project heading detected from the submitted link.",
        logoDataUrl: null,
      }),
    });
  });
  await page.goto("/start");
  await page.getByLabel("Project name").fill("E2E Peak");
  await page.getByLabel("Project link").fill("https://e2e.example.com");
  await expect(page.getByText("Project detected")).toBeVisible();
  await expect(page.getByLabel("Project heading fallback")).toHaveValue(
    "Project heading detected from the submitted link.",
  );
  await page.getByLabel("Founder name").fill("Test Founder");
  await page.getByLabel("X handle").fill("@e2epeak");
  await page.getByLabel("Category").fill("Testing");
  await page
    .getByLabel("Project heading fallback")
    .fill("A startup built by Playwright.");
  await page
    .getByLabel("Description")
    .fill(
      "This is a long enough description for the end to end listing validation flow.",
    );
  await page.getByLabel("Checkout email").fill("founder@example.com");
  await page.getByRole("button", { name: /Continue to Stripe/ }).click();
  await expect(page).toHaveURL(/checkout\/success/);
  await expect(page.getByText(/Test checkout created/)).toBeVisible();
});
test("checkout success never claims that the browser changed rank", async ({
  page,
}) => {
  await page.goto("/checkout/success");
  await expect(
    page.getByText(/success redirect cannot move your flag/i),
  ).toBeVisible();
});
test("shows live climb choices for an overtake", async ({ page }) => {
  await page.goto("/checkout?listing=demo-2");
  await expect(page.getByRole("tab", { name: "Take summit" })).toBeVisible();
  await expect(
    page.getByText(/Checkout does not reserve a rank/),
  ).toBeVisible();
});
test("protects owner dashboard with passwordless access", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
  await expect(page.getByText("Manage your climb")).toBeVisible();
});
test("documents the weekly avalanche reset", async ({ page }) => {
  await page.goto("/rules");
  await expect(page.getByText("Monday is avalanche day")).toBeVisible();
  await expect(page.getByText(/Monday at 00:00 UTC/)).toBeVisible();
});
test("supports mobile flag tapping", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /Rank 1, Northstar AI/ }).click();
  await expect(page.getByText("Current season climb")).toBeVisible();
});
test("realtime route returns the current mountain payload", async ({
  request,
}) => {
  const response = await request.get("/api/public/mountain");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.mountain).toHaveLength(50);
});
