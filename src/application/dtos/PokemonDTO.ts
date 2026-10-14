import { PokemonStats, Pokemon } from "../../domain/entities/pokemon";
import { PokeApiPokemonData } from "../../domain/gateways/IPokeApiGateway";

export interface PokemonDTO {
    id: number;
    name: string;
    imageUrl: string | null;
    types: string[];
    stats: PokemonStats;
}

export interface CapturedPokemonDTO extends PokemonDTO {
    captureId: number;
    capturedAt: Date;
}

export function toPokemonDTO(data: PokeApiPokemonData): PokemonDTO {
    return {
        id: data.pokedexId,
        name: data.name,
        imageUrl: data.imageUrl,
        types: data.types,
        stats: {
            hp: data.hp,
            attack: data.attack,
            defense: data.defense,
            specialAttack: data.specialAttack,
            specialDefense: data.specialDefense,
            speed: data.speed,
        },
    };
}

export function toCapturedPokemonDTO(pokemon: Pokemon): CapturedPokemonDTO {
    return {
        captureId: pokemon.id,
        id: pokemon.pokedexId,
        name: pokemon.name,
        imageUrl: pokemon.imageUrl,
        types: pokemon.types,
        stats: {
            hp: pokemon.hp,
            attack: pokemon.attack,
            defense: pokemon.defense,
            specialAttack: pokemon.specialAttack,
            specialDefense: pokemon.specialDefense,
            speed: pokemon.speed,
        },
        capturedAt: pokemon.capturedAt,
    };
}
