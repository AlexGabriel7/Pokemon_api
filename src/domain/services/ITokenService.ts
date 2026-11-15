import { Role } from "../entities/role";

export interface AccessTokenPayload {
    trainerId: string;
    role: Role;
}

export interface GeneratedRefreshToken {
    /** Valor entregue ao cliente (aparece só uma vez). */
    token: string;
    /** Hash que vai para o banco. */
    tokenHash: string;
    expiresAt: Date;
}

export interface ITokenService {
    readonly accessTokenExpiresInSeconds: number;
    signAccessToken(payload: AccessTokenPayload): string;
    /** Lança UnauthorizedError se o token for inválido ou estiver expirado. */
    verifyAccessToken(token: string): AccessTokenPayload;
    generateRefreshToken(): GeneratedRefreshToken;
    hashRefreshToken(token: string): string;
}
