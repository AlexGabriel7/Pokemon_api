import { NewPokemonProps, Pokemon } from "../entities/pokemon";

export interface IPokemonRepository {
    findAll(type?: string): Promise<Pokemon[]>;
    findById(id: number): Promise<Pokemon | undefined>;
    create(pokemon: NewPokemonProps): Promise<Pokemon>;
    delete(id: number): Promise<void>;
    findActiveByTrainerId(trainerId: string): Promise<Pokemon[]>;
    countActiveByTrainerId(trainerId: string): Promise<number>;
}
