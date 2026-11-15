import { Trainer } from "../../domain/entities/trainer";
import { IRefreshTokenRepository } from "../../domain/repositories/IRefreshTokenRepository";
import { ITokenService } from "../../domain/services/ITokenService";
import { AuthSessionDTO, toTrainerDTO } from "../dtos/TrainerDTO";

/** Emite access token (JWT) + refresh token e guarda o hash do refresh no banco. */
export async function issueSession(
    trainer: Trainer,
    tokens: ITokenService,
    refreshTokens: IRefreshTokenRepository
): Promise<AuthSessionDTO> {
    const accessToken = tokens.signAccessToken({ trainerId: trainer.id, role: trainer.role });
    const refresh = tokens.generateRefreshToken();

    await refreshTokens.create({
        trainerId: trainer.id,
        tokenHash: refresh.tokenHash,
        expiresAt: refresh.expiresAt,
    });

    return {
        accessToken,
        refreshToken: refresh.token,
        tokenType: "Bearer",
        expiresIn: tokens.accessTokenExpiresInSeconds,
        trainer: toTrainerDTO(trainer),
    };
}
