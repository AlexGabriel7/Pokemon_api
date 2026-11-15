import { Role } from "./role";

export interface TrainerProps {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    createdAt: Date;
}

export class Trainer {
    public id: string;
    public name: string;
    public email: string;
    /** Nunca deve ser enviado em respostas: use sempre o TrainerDTO. */
    public passwordHash: string;
    public role: Role;
    public createdAt: Date;

    constructor(props: TrainerProps) {
        this.id = props.id;
        this.name = props.name;
        this.email = props.email;
        this.passwordHash = props.passwordHash;
        this.role = props.role;
        this.createdAt = props.createdAt;
    }
}
