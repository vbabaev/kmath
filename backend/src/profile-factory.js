import { profilesCollection } from "./db.js";

const DEFAULTS = {
  settings: { group: "school" },
  points: 0,
  sessions: [],
  packages: [],
  assignments: [],
  activeQuiz: null,
  schemaVersion: 1,
};

export function makeProfile({ id, name, emoji, color, role, googleEmail = null }) {
  const now = new Date().toISOString();
  return {
    _id: id,
    name,
    emoji,
    color,
    role,
    ...DEFAULTS,
    googleEmail,
    createdAt: now,
    updatedAt: now,
  };
}

export function slugify(name) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "profile"
  );
}

// Slug from name, suffixed with -2, -3, ... if needed. Falls back to a
// random suffix if 100 attempts collide (effectively never).
export async function generateProfileId(name) {
  const base = slugify(name);
  const col = profilesCollection();
  for (let i = 0; i < 100; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await col.findOne({ _id: candidate }, { projection: { _id: 1 } });
    if (!existing) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}
