import { RequestHandler, Router } from "express";
import { AuthController } from "../controllers/AuthController";

export function createAuthRoutes(controller: AuthController, authRateLimiter: RequestHandler): Router {
    const router = Router();
    router.use(authRateLimiter); // brute force: limite rígido nas rotas de autenticação
    router.post("/register", controller.register);
    router.post("/login", controller.signIn);
    router.post("/refresh", controller.refreshSession);
    return router;
}
