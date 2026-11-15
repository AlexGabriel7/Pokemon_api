import { NewPokemonProps, Pokemon } from "../../domain/entities/pokemon";
import { RefreshToken } from "../../domain/entities/refreshToken";
import { Role } from "../../domain/entities/role";
import { Trainer } from "../../domain/entities/trainer";
import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository";
import { IRefreshTokenRepository } from "../../domain/repositories/IRefreshTokenRepository";
import { ITrainerRepository, NewTrainerData } from "../../domain/repositories/ITrainerRepository";

/** Implementações em memória, usadas nos testes (a aplicação usa as versões Prisma). */
export class InMemoryPokemonRepository implements IPokemonRepository {
    private pokemons: Pokemon[] = [];
    private nextId = 1;

    async findAll(type?: string): Promise<Pokemon[]> {
        if (!type) return [...this.pokemons];
        const wanted = type.toLowerCase();
        return this.pokemons.filter(p => p.types.includes(wanted));
    }

    async findById(id: number): Promise<Pokemon | undefined> {
        return this.pokemons.find(p => p.id === id);
    }

    async create(data: NewPokemonProps): Promise<Pokemon> {
        const pokemon = new Pokemon({
            ...data,
            id: this.nextId++,
            active: data.active ?? true,
            capturedAt: new Date(),
        });
        this.pokemons.push(pokemon);
        return pokemon;
    }

    async delete(id: number): Promise<void> {
        this.pokemons = this.pokemons.filter(p => p.id !== id);
    }

    async findActiveByTrainerId(trainerId: string): Promise<Pokemon[]> {
        return this.pokemons.filter(p => p.trainerId === trainerId && p.active);
    }

    async countActiveByTrainerId(trainerId: string): Promise<number> {
        return (await this.findActiveByTrainerId(trainerId)).length;
    }
}

export class InMemoryTrainerRepository implements ITrainerRepository {
    private trainers: Trainer[] = [];

    async create(data: NewTrainerData): Promise<Trainer> {
        const trainer = new Trainer({
            id: crypto.randomUUID(),
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role ?? "TRAINER",
            createdAt: new Date(),
        });
        this.trainers.push(trainer);
        return trainer;
    }

    async findById(id: string): Promise<Trainer | undefined> {
        return this.trainers.find(t => t.id === id);
    }

    async findByEmail(email: string): Promise<Trainer | undefined> {
        return this.trainers.find(t => t.email === email);
    }

    async updateRole(id: string, role: Role): Promise<Trainer> {
        const trainer = this.trainers.find(t => t.id === id);
        if (!trainer) throw new Error("trainer not found");
        trainer.role = role;
        return trainer;
    }
}

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
    private tokens: RefreshToken[] = [];

    async create(data: { trainerId: string; tokenHash: string; expiresAt: Date }): Promise<RefreshToken> {
        const token = new RefreshToken({
            id: crypto.randomUUID(),
            ...data,
            revokedAt: null,
            createdAt: new Date(),
        });
        this.tokens.push(token);
        return token;
    }

    async findByTokenHash(tokenHash: string): Promise<RefreshToken | undefined> {
        return this.tokens.find(t => t.tokenHash === tokenHash);
    }

    async revoke(id: string): Promise<void> {
        const token = this.tokens.find(t => t.id === id);
        if (token) token.revokedAt = new Date();
    }

    async revokeAllByTrainerId(trainerId: string): Promise<void> {
        for (const token of this.tokens) {
            if (token.trainerId === trainerId && !token.revokedAt) token.revokedAt = new Date();
        }
    }
}
