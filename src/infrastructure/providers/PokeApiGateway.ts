import { ExternalServiceError, NotFoundError } from "../../domain/errors/DomainErrors";
import { IPokeApiGateway, PokeApiPokemonData } from "../../domain/gateways/IPokeApiGateway";

interface PokeApiResponse {
    id: number;
    name: string;
    types: { slot: number; type: { name: string } }[];
    stats: { base_stat: number; stat: { name: string } }[];
    sprites: {
        front_default: string | null;
        other?: { "official-artwork"?: { front_default: string | null } };
    };
}

export class PokeApiGateway implements IPokeApiGateway {
    constructor(
        private readonly baseUrl: string = process.env.POKEAPI_BASE_URL ?? "https://pokeapi.co/api/v2",
        private readonly timeoutMs: number = 8000
    ) {}

    async findByName(name: string): Promise<PokeApiPokemonData> {
        const url = `${this.baseUrl}/pokemon/${encodeURIComponent(name.trim().toLowerCase())}`;

        let response: Response;
        try {
            response = await fetch(url, {
                headers: { Accept: "application/json" },
                signal: AbortSignal.timeout(this.timeoutMs),
            });
        } catch {
            throw new ExternalServiceError("Não foi possível se comunicar com a PokéAPI.");
        }

        if (response.status === 404) {
            throw new NotFoundError(`Pokémon "${name}" não encontrado na PokéAPI.`);
        }
        if (!response.ok) {
            throw new ExternalServiceError(`A PokéAPI respondeu com status ${response.status}.`);
        }

        let data: PokeApiResponse;
        try {
            data = (await response.json()) as PokeApiResponse;
        } catch {
            throw new ExternalServiceError("Resposta inválida da PokéAPI.");
        }

        const stat = (statName: string): number =>
            data.stats.find(s => s.stat.name === statName)?.base_stat ?? 0;

        return {
            pokedexId: data.id,
            name: data.name,
            types: [...data.types].sort((a, b) => a.slot - b.slot).map(t => t.type.name),
            imageUrl:
                data.sprites.other?.["official-artwork"]?.front_default ??
                data.sprites.front_default ??
                null,
            hp: stat("hp"),
            attack: stat("attack"),
            defense: stat("defense"),
            specialAttack: stat("special-attack"),
            specialDefense: stat("special-defense"),
            speed: stat("speed"),
        };
    }
}
