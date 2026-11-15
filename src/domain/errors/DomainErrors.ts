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

export class UnauthorizedError extends AppError {
    constructor(message = "Não autenticado.", code = "UNAUTHORIZED") {
        super(message, 401, code);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Você não tem permissão para realizar esta ação.") {
        super(message, 403, "FORBIDDEN");
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflito com o estado atual do recurso.", code = "CONFLICT") {
        super(message, 409, code);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = "Muitas requisições. Tente novamente mais tarde.") {
        super(message, 429, "TOO_MANY_REQUESTS");
    }
}
