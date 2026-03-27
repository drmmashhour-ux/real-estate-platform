import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-emerald-200/60">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
