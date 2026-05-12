import { MongoClient } from "mongodb";
import { config } from "./config.js";

let client;
let db;

export async function connectDb(url = config.mongoUrl) {
  if (db) return db;
  client = new MongoClient(url);
  await client.connect();
  // db name is taken from the URL path; if absent, fall back to "kmath"
  let dbName;
  try {
    dbName = new URL(url).pathname.slice(1) || "kmath";
  } catch {
    dbName = "kmath";
  }
  db = client.db(dbName);
  // googleEmail must be unique across profiles (when set). Partial index
  // skips docs where the field is null so we can have many "no email" profiles.
  await db.collection("profiles").createIndex(
    { googleEmail: 1 },
    { unique: true, partialFilterExpression: { googleEmail: { $type: "string" } } },
  );
  return db;
}

export async function disconnectDb() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

export function profilesCollection() {
  if (!db) throw new Error("DB not connected");
  return db.collection("profiles");
}
