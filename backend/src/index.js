import { config } from "./config.js";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`kmath-backend listening on :${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
