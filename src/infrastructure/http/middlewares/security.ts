import cors from "cors";
import { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { TooManyRequestsError } from "../../../domain/errors/DomainErrors";

export interface SecurityConfig {
    corsOrigins: string[];
    rateLimitWindowMs: number;
    rateLimitMax: number;
    authRateLimitMax: number;
}

export interface SecurityMiddlewares {
    helmet: RequestHandler;
    cors: RequestHandler;
    /** Limite geral para toda a API. */
    globalRateLimiter: RequestHandler;
    /** Limite mais rígido para register/login/refresh (prevenção de brute force). */
    authRateLimiter: RequestHandler;
}

export function createSecurityMiddlewares(config: SecurityConfig): SecurityMiddlewares {
    // Devolve o erro no formato padrão da API (passa pelo errorHandler).
    const handler: RequestHandler = (_req, _res, next) => next(new TooManyRequestsError());

    return {
        // Cabeçalhos HTTP de segurança (CSP, HSTS, X-Content-Type-Options, sem X-Powered-By...)
        helmet: helmet(),

        cors: cors({
            origin: config.corsOrigins.includes("*") ? "*" : config.corsOrigins,
            methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            maxAge: 600,
        }),

        globalRateLimiter: rateLimit({
            windowMs: config.rateLimitWindowMs,
            limit: config.rateLimitMax,
            standardHeaders: "draft-7",
            legacyHeaders: false,
            handler,
        }),

        authRateLimiter: rateLimit({
            windowMs: config.rateLimitWindowMs,
            limit: config.authRateLimitMax,
            standardHeaders: "draft-7",
            legacyHeaders: false,
            // Só conta tentativas que falharam (status >= 400): logins corretos não gastam a cota.
            skipSuccessfulRequests: true,
            handler,
        }),
    };
}
