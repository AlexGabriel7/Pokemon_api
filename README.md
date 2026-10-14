# Top em ES — API Pokédex & Treinadores

API REST em **Node.js + Express + TypeScript** que integra com a [PokéAPI](https://pokeapi.co) oficial e persiste treinadores e Pokémons capturados em um banco de dados real (SQLite via **Prisma**).

## Funcionalidades

- Buscar um Pokémon na PokéAPI e receber um DTO formatado.
- Cadastrar treinadores.
- Capturar Pokémons para um treinador (dados vindos da PokéAPI).
- Regra de negócio: **um treinador não pode ter mais de 6 Pokémons no time ativo**.
- Listar o time atual de um treinador.

## Tecnologias

| Uso | Tecnologia |
|---|---|
| Servidor HTTP | Express 5 |
| Linguagem | TypeScript |
| Banco de dados / ORM | SQLite + Prisma 6 |
| Validação | Zod |
| API externa | PokéAPI (via `fetch` nativo do Node) |
| Testes | `node:test` (runner nativo do Node) |

Requisito: **Node.js 20 ou superior** (usa `fetch` e `AbortSignal.timeout` nativos).

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env        # no Windows (PowerShell): copy .env.example .env

# 3. Criar o banco e gerar o Prisma Client
npx prisma migrate dev --name init

# 4. Subir o servidor em modo desenvolvimento
npm run dev
```

O servidor sobe em `http://localhost:3333`.

### Variáveis de ambiente (`.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Caminho do banco SQLite |
| `PORT` | `3333` | Porta do servidor |
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` | (opcional) URL base da PokéAPI |

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor com reinício automático (tsx watch) |
| `npm run build` | Compila para `dist/` |
| `npm start` | Roda a versão compilada (`npm run build` antes) |
| `npm test` | Executa os testes |
| `npm run prisma:migrate` | Cria/aplica migrações do banco |
| `npm run prisma:studio` | Abre o Prisma Studio para ver os dados |

## Endpoints

Prefixo de todas as rotas: `/api/v1`.

### `GET /pokedex/search?name=pikachu`

Consulta direto na PokéAPI e devolve o DTO formatado.

```json
{
  "id": 25,
  "name": "pikachu",
  "imageUrl": "https://raw.githubusercontent.com/.../25.png",
  "types": ["electric"],
  "stats": {
    "hp": 35, "attack": 55, "defense": 40,
    "specialAttack": 50, "specialDefense": 50, "speed": 90
  }
}
```

### `POST /trainers`

Cadastra um treinador.

```json
{ "name": "Ash" }
```

Resposta `201`:

```json
{ "id": "b2f1c0a4-....", "name": "Ash", "createdAt": "2026-10-14T05:00:00.000Z" }
```

### `POST /trainers/:trainerId/captures`

Captura um Pokémon para o treinador. Fluxo: verifica o treinador, valida o limite do time, consulta a PokéAPI (imagem, atributos base e tipos) e salva a captura.

```json
{ "pokemonName": "pikachu" }
```

Resposta `201`: o Pokémon capturado (mesmo formato do DTO acima, mais `captureId` e `capturedAt`).

### `GET /trainers/:trainerId/team`

Lista o time ativo do treinador.

```json
{
  "trainer": { "id": "b2f1c0a4-....", "name": "Ash" },
  "team": [ { "captureId": 1, "id": 25, "name": "pikachu", "...": "..." } ]
}
```

## Tratamento de erros

Todos os erros seguem o mesmo formato:

```json
{ "error": { "code": "TEAM_FULL", "message": "O treinador já possui 6 Pokémons no time ativo." } }
```

| Status | `code` | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Payload, query ou `trainerId` inválido (com `details` por campo) |
| 400 | `INVALID_JSON` | Corpo da requisição não é um JSON válido |
| 404 | `NOT_FOUND` | Treinador, Pokémon ou rota inexistente |
| 409 | `TEAM_FULL` | Treinador já tem 6 Pokémons no time ativo |
| 502 | `EXTERNAL_SERVICE_ERROR` | PokéAPI fora do ar, lenta (timeout de 8 s) ou com resposta inválida |
| 500 | `INTERNAL_SERVER_ERROR` | Erro inesperado |

## Arquitetura

O projeto segue camadas, com as dependências apontando sempre para dentro (infraestrutura → aplicação → domínio).

```
prisma/
  schema.prisma                 Modelos Trainer e Pokemon
src/
  domain/                       Regras e contratos (não conhece Prisma, Express nem fetch)
    entities/                   Pokemon, Trainer
    errors/                     AppError, NotFoundError, TeamFullError, ExternalServiceError
    gateways/                   IPokeApiGateway
    repositories/               IPokemonRepository, ITrainerRepository
  application/                  Casos de uso
    dtos/                       PokemonDTO e mapeadores
    use-cases/                  SearchPokemon, CreateTrainer, CapturePokemon, GetTrainerTeam
  infrastructure/               Implementações concretas
    database/                   Cliente do Prisma
    providers/                  PokeApiGateway (fetch)
    repositories/               PrismaPokemonRepository, PrismaTrainerRepository,
                                InMemory* (usados nos testes)
    http/
      controllers/              Recebem a requisição, validam com Zod, chamam o caso de uso
      routes/                   pokedexRoutes, trainerRoutes
      schemas/                  Schemas Zod
      middlewares/              errorHandler (global) e notFoundHandler
  main/
    container.ts                Monta as dependências (único lugar que conhece as implementações)
    app.ts                      Configura o Express
    server.ts                   Sobe o servidor
```

### Trocar de repositório sem mexer no domínio

Os casos de uso dependem apenas das interfaces `IPokemonRepository`, `ITrainerRepository` e `IPokeApiGateway`. Para usar outra implementação (por exemplo, o repositório em memória), basta trocar as linhas correspondentes em `src/main/container.ts`. Os testes fazem exatamente isso: rodam os mesmos casos de uso com repositórios em memória e um gateway falso.

## Modelo de dados

- **Trainer**: `id` (UUID), `name`, `createdAt`.
- **Pokemon** (captura): `id`, `pokedexId`, `name`, `types` (lista salva separada por vírgula, pois o SQLite não tem arrays), `imageUrl`, seis atributos base (`hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed`), `active`, `capturedAt` e `trainerId`.

## Testando manualmente

Ordem sugerida (no Insomnia ou similar, com corpo em **JSON**):

1. `GET http://localhost:3333/api/v1/pokedex/search?name=pikachu`
2. `POST http://localhost:3333/api/v1/trainers` com `{"name":"Ash"}` e copiar o `id`.
3. `POST http://localhost:3333/api/v1/trainers/<id>/captures` com `{"pokemonName":"pikachu"}` — 6 vezes retorna `201`, a 7ª retorna `409`.
4. `GET http://localhost:3333/api/v1/trainers/<id>/team`

## Testes

```bash
npm test
```

