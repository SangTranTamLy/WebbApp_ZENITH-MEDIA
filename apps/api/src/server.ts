import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `Zenith API đang chạy tại http://localhost:${env.PORT}`,
  );

  console.log(
    `Môi trường: ${env.NODE_ENV}`,
  );

  console.log(
    `Frontend được phép truy cập: ${env.WEB_URL}`,
  );
});

function shutdown(signal: string) {
  console.log(
    `${signal} đã được nhận. Đang dừng API...`,
  );

  server.close((error) => {
    if (error) {
      console.error(
        "Không thể dừng API an toàn:",
        error,
      );

      process.exit(1);
    }

    console.log("Zenith API đã dừng an toàn.");

    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});