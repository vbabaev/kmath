import { connectDb, disconnectDb, profilesCollection } from "./db.js";

const DEFAULT_PROFILES = [
  { _id: "dad",  name: "Dad",  emoji: "👨", color: "indigo",  role: "teacher" },
  { _id: "kira", name: "Kira", emoji: "👧", color: "pink",    role: "student" },
  { _id: "test", name: "Test", emoji: "🧪", color: "emerald", role: "student" },
];

const PROFILE_DEFAULTS = {
  settings: { group: "school" },
  points: 0,
  sessions: [],
  packages: [],
  assignments: [],
  activeQuiz: null,
  googleEmail: null,
  schemaVersion: 1,
};

export async function seed() {
  await connectDb();
  const col = profilesCollection();
  const now = new Date().toISOString();
  let inserted = 0;
  for (const p of DEFAULT_PROFILES) {
    const doc = { ...PROFILE_DEFAULTS, ...p, createdAt: now, updatedAt: now };
    const result = await col.updateOne(
      { _id: p._id },
      { $setOnInsert: doc },
      { upsert: true },
    );
    if (result.upsertedCount > 0) inserted++;
  }
  return { inserted, total: DEFAULT_PROFILES.length };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seed()
    .then((r) => {
      console.log(`seeded: inserted ${r.inserted} of ${r.total} profiles`);
      return disconnectDb();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
