/**
 * Vitest / Node: real `server-only` is a side-effect import; the empty shim lets unit tests
 * load files that are marked server-only in Next.js without a Vite `server-only` package.
 */
export {};
