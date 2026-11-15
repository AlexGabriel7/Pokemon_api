import { ConflictError } from "../../domain/errors/DomainErrors";
import { ITrainerRepository } from "../../domain/repositories/ITrainerRepository";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { TrainerDTO, toTrainerDTO } from "../dtos/TrainerDTO";

export interface RegisterTrainerInput {
    name: string;
    email: string;
    password: string;
}

export class RegisterTrainerUseCase {
    constructor(
        private readonly trainers: ITrainerRepository,
        private readonly hasher: IPasswordHasher
    ) {}

    async execute(input: RegisterTrainerInput): Promise<TrainerDTO> {
        const email = input.email.trim().toLowerCase();

        if (await this.trainers.findByEmail(email)) {
            throw new ConflictError("Este e-mail já está cadastrado.", "EMAIL_ALREADY_REGISTERED");
        }

        const passwordHash = await this.hasher.hash(input.password);

        // O papel nunca vem do cliente: todo cadastro novo é TRAINER.
        const trainer = await this.trainers.create({
            name: input.name,
            email,
            passwordHash,
            role: "TRAINER",
        });

        return toTrainerDTO(trainer);
    }
}
