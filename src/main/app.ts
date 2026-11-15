import express from "express";
import { errorHandler, notFoundHandler } from "../infrastructure/http/middlewares/errorHandler";
import { apiRouter, security } from "./container";

const app = express();

// Segurança primeiro: cabeçalhos, CORS e limite de requisições.
app.use(security.helmet);
app.use(security.cors);
app.use(security.globalRateLimiter);

app.use(express.json({ limit: "10kb" }));
app.use("/api/v1", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler); // sempre por último

export default app;
