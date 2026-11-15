import { RequestHandler, Router } from "express";
import { MeController } from "../controllers/MeController";

export function createMeRoutes(controller: MeController, authenticate: RequestHandler): Router {
    const router = Router();
    router.use(authenticate); // tudo em /me exige JWT válido
    router.get("/team", controller.team);
    router.post("/team/catch", controller.catchPokemon);
    router.delete("/team/:captureId", controller.release);
    return router;
}
