import { ForbiddenError, NotFoundError } from "../../domain/errors/DomainErrors";
import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository";

export class ReleasePokemonUseCase {
    constructor(private readonly pokemons: IPokemonRepository) {}

    async execute(input: { trainerId: string; captureId: number }): Promise<void> {
        const capture = await this.pokemons.findById(input.captureId);
        if (!capture) {
            throw new NotFoundError("Captura não encontrada.");
        }

        // Só o dono autenticado pode soltar o próprio Pokémon.
        if (capture.trainerId !== input.trainerId) {
            throw new ForbiddenError("Você só pode soltar os seus próprios Pokémons.");
        }

        await this.pokemons.delete(capture.id);
    }
}
