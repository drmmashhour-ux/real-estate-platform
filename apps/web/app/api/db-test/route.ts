import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * DB connectivity check (Orders 70, 82): single `pg` pool from `@/lib/db` — no duplicate layer.
 */
export async function GET() {
  try {
    const res = await pool.query("SELECT 1 AS ok");
    return Response.json({
      ok: true,
      res: res.rows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
