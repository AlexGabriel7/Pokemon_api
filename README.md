# Top em ES — API Pokédex & Treinadores

API REST em **Node.js + Express + TypeScript** que integra com a [PokéAPI](https://pokeapi.co) oficial, persiste treinadores e Pokémons capturados em um banco de dados real (SQLite via **Prisma**) e tem um módulo de segurança completo: cadastro com senha criptografada, login com **JWT + Refresh Token**, **RBAC** e proteção contra vulnerabilidades web.

## Funcionalidades

- Buscar um Pokémon na PokéAPI e receber um DTO formatado.
- Cadastro de treinador (senha com bcrypt) e login com JWT + Refresh Token (com rotação).
- Capturar Pokémons (dados vindos da PokéAPI) e soltá-los, sempre como o treinador autenticado.
- Regra de negócio: **um treinador não pode ter mais de 6 Pokémons no time ativo**.
- Listar o time de um treinador.
- Controle de acesso por papel (RBAC): `TRAINER`, `GYM_LEADER`, `ADMIN`.
- Segurança: Helmet, CORS, Rate Limiter, DTOs que nunca vazam hash de senha e validação do `.env` com Zod no startup.

## Tecnologias

| Uso | Tecnologia |
|---|---|
| Servidor HTTP | Express 5 |
| Linguagem | TypeScript |
| Banco de dados / ORM | SQLite + Prisma 6 |
| Validação (payloads e `.env`) | Zod |
| Senhas | bcrypt (`bcryptjs`) |
| Autenticação | JWT (`jsonwebtoken`) |
| Segurança HTTP | Helmet, CORS, express-rate-limit |
| API externa | PokéAPI (via `fetch` nativo do Node) |
| Testes | `node:test` (runner nativo do Node) |

Requisito: **Node.js 20 ou superior** (usa `fetch` e `AbortSignal.timeout` nativos).

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env        # no Windows (PowerShell): copy .env.example .env
#    -> troque JWT_ACCESS_SECRET por um segredo seu (comando de geração está no .env.example)

# 3. Criar/atualizar o banco e gerar o Prisma Client
npx prisma migrate dev --name auth

# 4. Subir o servidor em modo desenvolvimento
npm run dev
```

O servidor sobe em `http://localhost:3333`.

> **Atenção (migração da parte 2 para a parte 3):** a tabela `Trainer` ganhou colunas obrigatórias (`email`, `passwordHash`). Se você já tinha treinadores de teste, o Prisma vai pedir para **resetar o banco de desenvolvimento** — aceite (os dados de teste são apagados).

### Variáveis de ambiente (`.env`)

Validadas com Zod ao iniciar: se alguma estiver ausente ou inválida, o servidor **não sobe** e lista o que está errado.

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | — (obrigatória) | Caminho do banco SQLite, ex.: `file:./dev.db` |
| `JWT_ACCESS_SECRET` | — (obrigatória) | Segredo do JWT, **mínimo 32 caracteres** |
| `PORT` | `3333` | Porta do servidor |
| `NODE_ENV` | `development` | `development`, `test` ou `production` |
| `JWT_ACCESS_EXPIRES_IN_SECONDS` | `900` | Validade do access token (15 min) |
| `REFRESH_TOKEN_EXPIRES_IN_SECONDS` | `604800` | Validade do refresh token (7 dias) |
| `BCRYPT_SALT_ROUNDS` | `12` | Custo do bcrypt (10 a 15) |
| `CORS_ORIGIN` | `http://localhost:3000` | Origens permitidas, separadas por vírgula |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Janela do rate limit (15 min) |
| `RATE_LIMIT_MAX` | `100` | Requisições por janela, por IP, na API toda |
| `AUTH_RATE_LIMIT_MAX` | `10` | Tentativas **falhas** por janela em `/auth/*` |
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

Prefixo de todas as rotas: `/api/v1`. Rotas protegidas exigem o cabeçalho `Authorization: Bearer <accessToken>`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/pokedex/search?name=pikachu` | Público | Consulta a PokéAPI e devolve o DTO formatado |
| POST | `/auth/register` | Público | Cadastro de treinador (senha criptografada) |
| POST | `/auth/login` | Público | Autenticação: devolve JWT + Refresh Token |
| POST | `/auth/refresh` | Público | Troca um refresh token por um novo par de tokens |
| GET | `/me/team` | Autenticado | Time do treinador logado |
| POST | `/me/team/catch` | Autenticado | Captura um Pokémon (id do treinador vem do JWT) |
| DELETE | `/me/team/:captureId` | Autenticado (dono) | Solta um Pokémon |
| GET | `/trainers/:trainerId/team` | Público | Time de qualquer treinador |
| PATCH | `/trainers/:id/role` | `GYM_LEADER` ou `ADMIN` | Altera o papel de um treinador |

### `POST /auth/register`

```json
{ "name": "Ash", "email": "ash@example.com", "password": "pikachu123" }
```

A senha precisa ter de 8 a 72 caracteres, com pelo menos uma letra e um número. Resposta `201`:

```json
{ "id": "b2f1c0a4-....", "name": "Ash", "email": "ash@example.com", "role": "TRAINER", "createdAt": "2026-11-11T20:00:00.000Z" }
```

O papel **nunca** vem do cliente: todo cadastro novo é `TRAINER`.

### `POST /auth/login`

```json
{ "email": "ash@example.com", "password": "pikachu123" }
```

Resposta `200`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "9f2c...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "trainer": { "id": "...", "name": "Ash", "email": "ash@example.com", "role": "TRAINER", "createdAt": "..." }
}
```

### `POST /auth/refresh`

```json
{ "refreshToken": "9f2c..." }
```

Devolve o mesmo formato do login. O refresh token antigo é **revogado** (rotação); se um token já usado for apresentado de novo, todas as sessões do treinador são revogadas.

### `POST /me/team/catch`

```json
{ "pokemonName": "pikachu" }
```

Resposta `201` com o Pokémon capturado (`captureId`, `id` da Pokédex, `name`, `imageUrl`, `types`, `stats`, `capturedAt`). Fluxo: o id do treinador sai do token, a PokéAPI é consultada e a regra dos 6 é validada antes de salvar.

### `DELETE /me/team/:captureId`

Resposta `204` sem corpo. Se a captura for de outro treinador: `403`.

### `PATCH /trainers/:id/role`

```json
{ "role": "GYM_LEADER" }
```

Só `GYM_LEADER` ou `ADMIN` acessam. Regra extra contra escalada de privilégio: **apenas um `ADMIN` concede ou retira o papel `ADMIN`**.

### Como criar o primeiro ADMIN

Como o cadastro sempre cria `TRAINER`, o primeiro administrador é promovido direto no banco:

1. Cadastre-se normalmente em `/auth/register`.
2. Rode `npx prisma studio`, abra a tabela **Trainer** e troque o campo `role` do seu usuário para `ADMIN`.
3. Faça **login de novo** (o papel vai dentro do JWT, então tokens antigos continuam com o papel antigo).

### `GET /trainers/:trainerId/team` e `GET /me/team`

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
| 401 | `MISSING_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_EXPIRED` | Não autenticado: token ausente, inválido ou expirado; login incorreto |
| 403 | `FORBIDDEN` | Autenticado, mas sem permissão (papel insuficiente ou Pokémon de outro treinador) |
| 404 | `NOT_FOUND` | Treinador, Pokémon, captura ou rota inexistente |
| 409 | `TEAM_FULL` | Treinador já tem 6 Pokémons no time ativo |
| 409 | `EMAIL_ALREADY_REGISTERED` | E-mail já cadastrado |
| 413 | `PAYLOAD_TOO_LARGE` | Corpo maior que 10 KB |
| 429 | `TOO_MANY_REQUESTS` | Rate limit excedido |
| 502 | `EXTERNAL_SERVICE_ERROR` | PokéAPI fora do ar, lenta (timeout de 8 s) ou com resposta inválida |
| 500 | `INTERNAL_SERVER_ERROR` | Erro inesperado |

## Segurança

| Proteção | Como |
|---|---|
| Senhas | bcrypt com salt (custo configurável); o hash nunca sai da API |
| JWT | HS256, algoritmo fixado na verificação, vida curta (15 min), `sub` = id do treinador, `role` no payload |
| Refresh token | String aleatória; no banco só o **hash SHA-256**; rotação a cada uso e revogação em caso de reuso |
| Autenticação | Middleware `authenticate` valida `Authorization: Bearer <token>` |
| RBAC | Middleware `authorize(...papéis)` depois do `authenticate` |
| Helmet | Cabeçalhos HTTP de segurança |
| CORS | Somente as origens de `CORS_ORIGIN` |
| Rate Limiter | Geral (100 req / 15 min por IP) e rígido em `/auth/*` (10 tentativas falhas / 15 min) contra brute force |
| Vazamento de dados | `TrainerDTO` é uma lista branca de campos; erros não expõem stack trace |
| Login | Mesma mensagem para "e-mail não existe" e "senha errada", com tempo de resposta equivalente |
| Corpo da requisição | Limitado a 10 KB; todos os payloads validados com Zod |
| Configuração | `.env` validado com Zod ao iniciar; segredo do JWT com no mínimo 32 caracteres |

> Observação: o papel está dentro do JWT, então uma mudança de papel só vale para tokens novos (o access token dura 15 min). Faça login de novo ou use `/auth/refresh`.

## Arquitetura

O projeto segue camadas, com as dependências apontando sempre para dentro (infraestrutura → aplicação → domínio).

```
prisma/
  schema.prisma                 Modelos Trainer, Pokemon e RefreshToken
src/
  domain/                       Regras e contratos (não conhece Prisma, Express, bcrypt nem JWT)
    entities/                   Pokemon, Trainer, RefreshToken, Role
    errors/                     AppError, NotFound, TeamFull, Unauthorized, Forbidden, Conflict, ...
    gateways/                   IPokeApiGateway
    repositories/               IPokemonRepository, ITrainerRepository, IRefreshTokenRepository
    services/                   IPasswordHasher, ITokenService
  application/                  Casos de uso
    dtos/                       PokemonDTO, TrainerDTO (serialização segura)
    use-cases/                  SearchPokemon, RegisterTrainer, Login, RefreshSession,
                                CapturePokemon, ReleasePokemon, GetTrainerTeam, ChangeTrainerRole
  infrastructure/               Implementações concretas
    config/                     env.ts (validação do .env com Zod)
    database/                   Cliente do Prisma
    providers/                  PokeApiGateway (fetch)
    security/                   BcryptPasswordHasher, JwtTokenService
    repositories/               Prisma* (usados na aplicação) e InMemory* (usados nos testes)
    http/
      controllers/              Auth, Me, Pokedex, Trainer
      routes/                   authRoutes, meRoutes, pokedexRoutes, trainerRoutes
      schemas/                  Schemas Zod
      middlewares/              authMiddleware (authenticate/authorize), security (helmet/cors/rate limit),
                                errorHandler (global) e notFoundHandler
  main/
    container.ts                Monta as dependências (único lugar que conhece as implementações)
    app.ts                      Configura o Express
    server.ts                   Valida o .env e sobe o servidor
```

### Trocar de repositório sem mexer no domínio

Os casos de uso dependem apenas das interfaces `IPokemonRepository`, `ITrainerRepository` e `IPokeApiGateway`. Para usar outra implementação (por exemplo, o repositório em memória), basta trocar as linhas correspondentes em `src/main/container.ts`. Os testes fazem exatamente isso: rodam os mesmos casos de uso com repositórios em memória e um gateway falso.

## Modelo de dados

- **Trainer**: `id` (UUID), `name`, `email` (único), `passwordHash`, `role` (`TRAINER` | `GYM_LEADER` | `ADMIN`), `createdAt`.
- **Pokemon** (captura): `id`, `pokedexId`, `name`, `types` (lista salva separada por vírgula, pois o SQLite não tem arrays), `imageUrl`, seis atributos base, `active`, `capturedAt` e `trainerId`.
- **RefreshToken**: `id`, `tokenHash` (único), `expiresAt`, `revokedAt`, `createdAt` e `trainerId`.

## Testando manualmente

Ordem sugerida (no Insomnia, com corpo em **JSON**):

1. `POST http://localhost:3333/api/v1/auth/register` com `{"name":"Ash","email":"ash@example.com","password":"pikachu123"}`.
2. `POST http://localhost:3333/api/v1/auth/login` com `{"email":"ash@example.com","password":"pikachu123"}` e copiar o `accessToken` e o `refreshToken`.
3. Nas rotas protegidas, usar **Auth → Bearer Token** com o `accessToken`.
4. `POST http://localhost:3333/api/v1/me/team/catch` com `{"pokemonName":"pikachu"}` — 6 vezes retorna `201`, a 7ª retorna `409`.
5. `GET http://localhost:3333/api/v1/me/team` e `DELETE http://localhost:3333/api/v1/me/team/<captureId>`.
6. Sem token, qualquer rota `/me/...` retorna `401`; `PATCH /trainers/<id>/role` com um `TRAINER` retorna `403`.
7. `POST http://localhost:3333/api/v1/auth/refresh` com o `refreshToken` para obter um novo par de tokens.

## Testes

```bash
npm test
```

Cobrem: captura e limite de 6; registro (hash, e-mail normalizado, e-mail repetido, DTO sem dados sensíveis); login (credenciais inválidas com mesma resposta); refresh token (rotação, reuso, expiração); soltar Pokémon (só o dono); alteração de papel (anti-escalada); middlewares `authenticate`/`authorize`; e o `PokeApiGateway` contra um servidor HTTP local no lugar da PokéAPI.
