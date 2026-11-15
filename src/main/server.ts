// Deve ser o primeiro import: valida o .env antes de qualquer outra coisa subir.
import { env } from "../infrastructure/config/env";
import app from "./app";
import { prisma } from "../infrastructure/database/prisma";

const server = app.listen(env.port, () => {
    console.log(`Servidor rodando em http://localhost:${env.port}`);
});

const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
