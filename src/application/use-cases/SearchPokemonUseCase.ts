import { IPokeApiGateway } from "../../domain/gateways/IPokeApiGateway";
import { PokemonDTO, toPokemonDTO } from "../dtos/PokemonDTO";

export class SearchPokemonUseCase {
    constructor(private readonly pokeApi: IPokeApiGateway) {}

    async execute(name: string): Promise<PokemonDTO> {
        const data = await this.pokeApi.findByName(name);
        return toPokemonDTO(data);
    }
}
