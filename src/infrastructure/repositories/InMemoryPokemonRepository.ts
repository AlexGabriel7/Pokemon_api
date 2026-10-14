import { NewPokemonProps, Pokemon } from "../../domain/entities/pokemon";
import { Trainer } from "../../domain/entities/trainer";
import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository";
import { ITrainerRepository } from "../../domain/repositories/ITrainerRepository";

/** Implementação em memória, útil para testes (não é mais usada pela aplicação). */
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

    async findActiveByTrainerId(trainerId: string): Promise<Pokemon[]> {
        return this.pokemons.filter(p => p.trainerId === trainerId && p.active);
    }

    async countActiveByTrainerId(trainerId: string): Promise<number> {
        return (await this.findActiveByTrainerId(trainerId)).length;
    }
}

export class InMemoryTrainerRepository implements ITrainerRepository {
    private trainers: Trainer[] = [];

    async create(data: { name: string }): Promise<Trainer> {
        const trainer = new Trainer({
            id: crypto.randomUUID(),
            name: data.name,
            createdAt: new Date(),
        });
        this.trainers.push(trainer);
        return trainer;
    }

    async findById(id: string): Promise<Trainer | undefined> {
        return this.trainers.find(t => t.id === id);
    }
}
