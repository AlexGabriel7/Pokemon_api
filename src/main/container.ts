import { Router } from "express";
import { CapturePokemonUseCase } from "../application/use-cases/CapturePokemonUseCase";
import { CreateTrainerUseCase } from "../application/use-cases/CreateTrainerUseCase";
import { GetTrainerTeamUseCase } from "../application/use-cases/GetTrainerTeamUseCase";
import { SearchPokemonUseCase } from "../application/use-cases/SearchPokemonUseCase";
import { prisma } from "../infrastructure/database/prisma";
import { PokedexController } from "../infrastructure/http/controllers/PokedexController";
import { TrainerController } from "../infrastructure/http/controllers/TrainerController";
import { createPokedexRoutes } from "../infrastructure/http/routes/pokedexRoutes";
import { createTrainerRoutes } from "../infrastructure/http/routes/trainerRoutes";
import { PokeApiGateway } from "../infrastructure/providers/PokeApiGateway";
import { PrismaPokemonRepository } from "../infrastructure/repositories/PrismaPokemonRepository";
import { PrismaTrainerRepository } from "../infrastructure/repositories/PrismaTrainerRepository";

// Composition root: é o único lugar que conhece as implementações concretas.
// Para voltar ao InMemory, basta trocar as duas linhas dos repositórios.
const pokemonRepository = new PrismaPokemonRepository(prisma);
const trainerRepository = new PrismaTrainerRepository(prisma);
const pokeApiGateway = new PokeApiGateway();

const pokedexController = new PokedexController(new SearchPokemonUseCase(pokeApiGateway));
const trainerController = new TrainerController(
    new CreateTrainerUseCase(trainerRepository),
    new CapturePokemonUseCase(trainerRepository, pokemonRepository, pokeApiGateway),
    new GetTrainerTeamUseCase(trainerRepository, pokemonRepository)
);

export const apiRouter = Router();
apiRouter.use("/pokedex", createPokedexRoutes(pokedexController));
apiRouter.use("/trainers", createTrainerRoutes(trainerController));
