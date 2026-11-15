import { compare, hash } from "bcryptjs";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";

/** Criptografia de senhas com bcrypt (salt aleatório embutido no hash). */
export class BcryptPasswordHasher implements IPasswordHasher {
    constructor(private readonly saltRounds: number) {}

    hash(plain: string): Promise<string> {
        return hash(plain, this.saltRounds);
    }

    compare(plain: string, hashed: string): Promise<boolean> {
        return compare(plain, hashed);
    }
}
