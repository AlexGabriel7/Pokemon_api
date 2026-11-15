import { createHash, randomBytes } from "node:crypto";
import { TokenExpiredError, sign, verify } from "jsonwebtoken";
import { isRole } from "../../domain/entities/role";
import { UnauthorizedError } from "../../domain/errors/DomainErrors";
import {
    AccessTokenPayload,
    GeneratedRefreshToken,
    ITokenService,
} from "../../domain/services/ITokenService";

export interface JwtTokenServiceConfig {
    accessSecret: string;
    accessExpiresInSeconds: number;
    refreshExpiresInSeconds: number;
}

/**
 * Access token: JWT assinado (HS256) de vida curta, com o id do treinador em `sub` e o papel em `role`.
 * Refresh token: string aleatória opaca; no banco fica apenas o hash SHA-256.
 */
export class JwtTokenService implements ITokenService {
    constructor(private readonly config: JwtTokenServiceConfig) {}

    get accessTokenExpiresInSeconds(): number {
        return this.config.accessExpiresInSeconds;
    }

    signAccessToken(payload: AccessTokenPayload): string {
        return sign({ role: payload.role }, this.config.accessSecret, {
            algorithm: "HS256",
            subject: payload.trainerId,
            expiresIn: this.config.accessExpiresInSeconds,
        });
    }

    verifyAccessToken(token: string): AccessTokenPayload {
        try {
            // Fixar o algoritmo impede ataques de troca de algoritmo (ex.: "none").
            const decoded = verify(token, this.config.accessSecret, { algorithms: ["HS256"] });
            if (typeof decoded === "string" || !decoded.sub || !isRole(decoded.role)) {
                throw new UnauthorizedError("Token inválido.", "INVALID_TOKEN");
            }
            return { trainerId: decoded.sub, role: decoded.role };
        } catch (error) {
            if (error instanceof UnauthorizedError) throw error;
            if (error instanceof TokenExpiredError) {
                throw new UnauthorizedError("Token expirado.", "TOKEN_EXPIRED");
            }
            throw new UnauthorizedError("Token inválido.", "INVALID_TOKEN");
        }
    }

    generateRefreshToken(): GeneratedRefreshToken {
        const token = randomBytes(48).toString("hex");
        return {
            token,
            tokenHash: this.hashRefreshToken(token),
            expiresAt: new Date(Date.now() + this.config.refreshExpiresInSeconds * 1000),
        };
    }

    hashRefreshToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }
}
