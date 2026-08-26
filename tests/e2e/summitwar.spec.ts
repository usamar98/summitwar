import { expect, test } from "@playwright/test";

test("renders the live homepage without browser errors", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(
    "Startup Leaderboard & Project Discovery | SummitWar",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https:\/\/www\.summitwar\.lol\/?$/,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /live startup leaderboard/i,
  );
  await expect(
    page.locator('meta[name="google-site-verification"]'),
  ).toHaveAttribute("content", "nPnAOOkPg9Pa9DfhfooIu328_owzvfJlP1VIK52n3jY");
  const jsonLdText = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(jsonLdText).toBeTruthy();
  const jsonLd = JSON.parse(jsonLdText ?? "{}") as {
    "@graph": Array<{ "@type": string }>;
  };
  expect(jsonLd["@graph"].map((entry) => entry["@type"])).toEqual([
    "Organization",
    "WebSite",
    "SoftwareApplication",
    "ItemList",
  ]);
  await expect(
    page.getByRole("heading", {
      name: /live startup leaderboard for ambitious projects/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Plant your flag from $1" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Browse project categories/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /weekly startup mountain/i }),
  ).toBeVisible();
  await expect(page.getByText(/Captured the Summit ·/)).toBeVisible();
  await expect(page.getByText(/Knocked Down ·/)).toBeVisible();
  await expect(page.getByText(/Reclaimed the Summit ·/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Summit holder" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent top projects" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Challenge sector #1 with your project",
    }),
  ).toBeVisible();
  await expect(page.getByText("Currently held by").first()).toBeVisible();
  const knockDownButton = page
    .getByRole("button", {
      name: /^Knock down /,
    })
    .first();
  await expect(knockDownButton).toBeVisible();
  await knockDownButton.click();
  await expect(page.getByRole("dialog")).toContainText("Knock down");
  await expect(
    page.getByRole("dialog").getByLabel("Project name"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Open camp")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Rank / })).toHaveCount(50);
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ),
  ).toHaveCount(0);
  await page.locator("#base-camp").scrollIntoViewIfNeeded();
  const baseCamp = page.locator("#base-camp");
  await expect(
    baseCamp.getByRole("heading", { name: "Project Base Camp" }),
  ).toBeVisible();
  await expect(baseCamp.getByText("Showing 55 of 55 projects")).toBeVisible();
  const projectSearch = baseCamp.getByPlaceholder(
    "Search projects or founders",
  );
  await projectSearch.fill("Northstar AI");
  await expect(baseCamp.getByText("Showing 1 of 55 projects")).toBeVisible();
  await expect(
    baseCamp.getByRole("link", { name: "Northstar AI", exact: true }),
  ).toBeVisible();
  await projectSearch.clear();
  expect(browserErrors).toEqual([]);
});

test("publishes useful category discovery pages", async ({ page }) => {
  await page.goto("/categories");
  await expect(page).toHaveTitle(
    "Startup Categories & Indie Project Directory | SummitWar",
  );
  await expect(
    page.getByRole("heading", {
      name: "Browse startups and indie products by category.",
    }),
  ).toBeVisible();
  await expect(page.getByText("6", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Explore category/ }).first(),
  ).toBeVisible();

  await page.goto("/category/ai");
  await expect(page).toHaveTitle(
    "Best AI Startups & Indie Projects | SummitWar",
  );
  await expect(
    page.getByRole("heading", { name: "AI startups and indie projects" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.getByText("Sponsored-placement notice:")).toBeVisible();
});

test("publishes trust and AI-readable platform documentation", async ({
  page,
  request,
}) => {
  await page.goto("/about");
  await expect(page).toHaveTitle(
    "About SummitWar's Transparent Startup Discovery Platform | SummitWar",
  );
  await expect(
    page.getByRole("heading", {
      name: /Startup discovery should be exciting/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Position measures verified sponsored hold/),
  ).toBeVisible();

  const response = await request.get("/llms.txt");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("text/plain");
  const text = await response.text();
  expect(text).toContain("transparent sponsored startup leaderboard");
  expect(text).toContain("/categories");
});

test("creates a listing through the development payment adapter", async ({
  page,
}) => {
  await page.route("**/api/project-preview", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        heading: "Project heading detected from the submitted link.",
        faviconDataUrl: null,
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
test("starts a project challenge directly inside the sector card", async ({
  page,
}) => {
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/checkout", async (route) => {
    submitted = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        checkoutUrl: "/checkout/success?payment_id=inline-challenge&demo=1",
      }),
    });
  });
  await page.goto("/");
  const form = page.getByRole("form", {
    name: "Challenge Northstar AI in sector 1",
  });
  await form.getByLabel("Project name").fill("Inline Peak");
  await form.getByLabel("Project link").fill("https://inline.example.com");
  await form.getByLabel(/X handle/).fill("@inlinepeak");
  await form.getByLabel("Checkout email").fill("inline@example.com");
  await form
    .getByRole("button", { name: "Challenge sector #1 with your project" })
    .click();
  await expect(page).toHaveURL(/checkout\/success/);
  expect(submitted).toMatchObject({
    challengeListingId: "demo-1",
    email: "inline@example.com",
    quickListing: {
      name: "Inline Peak",
      website: "https://inline.example.com",
      founderHandle: "@inlinepeak",
    },
  });
  expect(submitted).not.toHaveProperty("amountDollars");
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
