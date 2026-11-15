import { Router } from "express";
import { CapturePokemonUseCase } from "../application/use-cases/CapturePokemonUseCase";
import { ChangeTrainerRoleUseCase } from "../application/use-cases/ChangeTrainerRoleUseCase";
import { GetTrainerTeamUseCase } from "../application/use-cases/GetTrainerTeamUseCase";
import { LoginUseCase } from "../application/use-cases/LoginUseCase";
import { RefreshSessionUseCase } from "../application/use-cases/RefreshSessionUseCase";
import { RegisterTrainerUseCase } from "../application/use-cases/RegisterTrainerUseCase";
import { ReleasePokemonUseCase } from "../application/use-cases/ReleasePokemonUseCase";
import { SearchPokemonUseCase } from "../application/use-cases/SearchPokemonUseCase";
import { env } from "../infrastructure/config/env";
import { prisma } from "../infrastructure/database/prisma";
import { AuthController } from "../infrastructure/http/controllers/AuthController";
import { MeController } from "../infrastructure/http/controllers/MeController";
import { PokedexController } from "../infrastructure/http/controllers/PokedexController";
import { TrainerController } from "../infrastructure/http/controllers/TrainerController";
import { authenticate } from "../infrastructure/http/middlewares/authMiddleware";
import { createSecurityMiddlewares } from "../infrastructure/http/middlewares/security";
import { createAuthRoutes } from "../infrastructure/http/routes/authRoutes";
import { createMeRoutes } from "../infrastructure/http/routes/meRoutes";
import { createPokedexRoutes } from "../infrastructure/http/routes/pokedexRoutes";
import { createTrainerRoutes } from "../infrastructure/http/routes/trainerRoutes";
import { PokeApiGateway } from "../infrastructure/providers/PokeApiGateway";
import { PrismaPokemonRepository } from "../infrastructure/repositories/PrismaPokemonRepository";
import { PrismaRefreshTokenRepository } from "../infrastructure/repositories/PrismaRefreshTokenRepository";
import { PrismaTrainerRepository } from "../infrastructure/repositories/PrismaTrainerRepository";
import { BcryptPasswordHasher } from "../infrastructure/security/BcryptPasswordHasher";
import { JwtTokenService } from "../infrastructure/security/JwtTokenService";

// Composition root: único lugar que conhece as implementações concretas.
const pokemonRepository = new PrismaPokemonRepository(prisma);
const trainerRepository = new PrismaTrainerRepository(prisma);
const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);
const pokeApiGateway = new PokeApiGateway();

const passwordHasher = new BcryptPasswordHasher(env.bcryptSaltRounds);
const tokenService = new JwtTokenService({
    accessSecret: env.jwtAccessSecret,
    accessExpiresInSeconds: env.jwtAccessExpiresInSeconds,
    refreshExpiresInSeconds: env.refreshTokenExpiresInSeconds,
});

export const security = createSecurityMiddlewares({
    corsOrigins: env.corsOrigins,
    rateLimitWindowMs: env.rateLimitWindowMs,
    rateLimitMax: env.rateLimitMax,
    authRateLimitMax: env.authRateLimitMax,
});
const requireAuth = authenticate(tokenService);

const getTeam = new GetTrainerTeamUseCase(trainerRepository, pokemonRepository);

const pokedexController = new PokedexController(new SearchPokemonUseCase(pokeApiGateway));
const authController = new AuthController(
    new RegisterTrainerUseCase(trainerRepository, passwordHasher),
    new LoginUseCase(trainerRepository, passwordHasher, tokenService, refreshTokenRepository),
    new RefreshSessionUseCase(trainerRepository, tokenService, refreshTokenRepository)
);
const meController = new MeController(
    new CapturePokemonUseCase(trainerRepository, pokemonRepository, pokeApiGateway),
    new ReleasePokemonUseCase(pokemonRepository),
    getTeam
);
const trainerController = new TrainerController(
    getTeam,
    new ChangeTrainerRoleUseCase(trainerRepository)
);

export const apiRouter = Router();
apiRouter.use("/pokedex", createPokedexRoutes(pokedexController));
apiRouter.use("/auth", createAuthRoutes(authController, security.authRateLimiter));
apiRouter.use("/me", createMeRoutes(meController, requireAuth));
apiRouter.use("/trainers", createTrainerRoutes(trainerController, requireAuth));
