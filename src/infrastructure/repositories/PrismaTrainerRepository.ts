import { Prisma, PrismaClient, Trainer as TrainerRow } from "@prisma/client";
import { Role, isRole } from "../../domain/entities/role";
import { Trainer } from "../../domain/entities/trainer";
import { ConflictError } from "../../domain/errors/DomainErrors";
import { ITrainerRepository, NewTrainerData } from "../../domain/repositories/ITrainerRepository";

function toDomain(row: TrainerRow): Trainer {
    return new Trainer({
        ...row,
        role: isRole(row.role) ? row.role : "TRAINER",
    });
}

export class PrismaTrainerRepository implements ITrainerRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(data: NewTrainerData): Promise<Trainer> {
        try {
            const row = await this.prisma.trainer.create({
                data: {
                    name: data.name,
                    email: data.email,
                    passwordHash: data.passwordHash,
                    role: data.role ?? "TRAINER",
                },
            });
            return toDomain(row);
        } catch (error) {
            // P2002 = violação de unicidade (e-mail repetido, mesmo em corrida de requisições)
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new ConflictError("Este e-mail já está cadastrado.", "EMAIL_ALREADY_REGISTERED");
            }
            throw error;
        }
    }

    async findById(id: string): Promise<Trainer | undefined> {
        const row = await this.prisma.trainer.findUnique({ where: { id } });
        return row ? toDomain(row) : undefined;
    }

    async findByEmail(email: string): Promise<Trainer | undefined> {
        const row = await this.prisma.trainer.findUnique({ where: { email } });
        return row ? toDomain(row) : undefined;
    }

    async updateRole(id: string, role: Role): Promise<Trainer> {
        const row = await this.prisma.trainer.update({ where: { id }, data: { role } });
        return toDomain(row);
    }
}
