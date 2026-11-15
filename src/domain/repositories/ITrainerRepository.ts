import { Role } from "../entities/role";
import { Trainer } from "../entities/trainer";

export interface NewTrainerData {
    name: string;
    email: string;
    passwordHash: string;
    role?: Role;
}

export interface ITrainerRepository {
    create(data: NewTrainerData): Promise<Trainer>;
    findById(id: string): Promise<Trainer | undefined>;
    findByEmail(email: string): Promise<Trainer | undefined>;
    updateRole(id: string, role: Role): Promise<Trainer>;
}
