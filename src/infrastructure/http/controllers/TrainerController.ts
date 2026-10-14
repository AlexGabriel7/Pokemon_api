import { Request, Response } from "express";
import { CapturePokemonUseCase } from "../../../application/use-cases/CapturePokemonUseCase";
import { CreateTrainerUseCase } from "../../../application/use-cases/CreateTrainerUseCase";
import { GetTrainerTeamUseCase } from "../../../application/use-cases/GetTrainerTeamUseCase";
import {
    capturePokemonBodySchema,
    createTrainerBodySchema,
    trainerParamsSchema,
} from "../schemas/schemas";

export class TrainerController {
    constructor(
        private readonly createTrainer: CreateTrainerUseCase,
        private readonly capturePokemon: CapturePokemonUseCase,
        private readonly getTeam: GetTrainerTeamUseCase
    ) {}

    create = async (req: Request, res: Response): Promise<void> => {
        const body = createTrainerBodySchema.parse(req.body);
        const trainer = await this.createTrainer.execute(body);
        res.status(201).json(trainer);
    };

    capture = async (req: Request, res: Response): Promise<void> => {
        const { trainerId } = trainerParamsSchema.parse(req.params);
        const { pokemonName } = capturePokemonBodySchema.parse(req.body);
        const captured = await this.capturePokemon.execute({ trainerId, pokemonName });
        res.status(201).json(captured);
    };

    team = async (req: Request, res: Response): Promise<void> => {
        const { trainerId } = trainerParamsSchema.parse(req.params);
        const team = await this.getTeam.execute(trainerId);
        res.status(200).json(team);
    };
}
