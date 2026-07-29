import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = Number(process.env.PORT) || 4000;
const webUrl = process.env.WEB_URL || "http://localhost:5173";

app.use(helmet());

app.use(
  cors({
    origin: webUrl,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: "Zenith API đang hoạt động",
    data: {
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
  });
});

app.use((_request: Request, response: Response) => {
  response.status(404).json({
    success: false,
    message: "Không tìm thấy API",
  });
});

app.use(
  (
    error: Error,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error(error);

    response.status(500).json({
      success: false,
      message: "Máy chủ xảy ra lỗi",
    });
  },
);

app.listen(port, () => {
  console.log(`Zenith API đang chạy tại http://localhost:${port}`);
});