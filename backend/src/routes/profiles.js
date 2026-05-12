import { Router } from "express";
import { profilesCollection } from "../db.js";
import {
  ProfileBodySchema,
  CreateProfileSchema,
  ActiveQuizSchema,
  validateAppendOnly,
  validatePackages,
  validateActiveQuizTransition,
} from "../schema.js";
import { requireAuth, requireProfileAccess, requireAdult, ADULT_ROLES } from "../auth.js";
import { makeProfile, generateProfileId } from "../profile-factory.js";

const router = Router();

function toClient(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

async function emailTakenByOther(email, exceptId) {
  if (!email) return false;
  const doc = await profilesCollection().findOne({
    googleEmail: email,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });
  return !!doc;
}

router.get("/", requireAuth, async (req, res) => {
  // Group-scoped. Adults see self + all children in their group. Children
  // see only themselves. Other adults in the group are intentionally not
  // returned here — their detail page is off-limits. (Adults can list
  // them via GET /api/groups/me for the management UI.)
  const docs = await profilesCollection().find({ groupId: req.user.groupId }).toArray();
  const isUserAdult = ADULT_ROLES.has(req.user.role);
  const visible = isUserAdult
    ? docs.filter((d) => d._id === req.user.profileId || d.role === "child")
    : docs.filter((d) => d._id === req.user.profileId);
  res.json(visible.map(toClient));
});

router.post("/", requireAdult, async (req, res) => {
  const parsed = CreateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid body", details: parsed.error.issues });
  }
  const newRole = parsed.data.role;
  // Only the owner can promote another adult; anyone admin-or-up can add a child.
  if (newRole === "parent" && req.user.role !== "owner") {
    return res.status(403).json({ error: "only owner can invite parents" });
  }
  const googleEmail = parsed.data.googleEmail
    ? parsed.data.googleEmail.toLowerCase()
    : null;
  if (await emailTakenByOther(googleEmail)) {
    return res.status(409).json({ error: "email already used by another profile" });
  }
  const id = await generateProfileId(parsed.data.name);
  const doc = makeProfile({
    id,
    name: parsed.data.name,
    emoji: parsed.data.emoji,
    color: parsed.data.color,
    role: newRole,
    groupId: req.user.groupId,
    googleEmail,
  });
  try {
    await profilesCollection().insertOne(doc);
    res.status(201).json(toClient(doc));
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "conflict" });
    }
    throw err;
  }
});

router.get("/:id", requireProfileAccess, async (req, res) => {
  // requireProfileAccess already loaded the target as req.targetProfile.
  res.json(toClient(req.targetProfile));
});

router.put("/:id", requireProfileAccess, async (req, res) => {
  const id = req.params.id;
  const existing = req.targetProfile;

  const parsed = ProfileBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid body", details: parsed.error.issues });
  }

  const sessCheck = validateAppendOnly(existing.sessions ?? [], parsed.data.sessions);
  if (!sessCheck.ok) return res.status(409).json({ error: sessCheck.error });

  const pkgCheck = validatePackages(existing.packages ?? [], parsed.data.packages);
  if (!pkgCheck.ok) return res.status(409).json({ error: pkgCheck.error });

  const aqCheck = validateActiveQuizTransition(
    existing.activeQuiz ?? null,
    parsed.data.activeQuiz ?? null,
  );
  if (!aqCheck.ok) {
    return res.status(409).json({
      error: aqCheck.error,
      current: { activeQuiz: existing.activeQuiz ?? null, updatedAt: existing.updatedAt ?? null },
    });
  }

  // googleEmail: adults can change their own email and any child they
  // manage. requireProfileAccess already gates cross-adult attempts, so
  // by the time we're here it's either self or an adult-on-child write.
  // Children cannot change emails (even their own) — that's an admin
  // operation.
  let nextEmail = existing.googleEmail ?? null;
  const canChangeEmail = ADULT_ROLES.has(req.user.role);
  if (canChangeEmail && "googleEmail" in (req.body ?? {})) {
    const proposed = parsed.data.googleEmail
      ? parsed.data.googleEmail.toLowerCase()
      : null;
    if (proposed && (await emailTakenByOther(proposed, id))) {
      return res.status(409).json({ error: "email already used by another profile" });
    }
    nextEmail = proposed;
  }

  const now = new Date().toISOString();
  const next = {
    _id: id,
    name: parsed.data.name,
    emoji: parsed.data.emoji,
    color: parsed.data.color,
    role: existing.role,
    groupId: existing.groupId,
    settings: parsed.data.settings,
    points: Math.max(0, parsed.data.points),
    sessions: parsed.data.sessions,
    packages: parsed.data.packages,
    assignments: parsed.data.assignments,
    activeQuiz: parsed.data.activeQuiz ?? null,
    lastResult: "lastResult" in req.body
      ? (parsed.data.lastResult ?? null)
      : (existing.lastResult ?? null),
    googleEmail: nextEmail,
    createdAt: existing.createdAt ?? now,
    updatedAt: now,
    schemaVersion: 1,
  };

  await profilesCollection().replaceOne({ _id: id }, next);
  res.json(toClient(next));
});

// Live-sync read endpoint. Returns just the fields that change second-to-second
// during a quiz, so the client can poll cheaply without re-shipping the entire
// profile (sessions, packages, etc.).
router.get("/:id/sync", requireProfileAccess, async (req, res) => {
  const doc = await profilesCollection().findOne(
    { _id: req.params.id },
    { projection: { activeQuiz: 1, lastResult: 1, assignments: 1, updatedAt: 1 } },
  );
  if (!doc) return res.status(404).json({ error: "not found" });
  res.json({
    activeQuiz: doc.activeQuiz ?? null,
    lastResult: doc.lastResult ?? null,
    assignments: doc.assignments ?? [],
    updatedAt: doc.updatedAt ?? null,
  });
});

// Dedicated activeQuiz writer. Body is `{ activeQuiz: <snapshot> | null }`
// (wrapped to keep express.json strict mode happy). Enforces monotonic
// progress on snapshot→snapshot transitions; null transitions are always
// accepted (start / finalize / cancel).
router.put("/:id/active-quiz", requireProfileAccess, async (req, res) => {
  const id = req.params.id;
  const existing = await profilesCollection().findOne({ _id: id });
  if (!existing) return res.status(404).json({ error: "not found" });

  const body = req.body ?? {};
  if (!("activeQuiz" in body)) {
    return res.status(400).json({ error: "activeQuiz field required" });
  }

  let nextValue;
  if (body.activeQuiz === null) {
    nextValue = null;
  } else {
    const parsed = ActiveQuizSchema.safeParse(body.activeQuiz);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid activeQuiz", details: parsed.error.issues });
    }
    nextValue = parsed.data;
  }

  const check = validateActiveQuizTransition(existing.activeQuiz ?? null, nextValue);
  if (!check.ok) {
    return res.status(409).json({
      error: check.error,
      current: { activeQuiz: existing.activeQuiz ?? null, updatedAt: existing.updatedAt ?? null },
    });
  }

  const now = new Date().toISOString();
  await profilesCollection().updateOne(
    { _id: id },
    { $set: { activeQuiz: nextValue, updatedAt: now } },
  );
  res.json({ activeQuiz: nextValue, updatedAt: now });
});

export default router;
