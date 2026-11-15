import { RequestHandler, Response } from "express";
import { Role } from "../../../domain/entities/role";
import { ForbiddenError, UnauthorizedError } from "../../../domain/errors/DomainErrors";
import { ITokenService } from "../../../domain/services/ITokenService";

export interface AuthContext {
    trainerId: string;
    role: Role;
}

/** Valida o cabeçalho `Authorization: Bearer <token>` e guarda o treinador autenticado em res.locals.auth. */
export function authenticate(tokens: ITokenService): RequestHandler {
    return (req, res, next) => {
        const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? "");
        if (!match) {
            next(
                new UnauthorizedError(
                    "Envie o cabeçalho Authorization: Bearer <token>.",
                    "MISSING_TOKEN"
                )
            );
            return;
        }

        try {
            const { trainerId, role } = tokens.verifyAccessToken(match[1]);
            res.locals.auth = { trainerId, role } satisfies AuthContext;
            next();
        } catch (error) {
            next(error);
        }
    };
}

/** RBAC: só deixa passar quem tem um dos papéis informados. Deve vir depois de `authenticate`. */
export function authorize(...allowed: Role[]): RequestHandler {
    return (_req, res, next) => {
        const auth = res.locals.auth as AuthContext | undefined;
        if (!auth) {
            next(new UnauthorizedError("Não autenticado.", "MISSING_TOKEN"));
            return;
        }
        if (!allowed.includes(auth.role)) {
            next(new ForbiddenError("Seu papel não tem permissão para acessar este recurso."));
            return;
        }
        next();
    };
}

/** Lê o treinador autenticado dentro de um controller. */
export function getAuth(res: Response): AuthContext {
    const auth = res.locals.auth as AuthContext | undefined;
    if (!auth) {
        throw new UnauthorizedError("Não autenticado.", "MISSING_TOKEN");
    }
    return auth;
}
