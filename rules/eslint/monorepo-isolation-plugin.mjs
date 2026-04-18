/**
 * ESLint flat-config plugin: forbid imports that cross country-app boundaries.
 *
 * Modes:
 * - `syria` — cannot import apps/web, apps/uae, or @lecipm/web / @lecipm/uae
 * - `web` — cannot import apps/syria, apps/uae, or @lecipm/syria / @lecipm/uae
 * - `uae` — cannot import apps/web, apps/syria, or @lecipm/web / @lecipm/syria
 * - `package` — shared packages cannot import any `apps/*` product code
 */

const MSG = "no-cross-app-imports";

export const ISOLATION_ESLINT_MESSAGE =
  "❌ Cross-app import detected: country apps must remain isolated — forbidden path \"{{path}}\"";

/** @param {string} s */
function lower(s) {
  return s.toLowerCase();
}

/** Shared packages must not reference product apps under `apps/*`. */
function hasAppsSegment(s) {
  const l = lower(s);
  return (
    l.includes("/apps/") ||
    /(^|[/'"`])apps\//.test(l) ||
    (l.includes("apps/") && /\.\.[\\/]/.test(s))
  );
}

/** @param {string} s @param {"web"|"syria"|"uae"} app */
function referencesApp(s, app) {
  const l = lower(s);
  if (l.includes(`@lecipm/${app}`)) return true;
  const seg = `apps/${app}`;
  return l.includes(seg);
}

/**
 * @param {"syria" | "web" | "uae" | "package"} mode
 * @param {string | undefined} source
 */
export function isCrossAppImport(mode, source) {
  if (!source || typeof source !== "string") return false;
  if (mode === "package") {
    return hasAppsSegment(source);
  }
  if (mode === "syria") {
    return referencesApp(source, "web") || referencesApp(source, "uae");
  }
  if (mode === "web") {
    return referencesApp(source, "syria") || referencesApp(source, "uae");
  }
  if (mode === "uae") {
    return referencesApp(source, "web") || referencesApp(source, "syria");
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid cross-imports between country apps and from packages into apps.",
    },
    schema: [
      {
        type: "object",
        properties: {
          mode: { enum: ["syria", "web", "uae", "package"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MSG]: ISOLATION_ESLINT_MESSAGE,
    },
  },
  create(context) {
    const mode = context.options[0]?.mode ?? "syria";

    /** @param {string | undefined} source @param {import('estree').Node} node */
    function reportIfBad(source, node) {
      if (!source || typeof source !== "string") return;
      if (isCrossAppImport(mode, source)) {
        context.report({
          node,
          messageId: MSG,
          data: { path: source },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        reportIfBad(node.source?.value, node);
      },
      ExportNamedDeclaration(node) {
        if (node.source) reportIfBad(node.source.value, node);
      },
      ExportAllDeclaration(node) {
        reportIfBad(node.source?.value, node);
      },
      CallExpression(node) {
        const arg0 = node.arguments[0];
        if (
          node.callee?.type === "Identifier" &&
          node.callee.name === "require" &&
          arg0?.type === "Literal" &&
          typeof arg0.value === "string"
        ) {
          reportIfBad(arg0.value, node);
        }
      },
    };
  },
};

export default {
  meta: { name: "monorepo-isolation", version: "2.0.0" },
  rules: {
    "no-cross-app-imports": rule,
  },
};
