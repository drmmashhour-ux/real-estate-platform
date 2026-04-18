import type { Page } from "@playwright/test";

export type ConsoleTracker = {
  consoleErrors: string[];
  pageErrors: string[];
  attach: (page: Page) => void;
  assertClean: (testName: string) => void;
};

/**
 * Collects browser `console.error` and uncaught page errors.
 * Strict mode (`E2E_STRICT_CONSOLE=1`) fails tests if any remain (excluding Stripe/checkout third-party noise when opted in).
 */
export function createConsoleTracker(): ConsoleTracker {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  return {
    consoleErrors,
    pageErrors,
    attach(page: Page) {
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const t = msg.text();
          if (process.env.E2E_IGNORE_CONSOLE_PATTERN) {
            try {
              if (new RegExp(process.env.E2E_IGNORE_CONSOLE_PATTERN, "i").test(t)) return;
            } catch {
              /* invalid regex — ignore */
            }
          }
          consoleErrors.push(t);
        }
      });
      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });
    },
    assertClean(testName: string) {
      const strict = process.env.E2E_STRICT_CONSOLE === "1";
      if (!strict) return;
      const noise = (s: string) =>
        /favicon|ResizeObserver|hydration|chunk|stripe\.com|js\.stripe/i.test(s);
      const badConsole = consoleErrors.filter((s) => !noise(s));
      const badPage = pageErrors.filter((s) => !noise(s));
      if (badConsole.length > 0 || badPage.length > 0) {
        throw new Error(
          `[${testName}] Console/page errors:\n${[...badConsole, ...badPage].join("\n---\n")}`
        );
      }
    },
  };
}
