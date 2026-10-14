import { NotFoundError, TeamFullError } from "../../domain/errors/DomainErrors";
import { IPokeApiGateway } from "../../domain/gateways/IPokeApiGateway";
import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository";
import { ITrainerRepository } from "../../domain/repositories/ITrainerRepository";
import { CapturedPokemonDTO, toCapturedPokemonDTO } from "../dtos/PokemonDTO";

export const MAX_ACTIVE_TEAM_SIZE = 6;

export interface CapturePokemonInput {
    trainerId: string;
    pokemonName: string;
}

export class CapturePokemonUseCase {
    constructor(
        private readonly trainers: ITrainerRepository,
        private readonly pokemons: IPokemonRepository,
        private readonly pokeApi: IPokeApiGateway
    ) {}

    async execute(input: CapturePokemonInput): Promise<CapturedPokemonDTO> {
        const trainer = await this.trainers.findById(input.trainerId);
        if (!trainer) {
            throw new NotFoundError("Treinador não encontrado.");
        }

        // Regra de negócio: no máximo 6 Pokémons no time ativo.
        const activeCount = await this.pokemons.countActiveByTrainerId(trainer.id);
        if (activeCount >= MAX_ACTIVE_TEAM_SIZE) {
            throw new TeamFullError(MAX_ACTIVE_TEAM_SIZE);
        }

        // Imagem, atributos base e tipos vêm da PokéAPI oficial.
        const data = await this.pokeApi.findByName(input.pokemonName);

        const captured = await this.pokemons.create({
            pokedexId: data.pokedexId,
            name: data.name,
            types: data.types,
            imageUrl: data.imageUrl,
            hp: data.hp,
            attack: data.attack,
            defense: data.defense,
            specialAttack: data.specialAttack,
            specialDefense: data.specialDefense,
            speed: data.speed,
            trainerId: trainer.id,
            active: true,
        });

        return toCapturedPokemonDTO(captured);
    }
}
