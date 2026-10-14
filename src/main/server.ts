import app from "./app";
import { prisma } from "../infrastructure/database/prisma";

const PORT = Number(process.env.PORT) || 3333;

const server = app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
