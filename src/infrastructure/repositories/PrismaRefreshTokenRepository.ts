import { PrismaClient } from "@prisma/client";
import { RefreshToken } from "../../domain/entities/refreshToken";
import { IRefreshTokenRepository } from "../../domain/repositories/IRefreshTokenRepository";

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(data: { trainerId: string; tokenHash: string; expiresAt: Date }): Promise<RefreshToken> {
        const row = await this.prisma.refreshToken.create({ data });
        return new RefreshToken(row);
    }

    async findByTokenHash(tokenHash: string): Promise<RefreshToken | undefined> {
        const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
        return row ? new RefreshToken(row) : undefined;
    }

    async revoke(id: string): Promise<void> {
        await this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
    }

    async revokeAllByTrainerId(trainerId: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: { trainerId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
}
