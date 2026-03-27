export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionEnvAtStartup } = await import("@/lib/env/production");
    validateProductionEnvAtStartup();
  }
}
