import { z } from "zod";

export const searchPokemonQuerySchema = z.object({
    name: z
        .string({ required_error: "O parâmetro 'name' é obrigatório." })
        .trim()
        .min(1, "O parâmetro 'name' não pode ser vazio.")
        .transform(value => value.toLowerCase()),
});

export const createTrainerBodySchema = z.object({
    name: z
        .string({ required_error: "O campo 'name' é obrigatório." })
        .trim()
        .min(2, "O nome deve ter pelo menos 2 caracteres.")
        .max(60, "O nome deve ter no máximo 60 caracteres."),
});

export const trainerParamsSchema = z.object({
    trainerId: z.string().uuid("trainerId deve ser um UUID válido."),
});

export const capturePokemonBodySchema = z.object({
    pokemonName: z
        .string({ required_error: "O campo 'pokemonName' é obrigatório." })
        .trim()
        .min(1, "O campo 'pokemonName' não pode ser vazio.")
        .transform(value => value.toLowerCase()),
});
