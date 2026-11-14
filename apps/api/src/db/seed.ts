import "dotenv/config";
import { connectPostgres } from "./connect.js";
import { seedBase } from "../demo/seed.js";
const url = process.env.SHOP_DATABASE_URL;
if (!url || new URL(url).hostname !== process.env.SHOP_DATABASE_HOST_CONFIRM)
  throw new Error(
    "Set the verified SHOP_DATABASE_URL and SHOP_DATABASE_HOST_CONFIRM first.",
  );
const { repository, close } = connectPostgres(url);
try {
  await seedBase(repository);
  console.log(
    "Default categories and disabled checkout initialized. No demo products inserted.",
  );
} finally {
  await close();
}
