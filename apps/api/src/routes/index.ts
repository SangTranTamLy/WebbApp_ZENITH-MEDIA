import { Router } from "express";

import { env } from "../config/env.js";
import { successResponse } from "../shared/apiResponse.js";
import { authRouter } from "../modules/auth/auth.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.status(200).json(
    successResponse(
      {
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      "Zenith API is running",
    ),
  );
});
apiRouter.use("/auth", authRouter);