import { Router, type Request, type Response } from "express";
import type { RegisterUser } from "../../../use-cases/RegisterUser.js";
import type { Login } from "../../../use-cases/Login.js";
import type { Logout } from "../../../use-cases/Logout.js";
import type { RefreshTokens } from "../../../use-cases/RefreshTokens.js";
import type { GetMe } from "../../../use-cases/GetMe.js";
import type { ForgotPassword } from "../../../use-cases/ForgotPassword.js";
import type { ResetPassword } from "../../../use-cases/ResetPassword.js";
import {
  registerBodySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
} from "../validation/schemas.js";
import { validateBody, sendValidationError } from "../validation/validate.js";

export function createAuthRouter(
  registerUser: RegisterUser,
  login: Login,
  logout: Logout,
  refreshTokens: RefreshTokens,
  _getMe: GetMe,
  forgotPassword: ForgotPassword,
  resetPassword: ResetPassword
): Router {
  const router = Router();

  router.post("/register", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(registerBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const { email, password, name, phone, locale, role } = validation.data;
    const result = await registerUser.execute({
      email,
      password,
      name: name ?? null,
      phone: phone ?? null,
      locale: locale ?? null,
      role: role ?? undefined,
    });
    res.status(201).json(result);
  });

  router.post("/login", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(loginBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const result = await login.execute(validation.data);
    res.json(result);
  });

  router.post("/logout", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(logoutBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    await logout.execute(validation.data);
    res.status(204).send();
  });

  router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(refreshBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const result = await refreshTokens.execute(validation.data);
    res.json(result);
  });

  router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(forgotPasswordBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const result = await forgotPassword.execute(validation.data);
    res.json(result);
  });

  router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(resetPasswordBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const result = await resetPassword.execute(validation.data);
    if (!result.success) {
      res.status(400).json({ error: { code: "RESET_FAILED", message: result.message } });
      return;
    }
    res.json({ message: result.message });
  });

  return router;
}

/** Registers protected route GET /me. Must be mounted after authMiddleware. */
export function registerMeRoute(router: Router, getMe: GetMe): void {
  router.get("/me", async (req: Request, res: Response): Promise<void> => {
    const auth = res.locals.auth;
    if (!auth) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
      return;
    }
    const user = await getMe.execute(auth.userId);
    res.json(user);
  });
}
