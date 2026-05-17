import { MongoClient } from "mongodb";
import { config } from "./config.js";

let client;
let db;

export async function connectDb(url = config.mongoUrl) {
  if (db) return db;
  client = new MongoClient(url);
  await client.connect();
  // db name is taken from the URL path; if absent, fall back to "klearn"
  let dbName;
  try {
    dbName = new URL(url).pathname.slice(1) || "klearn";
  } catch {
    dbName = "klearn";
  }
  db = client.db(dbName);
  // googleEmail must be unique across profiles (when set). Partial index
  // skips docs where the field is null so we can have many "no email" profiles.
  await db.collection("profiles").createIndex(
    { googleEmail: 1 },
    { unique: true, partialFilterExpression: { googleEmail: { $type: "string" } } },
  );
  // groupId lookups happen on every list / visibility check.
  await db.collection("profiles").createIndex({ groupId: 1 });
  await migrateLegacyProfiles(db);
  return db;
}

// One-shot migration for profiles created before the household-groups
// redesign. Detects flat `role: 'teacher' | 'student'` profiles with no
// `groupId`, gathers them into a single default group (first teacher
// becomes owner; other teachers become parents; students become
// children), and rewrites them in place. Idempotent — re-running is a
// no-op once every profile carries a groupId.
async function migrateLegacyProfiles(database) {
  const profiles = database.collection("profiles");
  const groups = database.collection("groups");
  const orphaned = await profiles.find({ groupId: { $exists: false } }).toArray();
  if (orphaned.length === 0) return;

  const teachers = orphaned.filter((p) => p.role === "teacher");
  const ownerCandidate = teachers[0] ?? orphaned[0];
  const now = new Date().toISOString();
  const groupId = `g-${ownerCandidate._id}`;
  const groupName = `${ownerCandidate.name}'s family`;

  await groups.updateOne(
    { _id: groupId },
    {
      $setOnInsert: {
        _id: groupId,
        name: groupName,
        ownerId: ownerCandidate._id,
        createdAt: now,
        schemaVersion: 1,
      },
      $set: { updatedAt: now },
    },
    { upsert: true },
  );

  for (const p of orphaned) {
    let nextRole;
    if (p._id === ownerCandidate._id) nextRole = "owner";
    else if (p.role === "teacher") nextRole = "parent";
    else nextRole = "child";
    await profiles.updateOne(
      { _id: p._id },
      { $set: { groupId, role: nextRole, updatedAt: now } },
    );
  }
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

export function groupsCollection() {
  if (!db) throw new Error("DB not connected");
  return db.collection("groups");
}
