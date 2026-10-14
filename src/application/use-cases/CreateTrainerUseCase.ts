import { Trainer } from "../../domain/entities/trainer";
import { ITrainerRepository } from "../../domain/repositories/ITrainerRepository";

export class CreateTrainerUseCase {
    constructor(private readonly trainers: ITrainerRepository) {}

    async execute(input: { name: string }): Promise<Trainer> {
        return this.trainers.create({ name: input.name });
    }
}
