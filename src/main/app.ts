import express from "express";
import { errorHandler, notFoundHandler } from "../infrastructure/http/middlewares/errorHandler";
import { apiRouter } from "./container";

const app = express();

app.use(express.json());
app.use("/api/v1", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler); // sempre por último

export default app;
