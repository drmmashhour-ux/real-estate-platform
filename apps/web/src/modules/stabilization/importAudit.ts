/**
 * Static import graph audit: resolve @/ and relative specifiers; detect broken imports and cycles.
 */
import { dirname, join, normalize, relative, resolve } from "node:path";
import type { AuditResult, StabilizationIssue } from "./types";
import { walkTsFiles, fileExistsAny, readTextSafe, relWeb } from "./fsUtils";

const REPO_ROOT = (webRoot: string) => resolve(webRoot, "..", "..");

function mapAlias(spec: string, webRoot: string): string[] {
  if (!spec.startsWith("@/")) return [];
  const sub = spec.slice(2);
  if (sub.startsWith("design/")) return [join(webRoot, "src", "design", sub.slice(7))];
  if (sub.startsWith("modules/")) return [join(webRoot, "modules", sub.slice(8))];
  if (sub.startsWith("components/")) return [join(webRoot, "components", sub.slice(11))];
  if (sub.startsWith("hooks/")) return [join(webRoot, "hooks", sub.slice(6))];
  if (sub.startsWith("types/")) return [join(webRoot, "types", sub.slice(6))];
  if (sub.startsWith("config/")) return [join(webRoot, "config", sub.slice(7))];
  return [join(webRoot, sub)];
}

function mapWorkspaceAlias(spec: string, webRoot: string): string[] {
  const root = REPO_ROOT(webRoot);
  if (spec.startsWith("@ui/")) {
    return [join(root, "packages", "ui", "src", spec.slice(4))];
  }
  if (spec.startsWith("@utils/")) {
    return [join(root, "packages", "utils", "src", spec.slice(7))];
  }
  if (spec.startsWith("@shared-types/")) {
    return [join(root, "packages", "types", "src", spec.slice(14))];
  }
  if (spec.startsWith("@api/")) {
    return [join(root, "packages", "api-client", "src", spec.slice(5))];
  }
  return [];
}

function extractImports(source: string): string[] {
  const out = new Set<string>();
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bexport\s+[\s\S]*?\s+from\s+["']([^"']+)["']/g,
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      const s = m[1];
      if (s && !s.startsWith("node:")) out.add(s);
    }
  }
  return [...out];
}

function resolveSpecifier(spec: string, fromFile: string, webRoot: string): { ok: boolean; resolved?: string } {
  if (!spec.startsWith(".") && !spec.startsWith("@/") && !spec.startsWith("@ui/") && !spec.startsWith("@utils/") && !spec.startsWith("@shared-types/") && !spec.startsWith("@api/")) {
    if (spec.startsWith("@") && !spec.startsWith("@/")) {
      return { ok: true };
    }
    return { ok: true };
  }

  if (spec.startsWith(".")) {
    const base = normalize(resolve(dirname(fromFile), spec));
    if (fileExistsAny(base)) return { ok: true, resolved: base };
    return { ok: false };
  }

  const aliasPaths = spec.startsWith("@/") ? mapAlias(spec, webRoot) : mapWorkspaceAlias(spec, webRoot);

  for (const p of aliasPaths) {
    const base = normalize(p);
    if (fileExistsAny(base)) return { ok: true, resolved: base };
  }

  return { ok: false };
}

function normalizeGraphPath(webRoot: string, abs: string): string {
  const r = relative(webRoot, abs).replace(/\\/g, "/");
  if (!r || r.startsWith("..")) return "";
  return r;
}

/** DFS back-edge cycle hints (deduped by fingerprint). */
function findCycles(edges: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = [];
  const seen = new Set<string>();
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(u: string): void {
    visited.add(u);
    stack.add(u);
    path.push(u);
    for (const v of edges.get(u) ?? []) {
      if (!v) continue;
      if (!visited.has(v)) dfs(v);
      else if (stack.has(v)) {
        const i = path.indexOf(v);
        if (i >= 0) {
          const cyc = path.slice(i);
          const fp = [...cyc].sort().join("|");
          if (!seen.has(fp) && cyc.length > 1) {
            seen.add(fp);
            cycles.push(cyc);
          }
        }
      }
    }
    path.pop();
    stack.delete(u);
  }

  for (const n of edges.keys()) {
    if (!visited.has(n)) dfs(n);
  }
  return cycles;
}

export function runImportAudit(webRoot: string): AuditResult {
  const issues: StabilizationIssue[] = [];
  const files = walkTsFiles(webRoot).filter(
    (f) => !f.includes("/node_modules/") && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx")
  );

  let resolvedCount = 0;
  let unresolvedCount = 0;
  const broken: { file: string; spec: string }[] = [];
  const graph = new Map<string, Set<string>>();

  for (const file of files) {
    const rel = relWeb(webRoot, file);
    if (!graph.has(rel)) graph.set(rel, new Set());
    const src = readTextSafe(file);
    if (src == null) continue;
    for (const spec of extractImports(src)) {
      if (!spec.startsWith(".") && !spec.startsWith("@/") && !spec.startsWith("@ui/") && !spec.startsWith("@utils/") && !spec.startsWith("@shared-types/") && !spec.startsWith("@api/")) {
        continue;
      }
      const r = resolveSpecifier(spec, file, webRoot);
      if (r.ok && r.resolved && r.resolved.startsWith(webRoot)) {
        resolvedCount += 1;
        const np = normalizeGraphPath(webRoot, r.resolved);
        if (np) graph.get(rel)!.add(np);
      } else if (r.ok) {
        resolvedCount += 1;
      } else {
        unresolvedCount += 1;
        broken.push({ file: rel, spec });
      }
    }
  }

  for (const b of broken) {
    issues.push({
      severity: "HIGH",
      code: "IMPORT_UNRESOLVED",
      message: `Unresolved import "${b.spec}"`,
      file: b.file,
    });
  }

  const cycles = findCycles(graph);
  const severeCycles = cycles.filter((c) => c.length <= 12);
  for (const c of severeCycles.slice(0, 25)) {
    issues.push({
      severity: c.length >= 4 ? "HIGH" : "MEDIUM",
      code: "IMPORT_CYCLE",
      message: `Circular dependency (${c.length} modules): ${c.slice(0, 5).join(" → ")}${c.length > 5 ? " …" : ""}`,
      detail: c.join(" → "),
    });
  }

  return {
    name: "importAudit",
    issues,
    stats: {
      filesScanned: files.length,
      resolvedImports: resolvedCount,
      unresolvedImports: unresolvedCount,
      cyclesDetected: cycles.length,
    },
  };
}
