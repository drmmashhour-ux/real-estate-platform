/** Mirrors Prisma.JsonValue without importing `@prisma/client` or runtime. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { readonly [key: string]: JsonValue };
