import { Router } from "express";
import { profilesCollection } from "../db.js";
import { ProfileBodySchema, validateAppendOnly, validatePackages } from "../schema.js";

const router = Router();

function toClient(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

router.get("/", async (_req, res) => {
  const docs = await profilesCollection()
    .find({}, { projection: { _id: 1, name: 1, emoji: 1, color: 1, role: 1 } })
    .toArray();
  res.json(docs.map(toClient));
});

router.get("/:id", async (req, res) => {
  const doc = await profilesCollection().findOne({ _id: req.params.id });
  if (!doc) return res.status(404).json({ error: "not found" });
  res.json(toClient(doc));
});

router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const existing = await profilesCollection().findOne({ _id: id });
  if (!existing) return res.status(404).json({ error: "not found" });

  const parsed = ProfileBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid body", details: parsed.error.issues });
  }

  const sessCheck = validateAppendOnly(existing.sessions ?? [], parsed.data.sessions);
  if (!sessCheck.ok) return res.status(409).json({ error: sessCheck.error });

  const pkgCheck = validatePackages(existing.packages ?? [], parsed.data.packages);
  if (!pkgCheck.ok) return res.status(409).json({ error: pkgCheck.error });

  const now = new Date().toISOString();
  const next = {
    _id: id,
    name: parsed.data.name,
    emoji: parsed.data.emoji,
    color: parsed.data.color,
    role: existing.role,
    settings: parsed.data.settings,
    points: Math.max(0, parsed.data.points),
    sessions: parsed.data.sessions,
    packages: parsed.data.packages,
    assignments: parsed.data.assignments,
    activeQuiz: parsed.data.activeQuiz ?? null,
    googleEmail: existing.googleEmail ?? null,
    createdAt: existing.createdAt ?? now,
    updatedAt: now,
    schemaVersion: 1,
  };

  await profilesCollection().replaceOne({ _id: id }, next);
  res.json(toClient(next));
});

export default router;
