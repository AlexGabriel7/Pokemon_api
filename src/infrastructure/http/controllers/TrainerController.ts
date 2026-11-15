import { Request, Response } from "express";
import { ChangeTrainerRoleUseCase } from "../../../application/use-cases/ChangeTrainerRoleUseCase";
import { GetTrainerTeamUseCase } from "../../../application/use-cases/GetTrainerTeamUseCase";
import { getAuth } from "../middlewares/authMiddleware";
import {
    changeRoleBodySchema,
    trainerIdParamsSchema,
    trainerTeamParamsSchema,
} from "../schemas/schemas";

export class TrainerController {
    constructor(
        private readonly getTeam: GetTrainerTeamUseCase,
        private readonly changeRole: ChangeTrainerRoleUseCase
    ) {}

    team = async (req: Request, res: Response): Promise<void> => {
        const { trainerId } = trainerTeamParamsSchema.parse(req.params);
        res.status(200).json(await this.getTeam.execute(trainerId));
    };

    updateRole = async (req: Request, res: Response): Promise<void> => {
        const { role: actorRole } = getAuth(res);
        const { id } = trainerIdParamsSchema.parse(req.params);
        const { role } = changeRoleBodySchema.parse(req.body);
        const updated = await this.changeRole.execute({ actorRole, targetId: id, newRole: role });
        res.status(200).json(updated);
    };
}
