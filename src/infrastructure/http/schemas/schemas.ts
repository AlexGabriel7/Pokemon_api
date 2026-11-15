import { z } from "zod";
import { ROLES } from "../../../domain/entities/role";

export const searchPokemonQuerySchema = z.object({
    name: z
        .string({ required_error: "O parâmetro 'name' é obrigatório." })
        .trim()
        .min(1, "O parâmetro 'name' não pode ser vazio.")
        .transform(value => value.toLowerCase()),
});

// ---------- Autenticação ----------

const emailSchema = z
    .string({ required_error: "O campo 'email' é obrigatório." })
    .trim()
    .toLowerCase()
    .email("E-mail inválido.")
    .max(254, "E-mail muito longo.");

export const registerBodySchema = z.object({
    name: z
        .string({ required_error: "O campo 'name' é obrigatório." })
        .trim()
        .min(2, "O nome deve ter pelo menos 2 caracteres.")
        .max(60, "O nome deve ter no máximo 60 caracteres."),
    email: emailSchema,
    // bcrypt só considera os primeiros 72 bytes, por isso o limite de 72.
    password: z
        .string({ required_error: "O campo 'password' é obrigatório." })
        .min(8, "A senha deve ter pelo menos 8 caracteres.")
        .max(72, "A senha deve ter no máximo 72 caracteres.")
        .regex(/[A-Za-z]/, "A senha deve conter pelo menos uma letra.")
        .regex(/\d/, "A senha deve conter pelo menos um número."),
});

export const loginBodySchema = z.object({
    email: emailSchema,
    password: z
        .string({ required_error: "O campo 'password' é obrigatório." })
        .min(1, "O campo 'password' não pode ser vazio.")
        .max(72, "Senha inválida."),
});

export const refreshBodySchema = z.object({
    refreshToken: z
        .string({ required_error: "O campo 'refreshToken' é obrigatório." })
        .min(1, "O campo 'refreshToken' não pode ser vazio."),
});

// ---------- Treinadores / time ----------

export const trainerTeamParamsSchema = z.object({
    trainerId: z.string().uuid("trainerId deve ser um UUID válido."),
});

export const trainerIdParamsSchema = z.object({
    id: z.string().uuid("id deve ser um UUID válido."),
});

export const catchPokemonBodySchema = z.object({
    pokemonName: z
        .string({ required_error: "O campo 'pokemonName' é obrigatório." })
        .trim()
        .min(1, "O campo 'pokemonName' não pode ser vazio.")
        .transform(value => value.toLowerCase()),
});

export const captureIdParamsSchema = z.object({
    captureId: z.coerce
        .number({ invalid_type_error: "captureId deve ser um número." })
        .int("captureId deve ser um número inteiro.")
        .positive("captureId deve ser positivo."),
});

export const changeRoleBodySchema = z.object({
    role: z.enum(ROLES, {
        errorMap: () => ({ message: `role deve ser um destes valores: ${ROLES.join(", ")}.` }),
    }),
});
