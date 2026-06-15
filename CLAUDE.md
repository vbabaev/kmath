# KLearn — Learning App

A React web app for a 5th grader to practice across multiple top-level **groups** (School Math, Extra Math, Verbal Reasoning). Per-question correctness + per-session accuracy is the only "score" — there are no stars, no shop, no in-quiz boosters. More groups/modules can be added freely.

## Tech Stack
- **Vite 8 + React 19 + JavaScript** (no TypeScript)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (installed with `--legacy-peer-deps`)
- No router — screen state managed in `App.jsx` (`profilePicker | home | mood-start | quiz | mood-end | results | profile | sessionDetail | login`)

## Project Structure
```
src/
  App.jsx              # Root — screen state machine + active-profile state, routes to Profile/Picker/Home/Quiz/Results
  main.jsx             # Entry point
  settings.js          # Thin generic wrapper over localStorage['klearn.settings'] (app-level, e.g. activeProfile)
  profiles.js          # Profile CRUD + session logging (localStorage['klearn.profile.<id>'])
  index.css            # Only contains: @import "tailwindcss";
  components/
    ShapeCanvas.jsx    # SVG helpers: ShapeCanvas, HDim, VDim, SHAPE_FILL, SHAPE_STROKE
    Heatmap.jsx        # 30-day activity grid (5 intensity tiers)
    ProfileButton.jsx  # Avatar pill shown on Home + Quiz, opens Profile screen
    ModuleTag.jsx      # Module pill (emoji + label + ×N) used in assignment cards
    MoodBadge.jsx      # Tinted emoji+label pill for a mood value; used in history rows
  finn/
    Finn.jsx           # Floating bottom-right mascot wrapper + speech bubble
    FinnMascot.jsx     # SVG of Finn the Fennec Fox
    FinnContext.jsx    # FinnProvider + useFinn() — owns current message + auto-hide timer
    phrases.js         # PHRASES pools + pickPhrase()/pickAssignmentsPhrase() helpers
  modules/
    index.js           # MODULES, GROUPS, SUBGROUP_META, getModule(id), getModulesByGroup(groupId)
    multiplication.jsx
    division.jsx
    fractions.jsx      # Custom Input with format picker (whole/fraction/mixed)
    decimals.jsx
    rounding.jsx       # Round to nearest tenth or hundredth; integer arithmetic
    angles.jsx         # School Math — estimate / classify / triangle missing angle
    areas/             # subgroup: 'areas' (School Math)
      square.jsx
      rectangle.jsx
    rectangleCutout.jsx  # L-shape (Extra Math, standalone — no subgroup)
    word/              # subgroup: 'word'
      proportions.jsx
    complicatedPercent.jsx      # Extra Math — multi-template % module
    complicatedPercentData.js   # LIST_PROBLEMS + WORDS banks for the above
    primeSquareCubic.jsx        # Extra Math — pick the row with prime/square/cube
    verbal/            # group: 'verbal'
      wordSplit.jsx
      wordSplitData.js # Target words + source pool + indexed pair builder
      wordGap.jsx
      wordGapData.js   # 100 words × 3 gap configs each (prefix/middle/suffix), hand-curated decoys
      letterMath.jsx   # A–E stand for numbers; solve equation, pick the matching letter
  screens/
    ProfilePicker.jsx  # Netflix-style avatar grid, shown on first load or when switching
    Profile.jsx        # Stats page: points, 30-day heatmap, mood trend, all-time stats, History tabs (Assignments / All)
    Home.jsx           # Group pill tabs + Quick Quiz/Custom Mix; Shop + profile pill in top-right
    Quiz.jsx           # Consumes problems: [{ module, problem }]
    Results.jsx        # Exports `ResultsBreakdown` (reused by SessionDetail) + the screen wrapper with Play Again / Home
    SessionDetail.jsx  # Re-renders a past session via ResultsBreakdown by hydrating session.problems back into module refs
    MoodPicker.jsx     # 5-emoji-card picker; rendered on the `mood-start` and `mood-end` screens around assignments
```

## Groups & Subgroups
- **Top-level groups** (`GROUPS` in `modules/index.js`) are the three pill tabs on Home: `school` (School Math 🧮), `extra` (Extra Math ➕), `verbal` (Verbal Reasoning 📖).
- Every module declares `group: 'school' | 'extra' | 'verbal'`. Home filters modules by the active group; only matching modules appear in Quick Quiz and Custom Mix.
- **Subgroups** (`SUBGROUP_META`) are visual sub-sections within a single group, rendered by `SubgroupHeader` (e.g. `areas`, `word` inside School Math). A module declares `subgroup: '<id>'` to nest under one.
- Empty groups render a "coming soon ✨" card on Home.
- Active group is **per profile** — stored in `profile.settings.group`, not app-level settings.

## Profiles
- Three seeded profiles (configurable in `profiles.js` → `DEFAULT_PROFILES`): `dad` 👨 indigo, `kira` 👧 pink, `test` 🧪 emerald.
- `ensureSeeded()` (called from `App.jsx` on mount) creates any missing profiles and migrates a legacy top-level `settings.group` into Dad's profile.
- **Storage layout:**
  - `localStorage['klearn.settings']` → `{ activeProfile: '<id>' | null }` — app-level only.
  - `localStorage['klearn.profile.<id>']` → `{ id, name, emoji, color, role, settings: { group }, sessions: [], activeQuiz?, assignments?, points?, packages? }`. `points` and `packages` are legacy fields kept on disk for back-compat with profiles created before the stars/shop removal; the UI never reads them, but the backend's Zod schema still validates them as part of the PUT body, so they stay around as `0` / `[]`.
- **Role + group:** profiles now belong to a **household group** (a separate `groups` collection in Mongo). Each profile carries `groupId` plus one of three roles: `'owner'`, `'parent'`, `'child'`. Owner is the household creator (set by the bootstrap-on-first-login flow); parents are invited by the owner; children are added by any adult. Helpers in `src/profiles.js`: `isOwner(profile)`, `isAdult(profile)` (owner or parent), `isChild(profile)`. **Visibility:** adults see themselves + every child in their group. Adults **cannot** open another adult's profile — not even the owner can. Children only see themselves. The owner is identified by `groups.<id>.ownerId`. To see the full household roster (incl. other adults you can't open), call `GET /api/groups/me`.
- **`activeQuiz`** (optional) — snapshot of an in-progress quiz for F5 / tab-close recovery:
  ```js
  { problems: [{ moduleId, problem }],    // original queue (for initialCount)
    queue:    [{ moduleId, problem }],    // current queue (grows with retries)
    index, score, streak, problemAttempts, totalAttempts,
    completedProblems: [{ moduleId, problem, attempts, timeMs }],
    isAssignment }                        // true if this quiz came from a teacher assignment
  ```
  Module refs are serialised as `moduleId` (live module object can't be JSON-ified) and rehydrated in `App.hydrateQuizState` via `fromProblemRef`. Cleared on quiz finish/cancel; `input` / `feedback` / timers are NOT persisted (reset on restore).
- **`assignments`** (optional, students only) — **FIFO queue** of pending tasks from teachers:
  ```js
  [{ id: 'a_<ts>_<rand>',                 // unique (collision-proof replay)
     from: 'dad', fromName: 'Dad',
     counts: { [moduleId]: N, ... },      // same shape as Custom Mix
     createdAt: ISO }, ...]
  ```
  Append via `addAssignmentToProfile(studentId, assignment)` (IDs are generated internally). The student works through the queue head-first: `consumeActiveAssignment()` pops the first element when `App.startAssignment` fires, and the in-progress quiz carries `activeQuiz.isAssignment = true`. Legacy single-field `assignment` entries are migrated to `[assignment]` by `ensureSeeded` on next load.
  - Teacher's "Assign to {Name}" button shows a `+N` badge when the student already has N queued; new assignments **append**, they don't replace.
  - Student's Home replaces the quiz picker with a stacked list: `ActiveAssignmentCard` (first in queue, amber gradient, Start button) followed by `QueuedAssignmentCard` entries labelled "Up next" with `#2`, `#3`, …
  - Each card shows **module tags** via the shared `ModuleTag` component (`components/ModuleTag.jsx`) — a pill per non-zero module with the module's emoji, label, and `× N` count, tinted with the module's own `bgLight` / `border`. `moduleTagsFromCounts(counts)` is the helper that turns a counts map into `[{ moduleId, count }]`.
- **Session entry** (appended on quiz completion):
  ```js
  { date: 'YYYY-MM-DD', startedAt: ISO, group,
    score, completed, initialCount, totalAttempts, durationMs,
    modules:  [{ id, label, attempted, solved, avgTimeMs }],
    // Optional, written from the history+moods release onwards:
    isAssignment?: true,             // present only for teacher-assigned quizzes
    moodStart?: 'great'|'good'|'okay'|'meh'|'sad',  // mood captured before quiz
    moodEnd?:   'great'|'good'|'okay'|'meh'|'sad',  // mood captured after quiz
    problems?: [{ moduleId, problem, attempts, timeMs }] }   // per-problem replay payload
  ```
  Sessions are append-only. `score` is kept on every session entry for schema compatibility but is always `0` since stars were removed; the UI never reads it. All four new fields are **optional** — older sessions / Quick Quiz sessions simply omit them. The `problems` array carries the full per-problem `module.generate()` payload so `SessionDetail.jsx` can re-render the Results screen verbatim via `getModule(moduleId)`. Mood values are captured only for assignments (see "Mood flow" below); the Zod schema in `backend/src/schema.js` validates them as `z.enum(...)` and the inner `problem` payload as `z.unknown()`.
- **First load:** if no `activeProfile`, `App.jsx` shows `ProfilePicker`. After selection, it routes to `Home`.
- **Switching:** top-right pill on `Home` → `Profile` screen → "Switch profile" → back to `ProfilePicker`.
- **Heatmap:** last 30 days, bucketed by local `YYYY-MM-DD`. Intensity thresholds (problems solved that day): `0 → gray-100`, `1–3 → green-200`, `4–6 → green-400`, `7–9 → green-600`, `10+ → green-800`.
- **Tailwind color classes** for profiles live in `profiles.js` → `COLORS` / `getProfileColors(color)` — must be literal class strings (Tailwind JIT scans source). Add new colors here, not in JSX.

## Mood flow (assignments only)
- Two new screen states bracket every **assignment** quiz: `'mood-start'` (between accepting the assignment and entering Quiz) and `'mood-end'` (between finishing Quiz and Results). Quick Quiz / Custom Mix flow is unchanged — no mood prompts.
- Picker has 5 cards: 😄 Great / 😊 Good / 😐 Okay / 😟 Meh / 😢 Sad. No skip — the kid must pick one to advance.
- **Where the values live (audit surface):** `App.jsx` keeps three React-state values for the mood flow — `pendingAssignment` (popped assignment + generated problems between Home→mood-start→Quiz), `assignmentMoodStart` (mood string from mood-start, held through the whole quiz until `logSession`), and `pendingFinish` (Quiz result between Quiz→mood-end→Results). **None of these are written to `activeQuiz`** — the `validateActiveQuizTransition` monotonic check is brittle, and stashing extra fields there would invite sync conflicts. The trade-off: if the kid F5s on `mood-start`, they're dropped back to Home and have to re-tap "Start Assignment" (assignment queue is untouched — we pop only after the picker fires). If they F5 on `mood-end`, `activeQuiz` still holds the last-in-progress snapshot so they're routed back to the final Quiz problem, re-finish, and re-see `mood-end`. Mood values can also be "lost" across tab handoff (tab A captures mood-start, tab B finishes the quiz from sync) — best-effort capture, no enforcement.
- The two mood values + `isAssignment: true` are folded into the session entry inside `logSession(profile, result, extras)` (third arg added with this feature). For Quick Quiz / Custom Mix, App passes no `extras`, so those fields are simply omitted from the session entry.

## History view + per-module stats
- `Profile.jsx` now renders **all-time stats** (highlights grid + per-module table) and a **History section** with two tabs:
  - **Assignments** — sessions where `isAssignment === true`. Each row shows date, group, solved count, mood pills, +stars.
  - **All** — every session in the profile, newest first.
  - Clicking a row routes to `'sessionDetail'`, which re-uses `ResultsBreakdown` from `Results.jsx` to render the full per-problem breakdown for that historical session. Sessions written before this release lack `problems[]`; for those the detail page shows a "no replay available" notice but still shows mood/score.
- A **Mood trend** strip shows the last 10 mood pairs (start → end) for at-a-glance "how does she feel about assignments lately."
- **Stats aggregates** computed in `Profile.jsx → computeStats(sessions)`:
  - Per-module: `solved`, `accuracy %`, `avgMs`, `fastestMs` (from `problems[]`)
  - `totalSolved`, `mostPlayed`, `assignmentsCompleted`, `bestDay` (single calendar day with the most problems solved), `lastWeekSessions` (sessions in the trailing 7 local days)

## Module Interface
Each module exports a default object:
```js
{
  id, label, emoji, color, bgLight, border, description,
  group,                // REQUIRED — top-level group: 'school' | 'extra' | 'verbal'
  subgroup,             // optional — visual sub-section id (e.g. 'areas', 'word')
  inputHint,            // optional — placeholder for default text input
  defaultInput,         // optional — initial input state (default: '')
  defaultCount,         // number of questions for Quick Quiz (10 for most, 5 for word problems)
  generate(),           // returns a problem object (shape is module-specific)
  key(problem),         // returns a string key for deduplication
  View({ problem }),    // React component — renders the question display
  CorrectView,          // optional — replaces View while feedback === 'correct'; receives ({ problem, input }). Use for reveal animations.
  Input,                // optional — custom input ({ value, onChange, onSubmit, disabled })
  isComplete(value),    // optional — returns bool (default: value.trim() !== '')
  check(problem, input),// returns boolean; input type matches defaultInput
  displayAnswer(problem)// returns human-readable answer string
}
```

## Quiz Flow
1. `Home.jsx` calls `generateProblems(counts)` → `[{ module, problem }]`, deduplicated via `module.key()`, shuffled
2. Array passed via `App.jsx` → `Quiz.jsx`
3. Wrong answer: show "try again" feedback, reset input, **re-append problem to end of queue**, reset streak
4. Correct answer: advance, award points only on first try; records `timeMs` for that problem
5. On completion → `Results.jsx` (for normal quizzes) or `mood-end` then `Results.jsx` (for assignments), with `{ score, totalAttempts, completedProblems, initialCount }`
   - `completedProblems`: `[{ module, problem, attempts, timeMs }]` — one entry per solved problem instance, **including the live `problem` payload** so the History detail page can replay the exact question
   - `initialCount`: original queue length before any retries
- **Auto-save:** `Quiz` has a `useEffect` that writes the current state to `profile.activeQuiz` on every meaningful change (submit, retry). `App` detects `activeQuiz` on mount and on `selectProfile` via `enterProfile()` and routes straight into `Quiz` with `initialState` instead of `home`.
- **Cancel button** (top-left of Quiz, replaces the old "← Home" link): opens a confirmation modal noting how many problems are unsolved; confirm calls `onCancel()` → `App.cancelQuiz` which clears `activeQuiz` and returns to Home. No penalty, no session log for cancelled quizzes.
- **Assignment mode:** when `Quiz` receives `isAssignment={true}` (set by `App.startAssignment` and preserved across F5 via `activeQuiz.isAssignment`), the Cancel button is replaced by a "📚 Assignment" badge — the student must complete the quiz or pause via F5/tab-close, but cannot cancel out. On `finishQuiz`, `activeQuiz` is cleared and a normal session is logged; the `assignment` field was already cleared on start.
- **Profile access during a quiz:** `Quiz` renders a top-right `ProfileButton` (shared component at `components/ProfileButton.jsx`, also used by Home) that routes to the Profile page. From Profile the kid can still "Switch profile" during an assignment, but `App.goHome` is context-aware: if the current profile still has an `activeQuiz` when Home is requested, it re-enters the quiz instead of going Home — so students can't escape the assignment gate via Profile → Home. `getActiveProfile()` is read fresh from storage in `goHome` (not the React-state `activeProfile`) because Quiz's auto-save writes to storage without calling `refreshProfile`.

## Teacher / Assignment flow
- **Teacher UI (Custom Mix, teachers only):** below the existing "Start Quiz" button, an "Or assign to a student" grid appears with one pill per non-teacher profile (`getAssignableStudents(excludeId)`). Clicking a student calls `onAssign(studentId, counts)` → `App.assignCustomMix` which **appends** `{ id, from, fromName, counts, createdAt }` to the target student's `profile.assignments` queue. Home then resets the stepper counts and flashes a "✓ Assigned to {name}" toast. Each student pill carries a `+N` badge showing how many items are already queued for that student.
- **Student UI with pending assignments:** Home's mode switcher, Quick Quiz, and Custom Mix are all hidden. An `ActiveAssignmentCard` renders the head of the queue (teacher's name, total question count, **module tags** for each non-zero module, and a big "Start Assignment →" button), followed by an "Up next" list of `QueuedAssignmentCard`s (muted style, numbered `#2`, `#3`, …). The copy reminds the kid they can't start other quizzes until the current assignment (and any queued) are done.
- **Starting an assignment:** `App.startAssignment` reads the first element of `profile.assignments`, generates problems via `generateProblems`, **routes to the `mood-start` screen first** (no server write yet — assignment stays in the queue and `activeQuiz` is unwritten until the mood is captured). When the kid picks a mood, `onMoodStartPicked` pops the assignment from the queue, writes the fresh `activeQuiz` snapshot, and routes into Quiz with `isAssignment=true`. On completion, `finishQuiz` detects `isAssignmentQuiz` and routes to `mood-end` before logging — `onMoodEndPicked` calls `logSession(profile, result, { isAssignment, moodStart, moodEnd })`, then routes to Results.
- **Escape-proofing follow-up:** Results' "Play Again" would otherwise start a fresh regular quiz and bypass the queue. `App.playAgain` now reads the current profile and — if `assignments.length > 0` — calls `goHome()` (which itself routes back into Quiz if an `activeQuiz` is still live, or into the assignment card on Home otherwise).

## Finn the Fennec Fox (mascot)
- Floating bottom-right SVG character with a speech bubble; visible on every screen via `<Finn />` rendered at the root of `App.jsx`. Container is `pointer-events-none` so it never blocks underlying UI; only the bubble and mascot itself are clickable. The bubble dismisses on click.
- `FinnProvider` in `src/finn/FinnContext.jsx` owns the single current message + auto-hide timer (~18s, see `BUBBLE_TTL_MS`). Successive `say()` calls replace the current message and reset the timer.
- `useFinn()` exposes:
  - `say(category, vars)` — pick a random phrase from `PHRASES[category]` and fill `{name}`/`{count}` placeholders; one re-roll if it matches the previous pick from the same category (cheap dedup).
  - `sayAssignments(count, name)` — picks the right singular/plural assignments pool.
  - `clear()` — hide the bubble early.
- Triggers wired in:
  - `Home.jsx` mount → `sayAssignments(N, name)` if the queue is non-empty, else `say('greeting', {name})` (falls back to `'greetingNoName'` when nameless).
  - `Quiz.jsx` `useEffect` on `feedback` → `say('correct')` / `say('wrong')` on each transition (fires every retry, not just the first).
  - `Results.jsx` mount → `say('finish', {name: profileName})` (App passes `activeProfile.name` as `profileName`).
  - `MoodPicker.jsx` mount → `say(bubbleCategory, {name: profileName})` when `bubbleCategory` is set. App passes `'moodStart'` on the mood-start screen and `'moodEnd'` on mood-end; the static `title` prop stays as the page heading and Finn adds a randomized variant of the same question.
- All copy lives in `src/finn/phrases.js` — categories: `greeting`, `greetingNoName`, `assignmentsOne`, `assignmentsMany`, `correct`, `wrong`, `moodStart`, `moodEnd`, `finish`. Add variants by appending strings to the right array. `{name}`/`{count}` are the only supported placeholders; absent values render as empty string.

## Quiz Modes (Home screen)
- **Quick Quiz**: 10 questions from one selected topic
- **Custom Mix**: stepper (0–20) per topic, problems shuffled together

## Quiz feedback
- Wrong answer: stay on problem, no penalty; failed problems get a fresh instance re-appended to the queue so they can be retried.
- Quiz header shows `✓ N / total` (count solved out of original queue length); infinite mode shows `✓ N` only.
- Cancel button on a normal quiz: confirm modal warns the unsolved count, no other consequence; activeQuiz is cleared and the kid returns to Home with no session logged.
- Results screen: accuracy = `completedProblems.length / totalAttempts * 100%`, "X of N solved on first try", total time. Per-module stats — accuracy %, avg time per solve, sorted slowest-first; only shown when >1 module played.
- Results rank labels (purely cosmetic, accuracy-driven): Math Wizard (≥90%), Star Student (≥70%), Good Job (≥50%), Keep Practicing (<50%).
- **Removed (was here pre-2026-06):** point-per-correct + streak bonuses, the in-quiz `QUIZ_MODIFIERS` (Star Boost / Double), session star multiplier, cancel star-penalty, and the entire `Shop.jsx` iPad-time-package surface. `profile.points` and `profile.packages` still ride along on the wire shape (Zod schema) but the UI never reads or writes them; if those fields are ever fully retired, drop them from `ProfileBodySchema` first.

## Topics Implemented

School Math holds the bulk of modules; Extra Math has Word Problems + `complicatedPercent` + `primeSquareCubic` + `rectangleCutout`; Verbal Reasoning has `wordSplit`, `wordGap`, and `letterMath`.

- `multiplication` ✖️ — `{ a, b, answer }` — two 2-digit numbers
- `division` ➗ — `{ dividend, divisor, answer }` — divisor 2–12
- `fractions` 🍕 — `{ n1, n2, denom, answerNum, answerDen }` — custom Input, format picker, cross-multiply check
- `decimals` 🔢 — `{ left, right, op, answer }` — 1-decimal add/subtract
- `compare` ⚖️ — `{ num, den, decimal, fracOnLeft, answer }` — fraction vs decimal; answer is `'<'`/`'='`/`'>'`; 33% equal probability; denominators: 2,5,10,20,50,100; auto-submits on button click
- `rounding` 🎯 — `{ type, numStr, answer, answerDisplay }` — round to nearest tenth (X.YZ) or hundredth (X.YZW); 50% chance deciding digit is 4 or 5; integer arithmetic to avoid float issues
- `percent` 💯 — `{ num, den, pct, simplNum, simplDen, direction }` — convert fraction↔percentage; direction is `'toPercent'` or `'toFraction'`; only denominators dividing 100 (2,4,5,10,20,25,50); accepts any equivalent fraction; custom Input adapts to direction via `problem` prop
- `perimeters` 📏 — `{ shape, answer, ...dims }` — one of 6 shapes: square `{a}`, rectangle `{w,h}`, rhombus `{a}`, trapezoid `{a,b,c}` (isosceles, legs=c), pentagon `{a}` (regular), cutout `{W,H,cw,ch}` (L-shape, perimeter=2W+2H); SVG with SideLabel/TickMark helpers for diagonal sides
- `angles` 📐 — multi-kind angle module (school math, sky color). `generate()` picks one of three `kind`s with equal probability:
  - **estimate** — `{ kind:'estimate', angle, rotation, answer, choices: [30,45,60,90,120,135,150,180] }`. The displayed angle is `answer ± up to 3°` (jitter never crosses the half-gap to a neighboring bucket; the smallest gap between buckets is 15°). For `answer=180`, jitter is clamped to `[-3, 0]` so the visual stays a non-reflex straight line. 4×2 button grid.
  - **classify** — `{ kind:'classify', angle, rotation, answer:'acute'|'right'|'obtuse'|'straight'|'reflex', choices: [...5 ids] }`. Categories pull from fixed ranges in `CATEGORIES` (multiples of 5). Right is exactly 90°, straight is exactly 180°. 5×1 button grid showing labels (Acute/Right/Obtuse/Straight/Reflex).
  - **triangle** — `{ kind:'triangle', angles:[a,b,c], hiddenIdx, answer, choices }`. Three angles, each multiple of 5 in [25, 120], summing to 180. One vertex labelled `?`. Distractors are `answer ± {5..30}` excluding the two shown angles; 4-button grid.
  - All three `View`s render an SVG canvas + prompt; `CorrectView` overlays a bouncing answer pill (and for triangle, recolors the hidden label green with its value). `AngleCanvas` always draws ray 1 along `rotation°` and ray 2 along `rotation + angle°` (CCW); `TriangleCanvas` lays vertices via law of sines from a unit base AB and rescales to fit. Custom MC `Input` auto-submits on click.
- **Extra Math** (`group: 'extra'`):
  - **Word Problems subgroup** (📝, `subgroup: 'word'`):
    - `proportions` 💱 — `{ story, question, item1-3, aVal1-3($), bVal1-2(£), answer(£), choices[4] }` — currency exchange; 5 settings (NYC trip, US website, airport, street market, fan shop); 14 names, ~40 items; 8 rates; all whole numbers; 2×2 MC grid, auto-submits
  - `complicatedPercent` 🎯 ("Percent Puzzles", pink) — multi-template % module. Every problem's answer is guaranteed to be a whole-number percentage. `generate()` uniformly picks one of three templates and sets `problem.template = 'grid' | 'list' | 'word'`; `View` dispatches to per-template sub-views; `CorrectView` re-renders the same sub-view with `reveal` (highlights what was counted) plus a bouncing "X%" pill. Custom numeric `Input` (digits-only, max 3 chars, with a `%` suffix) includes its own Check-Answer button.
    - **Grid template** — `{ rows, cols, shaded, answer }`. Three grid configs: 10×10 (1%/cell, shaded ∈ 10..90), 5×4 (5%/cell, shaded ∈ 2..18), 2×5 (10%/cell, shaded ∈ 1..9). Cells are shaded contiguously from the top-left (full rows first, then partial). Reveal recolors shaded cells pink.
    - **List template** — `{ listId, items, listLabel, questionId, prompt, answer }`. Data in `complicatedPercentData.js` → `LIST_PROBLEMS`: 6 lists (months×12, names×10, colors×10, fruits×10, sports×10, weekdays×5). Every `{ listId, questionId }` pair has a hand-verified `count` that divides the list size into a whole percent (months only allow counts 3/6/9). Reveal highlights matching items in pink; `matchesQuestion(item, listId, questionId)` is a switch-based classifier that mirrors each question's rule (used only for the highlight — the stored `count` is the source of truth for the answer).
    - **Word template** — `{ word, kind, answer }` where `kind = 'vowels' | 'consonants'`. Word bank (`WORDS`) contains kid-known 4-, 5-, and 10-letter words only — lengths that divide 100 evenly. Vowel set is A/E/I/O/U (Y is a consonant). Reveal highlights matching letters in pink.
    - Dedup `key` = `cp:<template>:<subkey>`, where `_subkey` is grid size+shaded count / list-id+question-id / word+kind.
  - `primeSquareCubic` 🎲 ("Number Trio", violet) — `{ rows: [{prime, square, cube}]×5, answer: number }`. Show 5 rows under three column headers (Prime / Square / Cube); the kid clicks the row where all three values fit their column. Auto-submits on click. Pools: primes < 60, squares 1²..12² (≤144), cubes 1³..6³ (≤216). Generation picks one fully-correct row, then 4 wrong rows by corrupting 1 or 2 of the three fields with a hand-checked decoy (decoys are guaranteed not to belong to their target set), so every wrong row has exactly 1 or 2 correct cells. Custom MC `Input` renders the table with letters A–E; selected/correct/wrong rows recolor by inferring feedback from `disabled + value === answer`. Dedup `key` is the sorted set of row triples (so the same 5 triples in a different visual order count as duplicates).
- **Areas subgroup** (📐, `subgroup: 'areas'`, School Math) shown under SubgroupHeader in Home:
  - `square` ⬜ — `{ a, answer }` — SVG square with HDim + VDim
  - `rectangle` ▭ — `{ w, h, answer }` — SVG rectangle with HDim + VDim
- `rectangleCutout` 📐 (Extra Math, **no subgroup**) — `{ W, H, cw, ch, answer }` — L-shape SVG (width=370), dashed ghost corner, 4 dimension lines. Lives in `src/modules/rectangleCutout.jsx` (moved out of `areas/` since it's no longer a School Math module).
- **Verbal Reasoning** (`group: 'verbal'`):
  - `wordSplit` 🧩 — `{ w1, w2, validAnswers: [string], isNone: bool, _key }` — given two source words, find a 4-letter target formed by taking 1–3 letters from end of `w1` + remaining 3–1 from start of `w2`. 50% of problems are "no word" (user clicks **No word** button). Data in `wordSplitData.js`: 60 TARGETS (kid-known 4-letter words), ~400-word SOURCE_POOL (5+ letters, dedup, no targets); `buildPairsMap()` indexes pool by suffix/prefix length 1/2/3 at module load, producing `PAIRS_BY_TARGET` so generation is just a random pick. `canFormTargets(w1, w2)` returns ALL targets a pair can form (pair problems accept any equivalent target); `pickRandomNoPair()` samples until a pair forms zero targets. Custom Input: 4-letter text field (auto-uppercase, A-Z only) + **Check Word** + **No word** buttons; No word auto-submits the `NONE_VALUE` sentinel. `CorrectView` highlights the contributing letters in green and reveals the target in a bouncing pill (or "✓ No 4-letter word" for the no-word case).
  - `wordGap` 🔤 — `{ word, pos, answer, choices[5], _key }` — show part of a 6- or 7-letter word; pick the 3 letters that complete it from 5 MC options. Data in `wordGapData.js` (`WORDS`): 100 kid-known words, each with 3 `configs` — all three gap positions are used: prefix (`pos:0`), middle (`pos:2`), suffix (`pos + 3 === word.length`). Each config carries 6–8 `decoys` — wrong 3-letter strings hand-picked so NONE forms a valid word when inserted. Watch out for (a) suffix-sharing words like `___KET` for BASKET/BUCKET/JACKET — decoys must avoid other valid prefixes — and (b) middle-gap patterns like `CA___LE` that accept CANDLE/CASTLE/CATTLE/CANTLE, so decoys must avoid NDL/STL/TTL/NTL. `key` = `wg:WORD:pos` for dedup (different gap positions on the same word count as distinct). MC Input auto-submits. **View** gives no positional hint: it renders `before + after` concatenated (for BEAUTY middle gap → "BEY"; prefix → "UTY"; suffix → "BEA") with a generic "Which 3 letters complete the word?" prompt. The kid figures out whether to prepend, append, or insert. **CorrectView** renders `before + answer (emerald-600) + after (muted)` — revealing the gap's location only after a correct answer — and bounces the full word pill. Note: decoys were originally validated only for their config's specific insertion point, so for middle configs it is theoretically possible (though unlikely, given the random-looking 3-letter decoys) that a decoy could form a valid word at a different split — fix individual collisions in the data as they're reported.
  - `letterCodes` 🔐 — `{ kind:'simple'|'progressive', direction:'encode'|'decode', length:4|5, shifts:number[], shown:{word,code}, prompt:{input,kind}, answer, choices[4], _key }` — every problem displays a demo pair (`wordA → codeA`) and asks the kid to apply the same letter-shift rule to a second word/code pair. **Simple** = one constant shift across all letters (e.g. `TRAP → WUDS` via +3). **Progressive** = shifts form an arithmetic progression `s, s+d, s+2d, …` per position (e.g. `FROG → GTRK` via +1, +2, +3, +4). Direction toggles 50/50: **encode** asks the code of a new word, **decode** asks the word of a new code. Word lengths are 50/50 4- or 5-letter from `letterCodesData.js` (`WORDS_4`, `WORDS_5`). Alphabet wraps (Z+1=A, A−1=Z). Shifts: simple ∈ [-7,+7]\{0}; progressive start ∈ [-5,+5]\{0} with step ∈ {-2,-1,+1,+2}. MC `Input` is a 6-option `grid-cols-2 sm:grid-cols-3` grid (auto-submit) — six options spread across three first-letter buckets relative to the answer's first letter A: distance 0 (answer + sibling), distance 1 (A−1 and A+1), and distance 2 (A−2 and A+2), so observing "the first letter must be X" doesn't narrow it down to a single option. Both `View` and `CorrectView` render an `AlphabetStrip` reference grid (13×2 cells with A–Z + position numbers; letters appearing in the demo word are amber-tinted, letters in the demo code are sky-tinted, overlap is violet) so the kid can count shifts without writing them out. Distractors are direction-aware: **decode** picks 5 real words from the bank — 1 sharing the answer's first letter, 2 at ±1 first letter, 2 at ±2 — so the kid can't spot the answer by recognising the only real word in the row; **encode** keeps the first-letter shift ambiguous with 1 same-first-letter distractor (treat-progressive-as-simple for progressive; first-shift-only-correct for simple) plus 2 distractors at ±1 first letter (every shift bumped by ±1 globally) and 2 at ±2 (shift ±2 globally). `tips(problem)` returns 2 tips for simple, 3 for progressive: first identifies the shift via the first-letter comparison; second names the rule kind; the third (progressive only) reveals the step `d` and the full shift vector. Dedup `key` = `lc:<kind>:<direction>:<shifts.join(",")>:<wordA>:<wordB>`.
  - `letterMath` 🔠 — `{ letters: {A..E: 1..100}, expr, operandLetters, ops, answer }` — letters A–E each stand for a distinct number (1–100); solve a 2- or 3-operand equation (no parentheses, standard precedence) and click the letter whose value equals the result. `generate()` builds an equation via 2-operand templates (`a±b`, `a×b`, `a÷b`) or 3-operand templates (15 patterns covering all `+ − × ÷` combinations), then assigns operand values to random letters, the result to a separate "answer letter," and fills remaining slots with random distinct values. Multiplication operands are bounded to 1–10; division always yields whole numbers; final result clamped to 1–100. Operand values are forced pairwise distinct AND ≠ result, so exactly one letter equals the answer. Display uses `×` and `÷` symbols. Custom MC `Input` of 5 letter buttons (A–E), auto-submits on click. Dedup `key` = `lm:A=...,B=...,...:<expr>`.

## Fractions Input Detail
- User picks format first: **Whole number**, **Fraction**, **Mixed number**
- All three are valid for any given problem (e.g. `1/2+1/2` accepts `1`, `2/2`, or `1 0/2`)
- `check()` uses cross-multiplication to accept any equivalent fraction
- Mixed: `whole + num/den === answerNum/answerDen`

## Pending / To Be Defined
- More Extra Math and Verbal Reasoning modules to come
- Profile list is fixed to the 3 seeded profiles (no UI to add/remove/rename yet)
- No aggregate/cross-profile stats view (only per-profile heatmap)
- **Backend / sync** — see `docs/backend-design.md` for original design. `backend/` (Express + Mongo) exposes the API behind Google OAuth. **Household visibility rule** (enforced in `backend/src/auth.js` → `requireProfileAccess`): an adult (owner/parent) may access self + any child in the same group; a child accesses self only; cross-adult and cross-group access is 403. `GET /api/profiles` is scoped to the requester's group and excludes other adults from an adult requester's response (use `GET /api/groups/me` for the full roster). `POST /api/profiles` is adult-only (`requireAdult`); only the owner can promote a new adult (`role: 'parent'`). `PUT /api/profiles/:id` runs the same per-target check. Auth routes: `/api/auth/google[/callback]`, `/api/auth/me`, `/api/auth/config`, `/api/auth/dev-login` (gated by `ALLOW_DEV_LOGIN=true`), `/api/auth/logout`. Sessions persist in the `sessions` Mongo collection via connect-mongo. **Email→profile is self-managed**: each profile carries a nullable `googleEmail` (unique partial index in `db.js`); login matches the Google email, 403 on no match. **Bootstrap**: `BOOTSTRAP_TEACHER_EMAIL` env auto-creates an owner profile + a default group on the very first login into an empty DB. **Migration**: `migrateLegacyProfiles` in `db.js` runs on every connect and converts any old flat `role: 'teacher'|'student'` profiles into a single default household (first teacher → owner; others → parent; students → child). `src/api.js` sends `credentials: 'include'`. Vite dev proxy forwards `/api/*` → `http://localhost:3000`.
- **Live-sync (multi-tab/device)** — `src/sync.js` runs a per-profile live-sync layer. `GET /api/profiles/:id/sync` returns just the fast-changing slice (`{ activeQuiz, assignments, updatedAt }`). `PUT /api/profiles/:id/active-quiz` writes only `activeQuiz`; both that endpoint and the full PUT enforce a monotonic-progress check (`null↔snapshot` always ok, `snapshot→snapshot` requires non-decreasing `index` and `totalAttempts`, 409 with `current` payload on regression). The frontend hook `useProfileLiveSync(profileId, { onUpdate })` (a) polls every 3 s with backoff via `document.visibilityState` (pauses when hidden, immediate refetch on visibilitychange), (b) subscribes to a per-profile `BroadcastChannel('klearn:profile:<id>')` for instant same-browser tab-to-tab sync. Channels are cached at module scope so postMessage isn't dropped by an immediate close. `useProfileLiveSync` returns a stable `markSeen(ts)` so local writes can suppress their own echo on the next poll. `App.applyRemoteSnapshot` is the single funnel for poll/broadcast/409-refetch — it merges the slice into `allProfiles` and, when on the quiz screen, either re-hydrates Quiz (via `key={quizRemoteKey}` remount) or routes home if the other tab finished/cancelled. Quiz's auto-save fires immediately on every meaningful state change (no debounce). It also skips its very first mount-save when `initialState` was provided (the snapshot is already on the server — sending it back would create an infinite ping-pong with sibling tabs).
- **Production stack** lives in the sibling [`../infra/`](../infra/) repo: `docker-compose.yml` (pins `name: klearn`; references `../klearn/backend` and `../klearn/dist`), `nginx/conf.d/` (edge proxy — terminates TLS for both `klearn.vbabaev.uk` and `cash.vbabaev.uk`, serves the klearn dist + reverse-proxies `/api` to `backend:3000`), `certbot` sidecar + `init-letsencrypt.sh` (Let's Encrypt cert issuance + renewal), and `deploy/` (Ansible). `backend/Dockerfile` (Node 22 alpine) lives here in klearn because it's coupled to the backend source. **Deploy:** from `vibe/infra/`, run `ansible-playbook -i deploy/inventory.yml deploy/deploy.yml`. The playbook runs backend tests + `npm run build` in klearn locally, rsyncs `vibe/klearn/` → `/opt/klearn/klearn/` and `vibe/infra/` → `/opt/klearn/infra/`, then `docker compose up -d --build` from `/opt/klearn/infra/` and runs `init-letsencrypt.sh` (idempotent cert bootstrap). `klearn/backend/.env` is root-owned on the host and never overwritten by deploys — update it manually over SSH when a new env var is needed.

## Key Decisions
- Problems generated all upfront; `key()` on each module prevents duplicates
- `module.Input` overrides default text input; `defaultInput` seeds the state
- Modules with a custom `Input` that auto-submits: hide the "Check Answer" button; `submit()` accepts an optional `directValue` to bypass async state; `module.Input` receives `problem` prop (needed for MC choices)
- `module.isComplete(value, problem)` receives both args — existing modules that only take `(value)` still work since JS ignores extra args; `percent` uses `problem.direction` to know which fields to check
- Tailwind v4 requires `--legacy-peer-deps` due to Vite 8 peer constraint
- Top-level `group` vs visual `subgroup` are distinct concepts — don't conflate. Group = filter (School/Extra/Verbal); subgroup = visual nesting within one group.
- **Two layers of preferences**: app-level in `settings.js` (only `activeProfile`), per-profile in `profile.settings` (e.g. `group`). When adding a user-facing preference, put it on the profile unless it's truly app-wide.
- `Results.jsx` does NOT log sessions itself — `App.jsx.finishQuiz` calls `logSessionFromResult` before navigating, so Play Again naturally produces a new session.
- Play Again regenerates a fresh problem queue with the same per-module counts — `App.jsx.playAgain` uses `countsFromProblems(problems)` → `generateProblems()` (both exported from `modules/index.js`). Do not re-run the original `problems` array; the kid would see the same questions.
- Active profile lives in React state (`App.jsx`) and is refreshed after any mutation (group change, session log) via `refreshProfile()` — never read from storage inside child components during render.

## Running the App
```bash
npm run dev      # Start dev server
npm run build    # Production build
```
