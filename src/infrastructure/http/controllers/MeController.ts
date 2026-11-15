import { Request, Response } from "express";
import { CapturePokemonUseCase } from "../../../application/use-cases/CapturePokemonUseCase";
import { GetTrainerTeamUseCase } from "../../../application/use-cases/GetTrainerTeamUseCase";
import { ReleasePokemonUseCase } from "../../../application/use-cases/ReleasePokemonUseCase";
import { getAuth } from "../middlewares/authMiddleware";
import { captureIdParamsSchema, catchPokemonBodySchema } from "../schemas/schemas";

/** Rotas do treinador autenticado: o id vem sempre do token, nunca da URL ou do body. */
export class MeController {
    constructor(
        private readonly capturePokemon: CapturePokemonUseCase,
        private readonly releasePokemon: ReleasePokemonUseCase,
        private readonly getTeam: GetTrainerTeamUseCase
    ) {}

    team = async (_req: Request, res: Response): Promise<void> => {
        const { trainerId } = getAuth(res);
        res.status(200).json(await this.getTeam.execute(trainerId));
    };

    catchPokemon = async (req: Request, res: Response): Promise<void> => {
        const { trainerId } = getAuth(res);
        const { pokemonName } = catchPokemonBodySchema.parse(req.body);
        const captured = await this.capturePokemon.execute({ trainerId, pokemonName });
        res.status(201).json(captured);
    };

    release = async (req: Request, res: Response): Promise<void> => {
        const { trainerId } = getAuth(res);
        const { captureId } = captureIdParamsSchema.parse(req.params);
        await this.releasePokemon.execute({ trainerId, captureId });
        res.status(204).send();
    };
}
