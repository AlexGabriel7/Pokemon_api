import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3333),
    DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),

    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET deve ter pelo menos 32 caracteres"),
    JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(900), // 15 min
    REFRESH_TOKEN_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(604800), // 7 dias

    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    // Lista separada por vírgula. Ex.: "http://localhost:3000,https://meusite.com"
    CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 min
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

    POKEAPI_BASE_URL: z.string().url().optional(),
});

export interface AppEnv {
    nodeEnv: "development" | "test" | "production";
    port: number;
    databaseUrl: string;
    jwtAccessSecret: string;
    jwtAccessExpiresInSeconds: number;
    refreshTokenExpiresInSeconds: number;
    bcryptSaltRounds: number;
    corsOrigins: string[];
    rateLimitWindowMs: number;
    rateLimitMax: number;
    authRateLimitMax: number;
}

/** Valida o .env logo na inicialização: se algo estiver errado, o servidor nem sobe. */
function loadEnv(): AppEnv {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error("Variáveis de ambiente inválidas:");
        for (const issue of result.error.issues) {
            console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
        }
        process.exit(1);
    }

    const v = result.data;
    return {
        nodeEnv: v.NODE_ENV,
        port: v.PORT,
        databaseUrl: v.DATABASE_URL,
        jwtAccessSecret: v.JWT_ACCESS_SECRET,
        jwtAccessExpiresInSeconds: v.JWT_ACCESS_EXPIRES_IN_SECONDS,
        refreshTokenExpiresInSeconds: v.REFRESH_TOKEN_EXPIRES_IN_SECONDS,
        bcryptSaltRounds: v.BCRYPT_SALT_ROUNDS,
        corsOrigins: v.CORS_ORIGIN.split(",").map(origin => origin.trim()).filter(Boolean),
        rateLimitWindowMs: v.RATE_LIMIT_WINDOW_MS,
        rateLimitMax: v.RATE_LIMIT_MAX,
        authRateLimitMax: v.AUTH_RATE_LIMIT_MAX,
    };
}

export const env = loadEnv();
