import { z } from "zod";

const SessionModuleSchema = z.object({
  id: z.string(),
  label: z.string(),
  attempted: z.number().int().nonnegative(),
  solved: z.number().int().nonnegative(),
  avgTimeMs: z.number().int().nonnegative(),
});

// Mood values captured around assignments. Optional on the session entry
// — Quick Quiz / Custom Mix sessions never set them. New sessions written
// from this version onward will include them when the kid played an
// assignment; older sessions remain valid (all fields are optional).
const MoodSchema = z.enum(["great", "good", "okay", "meh", "sad"]);

// One per problem the kid solved (or partially attempted) in this quiz —
// keyed by moduleId so the frontend can rebuild the Results breakdown via
// `getModule()`. `problem` is whatever shape the module's `generate()`
// returned and is opaque to the backend.
const SessionProblemSchema = z.object({
  moduleId: z.string(),
  problem: z.unknown(),
  attempts: z.number().int().positive(),
  timeMs: z.number().int().nonnegative(),
});

const SessionSchema = z.object({
  date: z.string(),
  startedAt: z.string(),
  group: z.string(),
  score: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  initialCount: z.number().int().nonnegative(),
  totalAttempts: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  modules: z.array(SessionModuleSchema),
  // Optional history fields — added in the "session history + moods"
  // release. Quiet on absence (old sessions / Quick Quiz sessions).
  isAssignment: z.boolean().optional(),
  isInfinite: z.boolean().optional(),
  moodStart: MoodSchema.optional(),
  moodEnd: MoodSchema.optional(),
  problems: z.array(SessionProblemSchema).optional(),
});

const PackageSchema = z.object({
  id: z.string(),
  type: z.enum(["15min", "60min"]),
  label: z.string(),
  minutes: z.number().int().positive(),
  cost: z.number().int().nonnegative(),
  emoji: z.string(),
  createdAt: z.string(),
  status: z.enum(["active", "used"]),
  usedAt: z.string().nullable(),
});

const AssignmentSchema = z.object({
  id: z.string(),
  from: z.string(),
  fromName: z.string(),
  counts: z.record(z.string(), z.number().int().nonnegative()),
  createdAt: z.string(),
});

// lastResult is the "pending Results screen" for this profile. It sticks
// around on the doc from `finishQuiz` until the user dismisses Results
// (Play Again or Home button), which is what lets other tabs / devices
// route to the same Results view via /sync.
export const LastResultSchema = z.object({
  score: z.number().int(),
  totalAttempts: z.number().int().nonnegative(),
  initialCount: z.number().int().nonnegative(),
  completedProblems: z.array(
    z.object({
      moduleId: z.string(),
      attempts: z.number().int().positive(),
      timeMs: z.number().int().nonnegative(),
    }),
  ),
});

// activeQuiz is opaque to the backend — it's a recovery snapshot. Validate
// just enough to ensure shape, leave the inner problem details as `any`.
export const ActiveQuizSchema = z.object({
  problems: z.array(z.any()),
  queue: z.array(z.any()),
  index: z.number().int().nonnegative(),
  score: z.number().int(),
  streak: z.number().int().nonnegative(),
  problemAttempts: z.number().int().nonnegative(),
  totalAttempts: z.number().int().nonnegative(),
  completedProblems: z.array(z.any()),
  isAssignment: z.boolean().optional(),
  isInfinite: z.boolean().optional(),
  // Session-scoped reward multiplier accumulated from per-problem
  // "modifier" buffs (e.g. star-boost). Defaults to 1 on a fresh
  // quiz; never drops below 1 or resets mid-session.
  starMultiplier: z.number().min(1).optional(),
});

// Body schema for PUT /api/profiles/:id. _id and role are intentionally
// not validated from the body — they're immutable from the client.
// googleEmail is optional/nullable; PUT handler only applies changes to
// it when the requester is a teacher.
export const ProfileBodySchema = z.object({
  name: z.string(),
  emoji: z.string(),
  color: z.string(),
  settings: z.object({ group: z.string() }),
  points: z.number().int(),
  sessions: z.array(SessionSchema),
  packages: z.array(PackageSchema),
  assignments: z.array(AssignmentSchema),
  activeQuiz: ActiveQuizSchema.nullable().optional(),
  lastResult: LastResultSchema.nullable().optional(),
  googleEmail: z.string().email().nullable().optional(),
});

export const CreateProfileSchema = z.object({
  name: z.string().min(1).max(50),
  emoji: z.string().min(1).max(10),
  color: z.string().min(1).max(20),
  // "owner" is never created via this endpoint — it's set during the
  // first-login bootstrap. Subsequent profiles are either co-parents
  // (only invitable by the owner) or children (any adult can add).
  role: z.enum(["parent", "child"]),
  googleEmail: z.string().email().nullable().optional(),
});

// sessions are append-only: every existing entry must remain, in order.
export function validateAppendOnly(existing, next) {
  if (next.length < existing.length) {
    return { ok: false, error: `sessions array shorter than existing (${next.length} < ${existing.length})` };
  }
  for (let i = 0; i < existing.length; i++) {
    if (JSON.stringify(existing[i]) !== JSON.stringify(next[i])) {
      return { ok: false, error: `session at index ${i} was modified` };
    }
  }
  return { ok: true };
}

// activeQuiz lifecycle: null→snapshot and snapshot→null are always ok
// (start/finalize). snapshot→snapshot must be monotonic in index and
// totalAttempts, so a stale tab can't drag the quiz backwards.
export function validateActiveQuizTransition(existing, next) {
  if (next === null || next === undefined) return { ok: true };
  if (existing === null || existing === undefined) return { ok: true };
  if (next.index < existing.index) {
    return { ok: false, error: `activeQuiz.index regression: ${next.index} < ${existing.index}` };
  }
  if (next.totalAttempts < existing.totalAttempts) {
    return { ok: false, error: `activeQuiz.totalAttempts regression: ${next.totalAttempts} < ${existing.totalAttempts}` };
  }
  return { ok: true };
}

// every existing package must still exist with immutable fields intact;
// only `status` and `usedAt` may change.
const PACKAGE_IMMUTABLE = ["type", "label", "minutes", "cost", "emoji", "createdAt"];
export function validatePackages(existing, next) {
  const nextById = new Map(next.map((p) => [p.id, p]));
  for (const p of existing) {
    const n = nextById.get(p.id);
    if (!n) return { ok: false, error: `package ${p.id} cannot be removed` };
    for (const field of PACKAGE_IMMUTABLE) {
      if (n[field] !== p[field]) {
        return { ok: false, error: `package ${p.id}.${field} cannot change` };
      }
    }
  }
  return { ok: true };
}
