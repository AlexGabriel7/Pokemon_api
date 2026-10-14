import assert from "node:assert/strict";
import { createServer } from "node:http";
import { AddressInfo } from "node:net";
import { describe, it } from "node:test";
import { TeamFullError, NotFoundError, ExternalServiceError } from "../../domain/errors/DomainErrors";
import { IPokeApiGateway, PokeApiPokemonData } from "../../domain/gateways/IPokeApiGateway";
import { PokeApiGateway } from "../../infrastructure/providers/PokeApiGateway";
import {
    InMemoryPokemonRepository,
    InMemoryTrainerRepository,
} from "../../infrastructure/repositories/InMemoryPokemonRepository";
import { CapturePokemonUseCase } from "./CapturePokemonUseCase";
import { CreateTrainerUseCase } from "./CreateTrainerUseCase";
import { GetTrainerTeamUseCase } from "./GetTrainerTeamUseCase";

class FakeGateway implements IPokeApiGateway {
    async findByName(name: string): Promise<PokeApiPokemonData> {
        if (name === "missingno") throw new NotFoundError("não existe");
        return {
            pokedexId: 25, name, types: ["electric"], imageUrl: "http://img/25.png",
            hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90,
        };
    }
}

function setup() {
    const trainers = new InMemoryTrainerRepository();
    const pokemons = new InMemoryPokemonRepository();
    const gateway = new FakeGateway();
    return {
        createTrainer: new CreateTrainerUseCase(trainers),
        capture: new CapturePokemonUseCase(trainers, pokemons, gateway),
        team: new GetTrainerTeamUseCase(trainers, pokemons),
    };
}

describe("CapturePokemonUseCase", () => {
    it("captura e lista no time do treinador", async () => {
        const { createTrainer, capture, team } = setup();
        const ash = await createTrainer.execute({ name: "Ash" });
        const captured = await capture.execute({ trainerId: ash.id, pokemonName: "pikachu" });
        assert.equal(captured.name, "pikachu");
        assert.equal(captured.stats.hp, 35);
        const result = await team.execute(ash.id);
        assert.equal(result.team.length, 1);
    });

    it("bloqueia a 7ª captura (time ativo máx. 6)", async () => {
        const { createTrainer, capture } = setup();
        const ash = await createTrainer.execute({ name: "Ash" });
        for (let i = 0; i < 6; i++) await capture.execute({ trainerId: ash.id, pokemonName: "pikachu" });
        await assert.rejects(
            capture.execute({ trainerId: ash.id, pokemonName: "pikachu" }),
            (e: unknown) => e instanceof TeamFullError && e.statusCode === 409
        );
    });

    it("o limite é por treinador", async () => {
        const { createTrainer, capture } = setup();
        const ash = await createTrainer.execute({ name: "Ash" });
        const misty = await createTrainer.execute({ name: "Misty" });
        for (let i = 0; i < 6; i++) await capture.execute({ trainerId: ash.id, pokemonName: "pikachu" });
        await assert.doesNotReject(capture.execute({ trainerId: misty.id, pokemonName: "pikachu" }));
    });

    it("404 para treinador inexistente e para Pokémon inexistente", async () => {
        const { createTrainer, capture, team } = setup();
        await assert.rejects(capture.execute({ trainerId: "x", pokemonName: "pikachu" }), NotFoundError);
        await assert.rejects(team.execute("x"), NotFoundError);
        const ash = await createTrainer.execute({ name: "Ash" });
        await assert.rejects(capture.execute({ trainerId: ash.id, pokemonName: "missingno" }), NotFoundError);
    });
});

describe("PokeApiGateway", () => {
    it("traduz a resposta da PokéAPI e mapeia 404 e 500", async () => {
        const server = createServer((req, res) => {
            res.setHeader("Content-Type", "application/json");
            if (req.url === "/pokemon/pikachu") {
                res.end(JSON.stringify({
                    id: 25, name: "pikachu",
                    types: [{ slot: 1, type: { name: "electric" } }],
                    stats: [
                        { base_stat: 35, stat: { name: "hp" } }, { base_stat: 55, stat: { name: "attack" } },
                        { base_stat: 40, stat: { name: "defense" } }, { base_stat: 50, stat: { name: "special-attack" } },
                        { base_stat: 50, stat: { name: "special-defense" } }, { base_stat: 90, stat: { name: "speed" } },
                    ],
                    sprites: { front_default: "front.png", other: { "official-artwork": { front_default: "art.png" } } },
                }));
            } else if (req.url === "/pokemon/boom") {
                res.statusCode = 500; res.end("{}");
            } else {
                res.statusCode = 404; res.end("Not Found");
            }
        });
        await new Promise<void>(r => server.listen(0, r));
        const gw = new PokeApiGateway(`http://127.0.0.1:${(server.address() as AddressInfo).port}`, 2000);
        try {
            const data = await gw.findByName("Pikachu");
            assert.deepEqual(
                { id: data.pokedexId, types: data.types, img: data.imageUrl, spd: data.speed },
                { id: 25, types: ["electric"], img: "art.png", spd: 90 }
            );
            await assert.rejects(gw.findByName("nope"), NotFoundError);
            await assert.rejects(gw.findByName("boom"), ExternalServiceError);
        } finally {
            server.close();
        }
    });
});
