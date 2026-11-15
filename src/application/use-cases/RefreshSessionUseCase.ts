import { UnauthorizedError } from "../../domain/errors/DomainErrors";
import { IRefreshTokenRepository } from "../../domain/repositories/IRefreshTokenRepository";
import { ITrainerRepository } from "../../domain/repositories/ITrainerRepository";
import { ITokenService } from "../../domain/services/ITokenService";
import { AuthSessionDTO } from "../dtos/TrainerDTO";
import { issueSession } from "./issueSession";

export class RefreshSessionUseCase {
    constructor(
        private readonly trainers: ITrainerRepository,
        private readonly tokens: ITokenService,
        private readonly refreshTokens: IRefreshTokenRepository
    ) {}

    async execute(input: { refreshToken: string }): Promise<AuthSessionDTO> {
        const stored = await this.refreshTokens.findByTokenHash(
            this.tokens.hashRefreshToken(input.refreshToken)
        );

        if (!stored) {
            throw new UnauthorizedError("Refresh token inválido.", "INVALID_REFRESH_TOKEN");
        }

        // Token já usado sendo apresentado de novo: pode ter sido roubado.
        // Revoga todas as sessões do treinador por segurança.
        if (stored.revokedAt) {
            await this.refreshTokens.revokeAllByTrainerId(stored.trainerId);
            throw new UnauthorizedError("Refresh token inválido.", "INVALID_REFRESH_TOKEN");
        }

        if (stored.expiresAt.getTime() <= Date.now()) {
            throw new UnauthorizedError("Refresh token expirado.", "REFRESH_TOKEN_EXPIRED");
        }

        const trainer = await this.trainers.findById(stored.trainerId);
        if (!trainer) {
            throw new UnauthorizedError("Refresh token inválido.", "INVALID_REFRESH_TOKEN");
        }

        // Rotação: cada refresh token só vale uma vez.
        await this.refreshTokens.revoke(stored.id);
        return issueSession(trainer, this.tokens, this.refreshTokens);
    }
}
