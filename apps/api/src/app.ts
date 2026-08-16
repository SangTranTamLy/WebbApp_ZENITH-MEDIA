    import express from "express";
    import cors from "cors";
    import helmet from "helmet";

    import { env } from "./config/env.js";
    import { errorHandler } from "./middleware/errorHandler.js";
    import { notFoundHandler } from "./middleware/notFoundHandler.js";
    import { apiRouter } from "./routes/index.js";
    import cookieParser from "cookie-parser";
    export const app = express();

    app.disable("x-powered-by");

    app.use(helmet());

    app.use(
    cors({
        origin: env.WEB_URL,
        credentials: true,
        methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
        ],
        allowedHeaders: [
        "Content-Type",
        "Authorization",
        ],
    }),
    );

    app.use(
    express.json({
        limit: "1mb",
    }),
    );

    app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb",
    }),
    );

    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser(env.COOKIE_SECRET));

    app.use("/api", apiRouter);

    app.use(notFoundHandler);
    app.use(errorHandler);