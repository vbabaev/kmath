import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, disconnectDb, profilesCollection } from "../src/db.js";
import { createApp } from "../src/app.js";

let mongo;
let app;

const studentSeed = (overrides = {}) => ({
  _id: "kira",
  name: "Kira",
  emoji: "👧",
  color: "pink",
  role: "student",
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

const teacherSeed = () => studentSeed({ _id: "dad", name: "Dad", emoji: "👨", color: "indigo", role: "teacher" });

const otherStudentSeed = () => studentSeed({ _id: "test", name: "Test", emoji: "🧪", color: "emerald", role: "student" });

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
  await profilesCollection().deleteMany({});
  await profilesCollection().insertMany([studentSeed(), teacherSeed(), otherStudentSeed()]);
});

describe("auth", () => {
  it("rejects unauthenticated reads with 401", async () => {
    await request(app).get("/api/profiles").expect(401);
    await request(app).get("/api/profiles/kira").expect(401);
  });

  it("rejects student reading another profile with 403", async () => {
    await asKira(request(app).get("/api/profiles/dad")).expect(403);
    await asKira(request(app).get("/api/profiles/test")).expect(403);
  });

  it("allows teacher to read any profile", async () => {
    await asDad(request(app).get("/api/profiles/kira")).expect(200);
    await asDad(request(app).get("/api/profiles/test")).expect(200);
    await asDad(request(app).get("/api/profiles/dad")).expect(200);
  });

  it("rejects student writing another profile with 403", async () => {
    await asKira(request(app).put("/api/profiles/dad").send(baseBody())).expect(403);
  });
});

describe("GET /api/profiles", () => {
  it("returns all profiles for a teacher", async () => {
    const res = await asDad(request(app).get("/api/profiles")).expect(200);
    assert.equal(res.body.length, 3);
    const ids = res.body.map((p) => p.id).sort();
    assert.deepEqual(ids, ["dad", "kira", "test"]);
  });

  it("returns only own profile for a student", async () => {
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
    const res = await asKira(request(app).put("/api/profiles/kira").send({ ...baseBody(), role: "teacher" })).expect(200);
    assert.equal(res.body.role, "student");
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
});
