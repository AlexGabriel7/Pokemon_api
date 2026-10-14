import { PrismaClient } from "@prisma/client";
import { Trainer } from "../../domain/entities/trainer";
import { ITrainerRepository } from "../../domain/repositories/ITrainerRepository";

export class PrismaTrainerRepository implements ITrainerRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(data: { name: string }): Promise<Trainer> {
        const row = await this.prisma.trainer.create({ data: { name: data.name } });
        return new Trainer(row);
    }

    async findById(id: string): Promise<Trainer | undefined> {
        const row = await this.prisma.trainer.findUnique({ where: { id } });
        return row ? new Trainer(row) : undefined;
    }
}
