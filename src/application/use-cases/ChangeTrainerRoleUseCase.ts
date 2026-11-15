import { Role } from "../../domain/entities/role";
import { ForbiddenError, NotFoundError } from "../../domain/errors/DomainErrors";
import { ITrainerRepository } from "../../domain/repositories/ITrainerRepository";
import { TrainerDTO, toTrainerDTO } from "../dtos/TrainerDTO";

export interface ChangeTrainerRoleInput {
    actorRole: Role;
    targetId: string;
    newRole: Role;
}

export class ChangeTrainerRoleUseCase {
    constructor(private readonly trainers: ITrainerRepository) {}

    async execute(input: ChangeTrainerRoleInput): Promise<TrainerDTO> {
        const target = await this.trainers.findById(input.targetId);
        if (!target) {
            throw new NotFoundError("Treinador não encontrado.");
        }

        // Evita escalada de privilégio: só um ADMIN concede ou retira o papel ADMIN.
        const touchesAdmin = input.newRole === "ADMIN" || target.role === "ADMIN";
        if (touchesAdmin && input.actorRole !== "ADMIN") {
            throw new ForbiddenError("Apenas um ADMIN pode conceder ou retirar o papel ADMIN.");
        }

        const updated = await this.trainers.updateRole(target.id, input.newRole);
        return toTrainerDTO(updated);
    }
}
