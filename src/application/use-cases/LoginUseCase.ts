import { UnauthorizedError } from "../../domain/errors/DomainErrors";
import { IRefreshTokenRepository } from "../../domain/repositories/IRefreshTokenRepository";
import { ITrainerRepository } from "../../domain/repositories/ITrainerRepository";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { ITokenService } from "../../domain/services/ITokenService";
import { AuthSessionDTO } from "../dtos/TrainerDTO";
import { issueSession } from "./issueSession";

// Hash válido porém inexistente: permite gastar o mesmo tempo de um bcrypt
// mesmo quando o e-mail não existe (evita descobrir e-mails pelo tempo de resposta).
const DUMMY_HASH = "$2a$12$" + "x".repeat(53);

export class LoginUseCase {
    constructor(
        private readonly trainers: ITrainerRepository,
        private readonly hasher: IPasswordHasher,
        private readonly tokens: ITokenService,
        private readonly refreshTokens: IRefreshTokenRepository
    ) {}

    async execute(input: { email: string; password: string }): Promise<AuthSessionDTO> {
        const trainer = await this.trainers.findByEmail(input.email.trim().toLowerCase());
        const passwordOk = await this.hasher.compare(
            input.password,
            trainer?.passwordHash ?? DUMMY_HASH
        );

        // Mesma mensagem para "e-mail não existe" e "senha errada".
        if (!trainer || !passwordOk) {
            throw new UnauthorizedError("E-mail ou senha inválidos.", "INVALID_CREDENTIALS");
        }

        return issueSession(trainer, this.tokens, this.refreshTokens);
    }
}
