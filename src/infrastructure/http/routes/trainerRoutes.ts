import { RequestHandler, Router } from "express";
import { TrainerController } from "../controllers/TrainerController";
import { authorize } from "../middlewares/authMiddleware";

export function createTrainerRoutes(
    controller: TrainerController,
    authenticate: RequestHandler
): Router {
    const router = Router();
    router.get("/:trainerId/team", controller.team);
    // RBAC: apenas GYM_LEADER ou ADMIN
    router.patch("/:id/role", authenticate, authorize("GYM_LEADER", "ADMIN"), controller.updateRole);
    return router;
}
