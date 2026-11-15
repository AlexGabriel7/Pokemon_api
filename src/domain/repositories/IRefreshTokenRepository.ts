import { RefreshToken } from "../entities/refreshToken";

export interface IRefreshTokenRepository {
    create(data: { trainerId: string; tokenHash: string; expiresAt: Date }): Promise<RefreshToken>;
    findByTokenHash(tokenHash: string): Promise<RefreshToken | undefined>;
    revoke(id: string): Promise<void>;
    revokeAllByTrainerId(trainerId: string): Promise<void>;
}
