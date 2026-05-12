import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, disconnectDb, profilesCollection } from "../src/db.js";
import { createApp } from "../src/app.js";

let mongo;
let app;

const GROUP_ID = "g-dad";

const studentSeed = (overrides = {}) => ({
  _id: "kira",
  name: "Kira",
  emoji: "👧",
  color: "pink",
  role: "child",
  groupId: GROUP_ID,
  settings: { group: "school" },
  points: 100,
  sessions: [],
  packages: [],
  assignments: [],
  activeQuiz: null,
  googleEmail: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  schemaVersion: 1,
  ...overrides,
});

const teacherSeed = () => studentSeed({ _id: "dad", name: "Dad", emoji: "👨", color: "indigo", role: "owner" });

const otherStudentSeed = () => studentSeed({ _id: "test", name: "Test", emoji: "🧪", color: "emerald", role: "child" });

const groupSeed = () => ({
  _id: GROUP_ID,
  name: "Dad's family",
  ownerId: "dad",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  schemaVersion: 1,
});

const session = (overrides = {}) => ({
  date: "2026-01-01",
  startedAt: "2026-01-01T00:00:00.000Z",
  group: "school",
  score: 10,
  completed: 1,
  initialCount: 1,
  totalAttempts: 1,
  durationMs: 1000,
  modules: [],
  ...overrides,
});

const pkg = (overrides = {}) => ({
  id: "pkg_1",
  type: "15min",
  label: "15 iPad minutes",
  minutes: 15,
  cost: 300,
  emoji: "📱",
  createdAt: "2026-01-01T00:00:00.000Z",
  status: "active",
  usedAt: null,
  ...overrides,
});

const baseBody = () => ({
  name: "Kira",
  emoji: "👧",
  color: "pink",
  settings: { group: "school" },
  points: 100,
  sessions: [],
  packages: [],
  assignments: [],
});

const asKira = (req) => req.set("X-Profile-Id", "kira");
const asDad = (req) => req.set("X-Profile-Id", "dad");
const asTest = (req) => req.set("X-Profile-Id", "test");

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri() + "kmath-test");
  app = createApp({ logger: false, auth: "dev" });
});

after(async () => {
  await disconnectDb();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  const { groupsCollection } = await import("../src/db.js");
  await profilesCollection().deleteMany({});
  await groupsCollection().deleteMany({});
  await groupsCollection().insertOne(groupSeed());
  await profilesCollection().insertMany([studentSeed(), teacherSeed(), otherStudentSeed()]);
});

describe("auth", () => {
  it("rejects unauthenticated reads with 401", async () => {
    await request(app).get("/api/profiles").expect(401);
    await request(app).get("/api/profiles/kira").expect(401);
  });

  it("rejects child reading another profile with 403", async () => {
    await asKira(request(app).get("/api/profiles/dad")).expect(403);
    await asKira(request(app).get("/api/profiles/test")).expect(403);
  });

  it("allows owner to read any child in same group", async () => {
    await asDad(request(app).get("/api/profiles/kira")).expect(200);
    await asDad(request(app).get("/api/profiles/test")).expect(200);
    await asDad(request(app).get("/api/profiles/dad")).expect(200);
  });

  it("rejects child writing another profile with 403", async () => {
    await asKira(request(app).put("/api/profiles/dad").send(baseBody())).expect(403);
  });
});

describe("GET /api/profiles", () => {
  it("returns self + children for an owner (NOT other adults)", async () => {
    const res = await asDad(request(app).get("/api/profiles")).expect(200);
    const ids = res.body.map((p) => p.id).sort();
    assert.deepEqual(ids, ["dad", "kira", "test"]);
  });

  it("returns only own profile for a child", async () => {
    const res = await asKira(request(app).get("/api/profiles")).expect(200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].id, "kira");
  });
});

describe("GET /api/profiles/:id", () => {
  it("returns the full profile", async () => {
    const res = await asKira(request(app).get("/api/profiles/kira")).expect(200);
    assert.equal(res.body.id, "kira");
    assert.equal(res.body.points, 100);
  });

  it("404s on missing", async () => {
    await asDad(request(app).get("/api/profiles/ghost")).expect(404);
  });
});

describe("POST /api/profiles", () => {
  const create = (overrides = {}) => ({
    name: "New Kid",
    emoji: "🦊",
    color: "violet",
    role: "child",
    ...overrides,
  });

  it("creates a new child profile when called by an owner", async () => {
    const res = await asDad(request(app).post("/api/profiles").send(create())).expect(201);
    assert.equal(res.body.name, "New Kid");
    assert.equal(res.body.role, "child");
    assert.equal(res.body.id, "new-kid");
    assert.equal(res.body.googleEmail, null);
    assert.equal(res.body.groupId, GROUP_ID);
  });

  it("rejects creation by a child (403)", async () => {
    await asKira(request(app).post("/api/profiles").send(create())).expect(403);
  });

  it("owner can create a parent", async () => {
    const res = await asDad(
      request(app).post("/api/profiles").send(create({ name: "Mom", role: "parent" })),
    ).expect(201);
    assert.equal(res.body.role, "parent");
  });

  it("rejects unauthenticated creation (401)", async () => {
    await request(app).post("/api/profiles").send(create()).expect(401);
  });

  it("400s on missing required fields", async () => {
    await asDad(request(app).post("/api/profiles").send({ name: "X" })).expect(400);
  });

  it("suffixes the id when the slug collides", async () => {
    const res = await asDad(request(app).post("/api/profiles").send(create({ name: "Kira" }))).expect(201);
    assert.equal(res.body.id, "kira-2");
  });

  it("rejects an email already used by another profile (409)", async () => {
    await asDad(request(app).put("/api/profiles/kira").send({ ...baseBody(), googleEmail: "k@example.com" })).expect(200);
    await asDad(request(app).post("/api/profiles").send(create({ googleEmail: "k@example.com" }))).expect(409);
  });
});

describe("PUT /api/profiles/:id", () => {
  it("updates points", async () => {
    const res = await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), points: 150 })).expect(200);
    assert.equal(res.body.points, 150);
    assert.equal(res.body.id, "kira");
  });

  it("clamps negative points to 0", async () => {
    const res = await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), points: -50 })).expect(200);
    assert.equal(res.body.points, 0);
  });

  it("ignores role from body (immutable)", async () => {
    const res = await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), role: "owner" })).expect(200);
    assert.equal(res.body.role, "child");
  });

  it("appends a session", async () => {
    const res = await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), sessions: [session()] })).expect(200);
    assert.equal(res.body.sessions.length, 1);
  });

  it("rejects shortened sessions array (409)", async () => {
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), sessions: [session()] })).expect(200);
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), sessions: [] })).expect(409);
  });

  it("rejects modifying past sessions (409)", async () => {
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), sessions: [session()] })).expect(200);
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), sessions: [session({ score: 9999 })] })).expect(409);
  });

  it("allows toggling package status", async () => {
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), packages: [pkg()] })).expect(200);
    const res = await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), packages: [pkg({ status: "used", usedAt: "2026-01-02T00:00:00.000Z" })] })).expect(200);
    assert.equal(res.body.packages[0].status, "used");
  });

  it("teacher can toggle a student's package status", async () => {
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), packages: [pkg()] })).expect(200);
    const res = await asDad(request(app).put("/api/profiles/kira").send({ ...baseBody(), packages: [pkg({ status: "used", usedAt: "2026-01-02T00:00:00.000Z" })] })).expect(200);
    assert.equal(res.body.packages[0].status, "used");
  });

  it("rejects mutating an immutable package field (409)", async () => {
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), packages: [pkg()] })).expect(200);
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), packages: [pkg({ cost: 1 })] })).expect(409);
  });

  it("rejects removing an existing package (409)", async () => {
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), packages: [pkg()] })).expect(200);
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), packages: [] })).expect(409);
  });

  it("400s on a body missing required fields", async () => {
    await asKira(request(app).put("/api/profiles/kira").send({ name: "Kira" })).expect(400);
  });

  it("404s on missing profile", async () => {
    await asDad(request(app).put("/api/profiles/ghost").send(baseBody())).expect(404);
  });

  it("teacher can set googleEmail on a student", async () => {
    const res = await asDad(request(app).put("/api/profiles/kira").send({ ...baseBody(), googleEmail: "kira@example.com" })).expect(200);
    assert.equal(res.body.googleEmail, "kira@example.com");
  });

  it("teacher can clear googleEmail", async () => {
    await asDad(request(app).put("/api/profiles/kira").send({ ...baseBody(), googleEmail: "kira@example.com" })).expect(200);
    const res = await asDad(request(app).put("/api/profiles/kira").send({ ...baseBody(), googleEmail: null })).expect(200);
    assert.equal(res.body.googleEmail, null);
  });

  it("student cannot set their own googleEmail (silently ignored)", async () => {
    const res = await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), googleEmail: "self@example.com" })).expect(200);
    assert.equal(res.body.googleEmail, null);
  });

  it("teacher cannot set a googleEmail already used by another profile (409)", async () => {
    await asDad(request(app).put("/api/profiles/kira").send({ ...baseBody(), googleEmail: "shared@example.com" })).expect(200);
    await asDad(request(app).put("/api/profiles/test").send({ ...baseBody(), name: "Test", googleEmail: "shared@example.com" })).expect(409);
  });
});

describe("household visibility", () => {
  beforeEach(async () => {
    // Add a co-parent (Mom) in the same group as Dad.
    await profilesCollection().insertOne(
      studentSeed({ _id: "mom", name: "Mom", emoji: "👩", color: "rose", role: "parent" }),
    );
  });

  it("owner cannot open a co-parent's profile (403)", async () => {
    await asDad(request(app).get("/api/profiles/mom")).expect(403);
  });

  it("parent cannot open the owner's profile (403)", async () => {
    const asMom = (req) => req.set("X-Profile-Id", "mom");
    await asMom(request(app).get("/api/profiles/dad")).expect(403);
  });

  it("parent CAN open a child's profile", async () => {
    const asMom = (req) => req.set("X-Profile-Id", "mom");
    await asMom(request(app).get("/api/profiles/kira")).expect(200);
  });

  it("GET /api/profiles omits other adults from an adult's list", async () => {
    const res = await asDad(request(app).get("/api/profiles")).expect(200);
    const ids = res.body.map((p) => p.id).sort();
    assert.deepEqual(ids, ["dad", "kira", "test"]);
  });

  it("rejects a child creating a parent (403)", async () => {
    await asKira(
      request(app).post("/api/profiles").send({
        name: "Boss",
        emoji: "👤",
        color: "indigo",
        role: "parent",
      }),
    ).expect(403);
  });

  it("rejects a parent creating another parent (403)", async () => {
    const asMom = (req) => req.set("X-Profile-Id", "mom");
    await asMom(
      request(app).post("/api/profiles").send({
        name: "Uncle",
        emoji: "🧔",
        color: "amber",
        role: "parent",
      }),
    ).expect(403);
  });

  it("parent can create a child", async () => {
    const asMom = (req) => req.set("X-Profile-Id", "mom");
    const res = await asMom(
      request(app).post("/api/profiles").send({
        name: "Junior",
        emoji: "🧒",
        color: "amber",
        role: "child",
      }),
    ).expect(201);
    assert.equal(res.body.role, "child");
    assert.equal(res.body.groupId, GROUP_ID);
  });

  it("cross-group access is 403 even between adults", async () => {
    // Set up a second household.
    const { groupsCollection } = await import("../src/db.js");
    await groupsCollection().insertOne({
      _id: "g-other",
      name: "Other family",
      ownerId: "other",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    });
    await profilesCollection().insertOne(
      studentSeed({
        _id: "other",
        name: "Other",
        emoji: "🙂",
        color: "amber",
        role: "owner",
        groupId: "g-other",
      }),
    );
    await asDad(request(app).get("/api/profiles/other")).expect(403);
    // And the cross-group child is invisible too.
    await profilesCollection().insertOne(
      studentSeed({
        _id: "their-kid",
        name: "Their Kid",
        emoji: "🧒",
        color: "amber",
        role: "child",
        groupId: "g-other",
      }),
    );
    await asDad(request(app).get("/api/profiles/their-kid")).expect(403);
  });
});

describe("GET /api/groups/me", () => {
  beforeEach(async () => {
    await profilesCollection().insertOne(
      studentSeed({ _id: "mom", name: "Mom", emoji: "👩", color: "rose", role: "parent" }),
    );
  });

  it("returns the group with all member summaries (incl. other adults)", async () => {
    const res = await asDad(request(app).get("/api/groups/me")).expect(200);
    assert.equal(res.body.id, GROUP_ID);
    assert.equal(res.body.ownerId, "dad");
    const roles = res.body.members.map((m) => m.role).sort();
    assert.deepEqual(roles, ["child", "child", "owner", "parent"]);
  });

  it("a child can see member summaries too", async () => {
    const res = await asKira(request(app).get("/api/groups/me")).expect(200);
    assert.equal(res.body.id, GROUP_ID);
    assert.ok(res.body.members.length >= 1);
  });

  it("401 when unauthenticated", async () => {
    await request(app).get("/api/groups/me").expect(401);
  });
});

const sampleSnapshot = (overrides = {}) => ({
  problems: [{ moduleId: "multiplication", problem: { a: 3, b: 4, answer: 12 } }],
  queue: [{ moduleId: "multiplication", problem: { a: 3, b: 4, answer: 12 } }],
  index: 0,
  score: 0,
  streak: 0,
  problemAttempts: 0,
  totalAttempts: 0,
  completedProblems: [],
  isAssignment: false,
  ...overrides,
});

describe("GET /api/profiles/:id/sync", () => {
  it("returns the live-changing slice", async () => {
    const res = await asKira(request(app).get("/api/profiles/kira/sync")).expect(200);
    assert.deepEqual(res.body.assignments, []);
    assert.equal(res.body.activeQuiz, null);
    assert.ok("updatedAt" in res.body);
  });

  it("reflects an active quiz after a write", async () => {
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot() }),
    ).expect(200);
    const res = await asKira(request(app).get("/api/profiles/kira/sync")).expect(200);
    assert.equal(res.body.activeQuiz.index, 0);
  });

  it("teacher can sync a student's profile", async () => {
    await asDad(request(app).get("/api/profiles/kira/sync")).expect(200);
  });

  it("student cannot sync another profile (403)", async () => {
    await asKira(request(app).get("/api/profiles/dad/sync")).expect(403);
  });

  it("401 when unauthenticated", async () => {
    await request(app).get("/api/profiles/kira/sync").expect(401);
  });
});

describe("PUT /api/profiles/:id/active-quiz", () => {
  it("writes a fresh snapshot", async () => {
    const snap = sampleSnapshot();
    const res = await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: snap }),
    ).expect(200);
    assert.equal(res.body.activeQuiz.index, 0);
    assert.ok(res.body.updatedAt);
  });

  it("clears with null", async () => {
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot() }),
    ).expect(200);
    const res = await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: null }),
    ).expect(200);
    assert.equal(res.body.activeQuiz, null);
  });

  it("accepts monotonic progress", async () => {
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot({ index: 0, totalAttempts: 0 }) }),
    ).expect(200);
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot({ index: 1, totalAttempts: 1 }) }),
    ).expect(200);
  });

  it("rejects index regression (409)", async () => {
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot({ index: 2, totalAttempts: 2 }) }),
    ).expect(200);
    const res = await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot({ index: 1, totalAttempts: 2 }) }),
    ).expect(409);
    assert.ok(res.body.current);
    assert.equal(res.body.current.activeQuiz.index, 2);
  });

  it("rejects totalAttempts regression (409)", async () => {
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot({ index: 0, totalAttempts: 5 }) }),
    ).expect(200);
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot({ index: 0, totalAttempts: 3 }) }),
    ).expect(409);
  });

  it("teacher can write a student's active quiz", async () => {
    await asDad(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot() }),
    ).expect(200);
  });

  it("student cannot write another student's active quiz (403)", async () => {
    await asKira(
      request(app).put("/api/profiles/test/active-quiz").send({ activeQuiz: sampleSnapshot() }),
    ).expect(403);
  });

  it("400 when activeQuiz field missing", async () => {
    await asKira(request(app).put("/api/profiles/kira/active-quiz").send({})).expect(400);
  });

  it("400 on malformed snapshot", async () => {
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: { index: "not a number" } }),
    ).expect(400);
  });

  it("404 on missing profile", async () => {
    await asDad(
      request(app).put("/api/profiles/ghost/active-quiz").send({ activeQuiz: null }),
    ).expect(404);
  });
});

describe("lastResult sync", () => {
  const lastResult = () => ({
    score: 100,
    totalAttempts: 12,
    initialCount: 10,
    completedProblems: [
      { moduleId: "multiplication", attempts: 1, timeMs: 3000 },
      { moduleId: "division", attempts: 2, timeMs: 5000 },
    ],
  });

  it("persists lastResult via full PUT and returns it via /sync", async () => {
    await asKira(
      request(app).put("/api/profiles/kira").send({ ...baseBody(), lastResult: lastResult() }),
    ).expect(200);
    const res = await asKira(request(app).get("/api/profiles/kira/sync")).expect(200);
    assert.equal(res.body.lastResult.score, 100);
    assert.equal(res.body.lastResult.completedProblems.length, 2);
  });

  it("clears lastResult when explicitly set to null", async () => {
    await asKira(
      request(app).put("/api/profiles/kira").send({ ...baseBody(), lastResult: lastResult() }),
    ).expect(200);
    await asKira(
      request(app).put("/api/profiles/kira").send({ ...baseBody(), lastResult: null }),
    ).expect(200);
    const res = await asKira(request(app).get("/api/profiles/kira/sync")).expect(200);
    assert.equal(res.body.lastResult, null);
  });

  it("preserves lastResult when the body omits the field", async () => {
    await asKira(
      request(app).put("/api/profiles/kira").send({ ...baseBody(), lastResult: lastResult() }),
    ).expect(200);
    // baseBody() does not include lastResult — older clients shouldn't clobber it.
    await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), points: 200 })).expect(200);
    const res = await asKira(request(app).get("/api/profiles/kira/sync")).expect(200);
    assert.equal(res.body.lastResult.score, 100);
  });
});

describe("PUT /api/profiles/:id activeQuiz monotonicity", () => {
  it("full PUT also rejects activeQuiz regression (409)", async () => {
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot({ index: 3, totalAttempts: 3 }) }),
    ).expect(200);
    await asKira(
      request(app).put("/api/profiles/kira").send({ ...baseBody(), activeQuiz: sampleSnapshot({ index: 1, totalAttempts: 3 }) }),
    ).expect(409);
  });

  it("full PUT can clear activeQuiz to null (finalize)", async () => {
    await asKira(
      request(app).put("/api/profiles/kira/active-quiz").send({ activeQuiz: sampleSnapshot({ index: 3, totalAttempts: 3 }) }),
    ).expect(200);
    const res = await asKira(
      request(app).put("/api/profiles/kira").send({ ...baseBody(), activeQuiz: null }),
    ).expect(200);
    assert.equal(res.body.activeQuiz, null);
  });
});
