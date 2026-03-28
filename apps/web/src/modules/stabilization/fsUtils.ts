import { readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, normalize, resolve } from "node:path";

export { walkTsFiles, STABILIZATION_SKIP_DIRS } from "./fileScanner";

export function relWeb(webRoot: string, abs: string): string {
  return relative(webRoot, abs).replace(/\\/g, "/");
}

export function fileExistsAny(base: string): boolean {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  return candidates.some((c) => {
    try {
      return statSync(c).isFile();
    } catch {
      return false;
    }
  });
}

export function readTextSafe(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

export function resolveWebRoot(): string {
  const cwd = process.cwd();
  const pkgPath = join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string };
      if (pkg.name === "@lecipm/web") return resolve(cwd);
    } catch {
      /* ignore */
    }
  }
  const nested = join(cwd, "apps", "web");
  if (existsSync(join(nested, "package.json"))) return resolve(nested);
  return resolve(cwd);
}

export { join, relative, dirname, normalize, resolve, existsSync, readFileSync };
