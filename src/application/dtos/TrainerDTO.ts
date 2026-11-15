import { Role } from "../../domain/entities/role";
import { Trainer } from "../../domain/entities/trainer";

/**
 * Único formato em que um treinador sai da API.
 * É uma lista branca: passwordHash e qualquer campo novo não vazam por acidente.
 */
export interface TrainerDTO {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
}

export function toTrainerDTO(trainer: Trainer): TrainerDTO {
    return {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        createdAt: trainer.createdAt,
    };
}

export interface AuthSessionDTO {
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    /** Validade do access token, em segundos. */
    expiresIn: number;
    trainer: TrainerDTO;
}
