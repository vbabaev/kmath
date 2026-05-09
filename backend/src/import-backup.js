import { readFileSync } from "node:fs";
import { connectDb, disconnectDb, profilesCollection } from "./db.js";

const PROFILE_PREFIX = "kmath.profile.";

export async function importBackup(path) {
  const raw = readFileSync(path, "utf8");
  const data = JSON.parse(raw);

  await connectDb();
  const col = profilesCollection();
  const now = new Date().toISOString();

  let imported = 0;
  let skipped = 0;
  const ids = [];

  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(PROFILE_PREFIX)) {
      skipped++;
      continue;
    }
    const id = key.slice(PROFILE_PREFIX.length);
    const { id: _drop, ...rest } = value ?? {};

    // Mirror the legacy migrations that ensureSeeded() applies in the frontend.
    if (rest.assignment && !rest.assignments) {
      rest.assignments = [rest.assignment];
      delete rest.assignment;
    }
    if (!Array.isArray(rest.assignments)) rest.assignments = [];
    if (!Array.isArray(rest.packages)) rest.packages = [];
    if (!rest.role) rest.role = "student";
    if (!rest.settings || typeof rest.settings !== "object") rest.settings = { group: "school" };
    if (typeof rest.points !== "number") rest.points = 0;
    if (!Array.isArray(rest.sessions)) rest.sessions = [];
    if (rest.activeQuiz === undefined) rest.activeQuiz = null;

    const doc = {
      _id: id,
      ...rest,
      googleEmail: rest.googleEmail ?? null,
      createdAt: rest.createdAt ?? now,
      updatedAt: now,
      schemaVersion: 1,
    };

    await col.replaceOne({ _id: id }, doc, { upsert: true });
    imported++;
    ids.push(id);
  }

  return { imported, skipped, ids };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: node src/import-backup.js <path-to-backup.json>");
    process.exit(1);
  }
  importBackup(path)
    .then((r) => {
      console.log(`imported ${r.imported} profiles (${r.ids.join(", ") || "none"}); skipped ${r.skipped} non-profile keys`);
      return disconnectDb();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
