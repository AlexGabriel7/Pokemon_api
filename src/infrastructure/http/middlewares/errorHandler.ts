import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../../../domain/errors/AppError";
import { NotFoundError } from "../../../domain/errors/DomainErrors";

/** Rotas inexistentes viram um NotFoundError e caem no errorHandler. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
    next(new NotFoundError(`Rota ${req.method} ${req.originalUrl} não encontrada.`));
};

/** Middleware global de erros: deve ser o último registrado no app. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Dados da requisição inválidos.",
                details: err.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            },
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: { code: err.code, message: err.message, details: err.details },
        });
        return;
    }

    // JSON malformado no body (erro do express.json())
    if (err?.type === "entity.parse.failed") {
        res.status(400).json({
            error: { code: "INVALID_JSON", message: "O corpo da requisição não é um JSON válido." },
        });
        return;
    }

    console.error(err);
    res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Erro interno do servidor." },
    });
};
