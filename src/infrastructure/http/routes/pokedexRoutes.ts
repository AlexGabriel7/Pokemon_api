import { Router } from "express";
import { PokedexController } from "../controllers/PokedexController";

export function createPokedexRoutes(controller: PokedexController): Router {
    const router = Router();
    router.get("/search", controller.search);
    return router;
}
