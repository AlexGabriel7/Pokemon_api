import { Request, Response } from "express";
import { SearchPokemonUseCase } from "../../../application/use-cases/SearchPokemonUseCase";
import { searchPokemonQuerySchema } from "../schemas/schemas";

export class PokedexController {
    constructor(private readonly searchPokemon: SearchPokemonUseCase) {}

    search = async (req: Request, res: Response): Promise<void> => {
        const { name } = searchPokemonQuerySchema.parse(req.query);
        const pokemon = await this.searchPokemon.execute(name);
        res.status(200).json(pokemon);
    };
}
