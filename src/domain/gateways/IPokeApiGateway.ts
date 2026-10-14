import { PokemonStats } from "../entities/pokemon";

export interface PokeApiPokemonData extends PokemonStats {
    pokedexId: number;
    name: string;
    types: string[];
    imageUrl: string | null;
}

export interface IPokeApiGateway {
    /**
     * Busca um Pokémon na PokéAPI pelo nome.
     * Lança NotFoundError se não existir e ExternalServiceError se a API falhar.
     */
    findByName(name: string): Promise<PokeApiPokemonData>;
}
