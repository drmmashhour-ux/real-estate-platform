import express, { type Application } from "express";
import { PrismaClient } from "./generated/prisma/index.js";
import { config } from "./config.js";
import { BcryptPasswordHasher } from "./infrastructure/crypto/BcryptPasswordHasher.js";
import { JwtTokenService } from "./infrastructure/jwt/JwtTokenService.js";
import { PrismaUserRepository } from "./adapters/persistence/PrismaUserRepository.js";
import { PrismaSessionRepository } from "./adapters/persistence/PrismaSessionRepository.js";
import { RegisterUser } from "./use-cases/RegisterUser.js";
import { Login } from "./use-cases/Login.js";
import { Logout } from "./use-cases/Logout.js";
import { RefreshTokens } from "./use-cases/RefreshTokens.js";
import { GetMe } from "./use-cases/GetMe.js";
import { ForgotPassword } from "./use-cases/ForgotPassword.js";
import { ResetPassword } from "./use-cases/ResetPassword.js";
import { createAuthRouter, registerMeRoute } from "./adapters/http/routes/authRoutes.js";
import { authMiddleware } from "./adapters/http/authMiddleware.js";
import { errorHandler } from "./adapters/http/errorHandler.js";

const prisma = new PrismaClient();
const userRepo = new PrismaUserRepository(prisma);
const sessionRepo = new PrismaSessionRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService({
  accessSecret: config.jwt.accessSecret,
  refreshSecret: config.jwt.refreshSecret,
  accessExpiresIn: config.jwt.accessExpiresIn,
  refreshExpiresIn: config.jwt.refreshExpiresIn,
});

const registerUser = new RegisterUser(
  userRepo,
  passwordHasher,
  tokenService,
  sessionRepo,
  config.accessExpiresInSeconds,
  config.refreshExpiresInSeconds
);
const login = new Login(
  userRepo,
  passwordHasher,
  tokenService,
  sessionRepo,
  config.accessExpiresInSeconds,
  config.refreshExpiresInSeconds
);
const logout = new Logout(sessionRepo);
const refreshTokens = new RefreshTokens(
  userRepo,
  tokenService,
  sessionRepo,
  config.accessExpiresInSeconds,
  config.refreshExpiresInSeconds
);
const getMe = new GetMe(userRepo);
const forgotPassword = new ForgotPassword(userRepo, prisma);
const resetPassword = new ResetPassword(userRepo, passwordHasher, prisma);

const app: Application = express();
app.use(express.json());

const authRouter = createAuthRouter(registerUser, login, logout, refreshTokens, getMe, forgotPassword, resetPassword);
app.use("/v1/auth", authRouter);

const protectedRouter = express.Router();
protectedRouter.use(authMiddleware(tokenService));
registerMeRoute(protectedRouter, getMe);
app.use("/v1/auth", protectedRouter);

app.use(errorHandler);

export { app };
