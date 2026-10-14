import { Trainer } from "../entities/trainer";

export interface ITrainerRepository {
    create(data: { name: string }): Promise<Trainer>;
    findById(id: string): Promise<Trainer | undefined>;
}
