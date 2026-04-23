export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertDarlinkRuntimeEnv } = await import("./lib/guard");
    assertDarlinkRuntimeEnv();
  }
}
