export interface RefreshTokenProps {
    id: string;
    tokenHash: string;
    trainerId: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
}

/** Refresh token guardado no banco (apenas o hash, nunca o token em si). */
export class RefreshToken {
    public id: string;
    public tokenHash: string;
    public trainerId: string;
    public expiresAt: Date;
    public revokedAt: Date | null;
    public createdAt: Date;

    constructor(props: RefreshTokenProps) {
        this.id = props.id;
        this.tokenHash = props.tokenHash;
        this.trainerId = props.trainerId;
        this.expiresAt = props.expiresAt;
        this.revokedAt = props.revokedAt;
        this.createdAt = props.createdAt;
    }
}
