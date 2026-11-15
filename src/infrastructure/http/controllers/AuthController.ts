import { Request, Response } from "express";
import { LoginUseCase } from "../../../application/use-cases/LoginUseCase";
import { RefreshSessionUseCase } from "../../../application/use-cases/RefreshSessionUseCase";
import { RegisterTrainerUseCase } from "../../../application/use-cases/RegisterTrainerUseCase";
import { loginBodySchema, refreshBodySchema, registerBodySchema } from "../schemas/schemas";

export class AuthController {
    constructor(
        private readonly registerTrainer: RegisterTrainerUseCase,
        private readonly login: LoginUseCase,
        private readonly refresh: RefreshSessionUseCase
    ) {}

    register = async (req: Request, res: Response): Promise<void> => {
        const body = registerBodySchema.parse(req.body);
        const trainer = await this.registerTrainer.execute(body);
        res.status(201).json(trainer);
    };

    signIn = async (req: Request, res: Response): Promise<void> => {
        const body = loginBodySchema.parse(req.body);
        const session = await this.login.execute(body);
        res.status(200).json(session);
    };

    refreshSession = async (req: Request, res: Response): Promise<void> => {
        const body = refreshBodySchema.parse(req.body);
        const session = await this.refresh.execute(body);
        res.status(200).json(session);
    };
}
