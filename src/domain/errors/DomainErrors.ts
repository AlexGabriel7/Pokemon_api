import { AppError } from "./AppError";

export class NotFoundError extends AppError {
    constructor(message = "Recurso não encontrado.") {
        super(message, 404, "NOT_FOUND");
    }
}

export class TeamFullError extends AppError {
    constructor(maxSize: number) {
        super(
            `O treinador já possui ${maxSize} Pokémons no time ativo.`,
            409,
            "TEAM_FULL"
        );
    }
}

export class ExternalServiceError extends AppError {
    constructor(message = "Falha ao se comunicar com o serviço externo.") {
        super(message, 502, "EXTERNAL_SERVICE_ERROR");
    }
}
