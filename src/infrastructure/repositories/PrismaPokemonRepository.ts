import { Pokemon as PokemonRow, PrismaClient } from "@prisma/client";
import { NewPokemonProps, Pokemon } from "../../domain/entities/pokemon";
import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository";

function toDomain(row: PokemonRow): Pokemon {
    return new Pokemon({
        ...row,
        types: row.types ? row.types.split(",") : [],
    });
}

export class PrismaPokemonRepository implements IPokemonRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findAll(type?: string): Promise<Pokemon[]> {
        const rows = await this.prisma.pokemon.findMany({
            where: type ? { types: { contains: type.toLowerCase() } } : undefined,
            orderBy: { capturedAt: "asc" },
        });
        return rows.map(toDomain);
    }

    async findById(id: number): Promise<Pokemon | undefined> {
        const row = await this.prisma.pokemon.findUnique({ where: { id } });
        return row ? toDomain(row) : undefined;
    }

    async create(pokemon: NewPokemonProps): Promise<Pokemon> {
        const row = await this.prisma.pokemon.create({
            data: {
                ...pokemon,
                types: pokemon.types.join(","),
                active: pokemon.active ?? true,
            },
        });
        return toDomain(row);
    }

    async findActiveByTrainerId(trainerId: string): Promise<Pokemon[]> {
        const rows = await this.prisma.pokemon.findMany({
            where: { trainerId, active: true },
            orderBy: { capturedAt: "asc" },
        });
        return rows.map(toDomain);
    }

    async countActiveByTrainerId(trainerId: string): Promise<number> {
        return this.prisma.pokemon.count({ where: { trainerId, active: true } });
    }
}
