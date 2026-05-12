import { Router } from "express";
import { groupsCollection, profilesCollection } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Returns the requester's own group plus a roster of every member
// (basic identity fields only — never the full profile, since adults
// cannot open each other's detail pages). This is what the management
// UI ("who's in my household") consumes.
router.get("/me", requireAuth, async (req, res) => {
  const group = await groupsCollection().findOne({ _id: req.user.groupId });
  if (!group) return res.status(404).json({ error: "not found" });
  const members = await profilesCollection()
    .find(
      { groupId: req.user.groupId },
      { projection: { _id: 1, name: 1, emoji: 1, color: 1, role: 1, googleEmail: 1 } },
    )
    .toArray();
  res.json({
    id: group._id,
    name: group.name,
    ownerId: group.ownerId,
    members: members.map((m) => ({
      id: m._id,
      name: m.name,
      emoji: m.emoji,
      color: m.color,
      role: m.role,
      googleEmail: m.googleEmail ?? null,
    })),
  });
});

export default router;
