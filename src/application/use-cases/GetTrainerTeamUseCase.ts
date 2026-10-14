import { NotFoundError } from "../../domain/errors/DomainErrors";
import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository";
import { ITrainerRepository } from "../../domain/repositories/ITrainerRepository";
import { CapturedPokemonDTO, toCapturedPokemonDTO } from "../dtos/PokemonDTO";

export interface TrainerTeamDTO {
    trainer: { id: string; name: string };
    team: CapturedPokemonDTO[];
}

export class GetTrainerTeamUseCase {
    constructor(
        private readonly trainers: ITrainerRepository,
        private readonly pokemons: IPokemonRepository
    ) {}

    async execute(trainerId: string): Promise<TrainerTeamDTO> {
        const trainer = await this.trainers.findById(trainerId);
        if (!trainer) {
            throw new NotFoundError("Treinador não encontrado.");
        }

        const team = await this.pokemons.findActiveByTrainerId(trainer.id);
        return {
            trainer: { id: trainer.id, name: trainer.name },
            team: team.map(toCapturedPokemonDTO),
        };
    }
}
