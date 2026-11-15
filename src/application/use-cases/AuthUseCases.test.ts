import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Request, Response } from "express";
import { toTrainerDTO } from "../dtos/TrainerDTO";
import { Role, isRole } from "../../domain/entities/role";
import {
    ConflictError, ForbiddenError, NotFoundError, UnauthorizedError,
} from "../../domain/errors/DomainErrors";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { ITokenService } from "../../domain/services/ITokenService";
import { authenticate, authorize } from "../../infrastructure/http/middlewares/authMiddleware";
import {
    InMemoryPokemonRepository, InMemoryRefreshTokenRepository, InMemoryTrainerRepository,
} from "../../infrastructure/repositories/InMemoryPokemonRepository";
import { ChangeTrainerRoleUseCase } from "./ChangeTrainerRoleUseCase";
import { LoginUseCase } from "./LoginUseCase";
import { RefreshSessionUseCase } from "./RefreshSessionUseCase";
import { RegisterTrainerUseCase } from "./RegisterTrainerUseCase";
import { ReleasePokemonUseCase } from "./ReleasePokemonUseCase";

class FakeHasher implements IPasswordHasher {
    async hash(plain: string) { return `hashed:${plain}`; }
    async compare(plain: string, hash: string) { return hash === `hashed:${plain}`; }
}

class FakeTokens implements ITokenService {
    accessTokenExpiresInSeconds = 900;
    refreshTtlMs = 60_000;
    private n = 0;
    signAccessToken(p: { trainerId: string; role: Role }) { return `access|${p.trainerId}|${p.role}`; }
    verifyAccessToken(token: string) {
        const [kind, trainerId, role] = token.split("|");
        if (kind !== "access" || !isRole(role)) throw new UnauthorizedError("inválido", "INVALID_TOKEN");
        return { trainerId, role };
    }
    generateRefreshToken() {
        const token = `refresh-${++this.n}`;
        return { token, tokenHash: this.hashRefreshToken(token), expiresAt: new Date(Date.now() + this.refreshTtlMs) };
    }
    hashRefreshToken(token: string) { return `hash(${token})`; }
}

function setup() {
    const trainers = new InMemoryTrainerRepository();
    const pokemons = new InMemoryPokemonRepository();
    const refresh = new InMemoryRefreshTokenRepository();
    const hasher = new FakeHasher();
    const tokens = new FakeTokens();
    return {
        trainers, pokemons, refresh, tokens,
        register: new RegisterTrainerUseCase(trainers, hasher),
        login: new LoginUseCase(trainers, hasher, tokens, refresh),
        refreshSession: new RefreshSessionUseCase(trainers, tokens, refresh),
        release: new ReleasePokemonUseCase(pokemons),
        changeRole: new ChangeTrainerRoleUseCase(trainers),
    };
}

const ash = { name: "Ash", email: "Ash@Example.com", password: "pikachu123" };

describe("Registro", () => {
    it("salva senha criptografada, normaliza o e-mail e não vaza dados sensíveis", async () => {
        const { register, trainers } = setup();
        const dto = await register.execute(ash);
        assert.equal(dto.email, "ash@example.com");
        assert.equal(dto.role, "TRAINER");
        assert.deepEqual(Object.keys(dto).sort(), ["createdAt", "email", "id", "name", "role"]);
        assert.ok(!JSON.stringify(dto).includes("hashed"));
        assert.ok(!JSON.stringify(dto).includes("pikachu123"));
        const stored = await trainers.findByEmail("ash@example.com");
        assert.equal(stored?.passwordHash, "hashed:pikachu123");
    });

    it("rejeita e-mail repetido (409)", async () => {
        const { register } = setup();
        await register.execute(ash);
        await assert.rejects(register.execute({ ...ash, email: "ASH@example.com" }),
            (e: unknown) => e instanceof ConflictError && e.statusCode === 409);
    });
});

describe("Login", () => {
    it("emite access token e refresh token", async () => {
        const { register, login } = setup();
        const dto = await register.execute(ash);
        const session = await login.execute({ email: "ash@example.com", password: "pikachu123" });
        assert.equal(session.tokenType, "Bearer");
        assert.equal(session.accessToken, `access|${dto.id}|TRAINER`);
        assert.ok(session.refreshToken);
        assert.equal(session.expiresIn, 900);
        assert.ok(!JSON.stringify(session).includes("hashed"));
    });

    it("mesma resposta para senha errada e e-mail inexistente", async () => {
        const { register, login } = setup();
        await register.execute(ash);
        const wrongPassword = await login.execute({ email: "ash@example.com", password: "errada" }).catch(e => e);
        const unknownEmail = await login.execute({ email: "x@example.com", password: "pikachu123" }).catch(e => e);
        assert.ok(wrongPassword instanceof UnauthorizedError && unknownEmail instanceof UnauthorizedError);
        assert.equal(wrongPassword.message, unknownEmail.message);
        assert.equal(wrongPassword.statusCode, 401);
    });
});

describe("Refresh token", () => {
    it("rotaciona: o token antigo deixa de valer e reuso revoga tudo", async () => {
        const { register, login, refreshSession } = setup();
        await register.execute(ash);
        const first = await login.execute({ email: "ash@example.com", password: "pikachu123" });
        const second = await refreshSession.execute({ refreshToken: first.refreshToken });
        assert.notEqual(second.refreshToken, first.refreshToken);

        // reutilizar o antigo -> 401 e a sessão nova também é revogada
        await assert.rejects(refreshSession.execute({ refreshToken: first.refreshToken }), UnauthorizedError);
        await assert.rejects(refreshSession.execute({ refreshToken: second.refreshToken }), UnauthorizedError);
    });

    it("rejeita token inexistente e token expirado", async () => {
        const { register, login, refreshSession, tokens } = setup();
        await register.execute(ash);
        await assert.rejects(refreshSession.execute({ refreshToken: "nope" }), UnauthorizedError);
        tokens.refreshTtlMs = -1000;
        const session = await login.execute({ email: "ash@example.com", password: "pikachu123" });
        await assert.rejects(refreshSession.execute({ refreshToken: session.refreshToken }),
            (e: unknown) => e instanceof UnauthorizedError && e.code === "REFRESH_TOKEN_EXPIRED");
    });
});

describe("Soltar Pokémon", () => {
    const data = {
        pokedexId: 25, name: "pikachu", types: ["electric"], imageUrl: null,
        hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1,
    };

    it("só o dono solta; outro treinador recebe 403; inexistente 404", async () => {
        const { pokemons, release } = setup();
        const capture = await pokemons.create({ ...data, trainerId: "dono" });
        await assert.rejects(release.execute({ trainerId: "intruso", captureId: capture.id }),
            (e: unknown) => e instanceof ForbiddenError && e.statusCode === 403);
        assert.ok(await pokemons.findById(capture.id)); // continua existindo
        await release.execute({ trainerId: "dono", captureId: capture.id });
        assert.equal(await pokemons.findById(capture.id), undefined);
        await assert.rejects(release.execute({ trainerId: "dono", captureId: 999 }), NotFoundError);
    });
});

describe("Alterar papel (RBAC no caso de uso)", () => {
    it("GYM_LEADER promove a GYM_LEADER, mas não concede nem retira ADMIN", async () => {
        const { register, changeRole } = setup();
        const target = await register.execute(ash);
        const promoted = await changeRole.execute({ actorRole: "GYM_LEADER", targetId: target.id, newRole: "GYM_LEADER" });
        assert.equal(promoted.role, "GYM_LEADER");
        await assert.rejects(changeRole.execute({ actorRole: "GYM_LEADER", targetId: target.id, newRole: "ADMIN" }), ForbiddenError);
    });

    it("ADMIN concede ADMIN; alvo inexistente dá 404", async () => {
        const { register, changeRole } = setup();
        const target = await register.execute(ash);
        const result = await changeRole.execute({ actorRole: "ADMIN", targetId: target.id, newRole: "ADMIN" });
        assert.equal(result.role, "ADMIN");
        await assert.rejects(changeRole.execute({ actorRole: "ADMIN", targetId: "x", newRole: "TRAINER" }), NotFoundError);
    });
});

describe("Middlewares authenticate / authorize", () => {
    const tokens = new FakeTokens();
    function run(mw: (req: Request, res: Response, next: (e?: unknown) => void) => void, authorization?: string, locals: Record<string, unknown> = {}) {
        const res = { locals } as unknown as Response;
        let error: unknown;
        mw({ headers: { authorization } } as Request, res, e => { error = e; });
        return { error, res };
    }

    it("exige Authorization: Bearer <token>", () => {
        const mw = authenticate(tokens);
        assert.ok(run(mw, undefined).error instanceof UnauthorizedError);
        assert.ok(run(mw, "Basic abc").error instanceof UnauthorizedError);
        assert.ok(run(mw, "Bearer lixo").error instanceof UnauthorizedError);
        const ok = run(mw, "Bearer access|abc|ADMIN");
        assert.equal(ok.error, undefined);
        assert.deepEqual(ok.res.locals.auth, { trainerId: "abc", role: "ADMIN" });
    });

    it("authorize libera só os papéis permitidos", () => {
        const mw = authorize("GYM_LEADER", "ADMIN");
        assert.equal(run(mw, undefined, { auth: { trainerId: "1", role: "ADMIN" } }).error, undefined);
        assert.ok(run(mw, undefined, { auth: { trainerId: "1", role: "TRAINER" } }).error instanceof ForbiddenError);
        assert.ok(run(mw, undefined, {}).error instanceof UnauthorizedError);
    });
});

describe("Serialização", () => {
    it("toTrainerDTO nunca inclui passwordHash", async () => {
        const trainers = new InMemoryTrainerRepository();
        const t = await trainers.create({ name: "Ash", email: "a@a.com", passwordHash: "SEGREDO" });
        assert.ok(!("passwordHash" in toTrainerDTO(t)));
    });
});
