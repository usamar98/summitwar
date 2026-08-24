import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Keep the E2E server deterministic even when the host shell exports PORT
    // or NODE_ENV values intended for another application.
    command: "npm run dev -- --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: "development",
      PORT: "3000",
      NEXT_PUBLIC_DEMO_MODE: "true",
      VISITOR_FINGERPRINT_SALT: "playwright-only-salt-that-is-long-enough-123",
    },
  },
});
