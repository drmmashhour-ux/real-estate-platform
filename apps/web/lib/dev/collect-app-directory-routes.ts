import { readdir } from "fs/promises";
import path from "path";

/**
 * Lists public URL paths for each `page.tsx` under `absRoot` (absolute path inside `app/`).
 * `urlPrefix` is the path segment for that folder (e.g. `/admin`).
 */
export async function collectRoutesUnder(absRoot: string, urlPrefix: string): Promise<string[]> {
  const routes: string[] = [];

  async function walk(absDir: string, urlPath: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }

    if (entries.some((e) => e.isFile() && e.name === "page.tsx")) {
      routes.push(urlPath);
    }

    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const name = e.name;
      if (name === "node_modules" || name.startsWith(".") || name.startsWith("@") || name.startsWith("_")) {
        continue;
      }
      const isRouteGroup = name.startsWith("(") && name.endsWith(")");
      const segment = isRouteGroup ? null : name;
      const nextUrl = segment ? `${urlPath}/${segment}` : urlPath;
      await walk(path.join(absDir, e.name), nextUrl);
    }
  }

  await walk(absRoot, urlPrefix);
  return [...new Set(routes)].sort((a, b) => a.localeCompare(b));
}
