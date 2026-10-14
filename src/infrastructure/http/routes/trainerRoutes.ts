import { Router } from "express";
import { TrainerController } from "../controllers/TrainerController";

export function createTrainerRoutes(controller: TrainerController): Router {
    const router = Router();
    router.post("/", controller.create);
    router.post("/:trainerId/captures", controller.capture);
    router.get("/:trainerId/team", controller.team);
    return router;
}
