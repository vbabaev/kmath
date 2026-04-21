# KMath — Learning App

A game-like React web app for a 5th grader to practice across multiple top-level **groups** (School Math, Extra Math, Verbal Reasoning) with points, streaks, and instant feedback. More groups/modules can be added freely.

## Tech Stack
- **Vite 8 + React 19 + JavaScript** (no TypeScript)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (installed with `--legacy-peer-deps`)
- No router — screen state managed in `App.jsx` (`profilePicker | home | quiz | results | profile`)

## Project Structure
```
src/
  App.jsx              # Root — screen state machine + active-profile state, routes to Profile/Picker/Home/Quiz/Results
  main.jsx             # Entry point
  settings.js          # Thin generic wrapper over localStorage['kmath.settings'] (app-level, e.g. activeProfile)
  profiles.js          # Profile CRUD + session logging (localStorage['kmath.profile.<id>'])
  index.css            # Only contains: @import "tailwindcss";
  components/
    ShapeCanvas.jsx    # SVG helpers: ShapeCanvas, HDim, VDim, SHAPE_FILL, SHAPE_STROKE
    Heatmap.jsx        # 30-day activity grid (5 intensity tiers)
  modules/
    index.js           # MODULES, GROUPS, SUBGROUP_META, getModule(id), getModulesByGroup(groupId)
    multiplication.jsx
    division.jsx
    fractions.jsx      # Custom Input with format picker (whole/fraction/mixed)
    decimals.jsx
    rounding.jsx       # Round to nearest tenth or hundredth; integer arithmetic
    areas/             # subgroup: 'areas'
      square.jsx
      rectangle.jsx
      rectangleCutout.jsx  # L-shaped figure with dashed ghost lines
    word/              # subgroup: 'word'
      proportions.jsx
    verbal/            # group: 'verbal'
      wordSplit.jsx
      wordSplitData.js # Target words + source pool + indexed pair builder
  screens/
    ProfilePicker.jsx  # Netflix-style avatar grid, shown on first load or when switching
    Profile.jsx        # Stats page: points, 30-day heatmap, recent sessions
    Home.jsx           # Group pill tabs + Quick Quiz/Custom Mix; profile pill in top-right
    Quiz.jsx           # Consumes problems: [{ module, problem }]
    Results.jsx        # Accuracy % + score
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
  - `localStorage['kmath.settings']` → `{ activeProfile: '<id>' | null }` — app-level only.
  - `localStorage['kmath.profile.<id>']` → `{ id, name, emoji, color, settings: { group }, points, sessions: [] }`.
- **Session entry** (appended on quiz completion):
  ```js
  { date: 'YYYY-MM-DD', startedAt: ISO, group,
    score, completed, initialCount, totalAttempts, durationMs,
    modules: [{ id, label, attempted, solved, avgTimeMs }] }
  ```
  Sessions are append-only; `profile.points` accumulates across all sessions.
- **First load:** if no `activeProfile`, `App.jsx` shows `ProfilePicker`. After selection, it routes to `Home`.
- **Switching:** top-right pill on `Home` → `Profile` screen → "Switch profile" → back to `ProfilePicker`.
- **Heatmap:** last 30 days, bucketed by local `YYYY-MM-DD`. Intensity thresholds (problems solved that day): `0 → gray-100`, `1–3 → green-200`, `4–6 → green-400`, `7–9 → green-600`, `10+ → green-800`.
- **Tailwind color classes** for profiles live in `profiles.js` → `COLORS` / `getProfileColors(color)` — must be literal class strings (Tailwind JIT scans source). Add new colors here, not in JSX.

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
5. On completion → `Results.jsx` with `{ score, totalAttempts, completedProblems, initialCount }`
   - `completedProblems`: `[{ module, attempts, timeMs }]` — one entry per solved problem instance
   - `initialCount`: original queue length before any retries

## Quiz Modes (Home screen)
- **Quick Quiz**: 10 questions from one selected topic
- **Custom Mix**: stepper (0–20) per topic, problems shuffled together

## Game Mechanics
- **+10 points** per correct answer (first try only)
- **+5 bonus** on streak ≥ 2 consecutive first-try solves (resets on any wrong answer)
- Wrong answer: stay on problem, reset streak, no points deducted
- Results: accuracy = `completedProblems.length / totalAttempts * 100%`, plus "X of N solved on first try"
- Per-module stats: accuracy %, avg time per solve, sorted slowest-first; only shown when >1 module played
- Ranks based on accuracy: Math Wizard (≥90%), Star Student (≥70%), Good Job (≥50%), Keep Practicing (<50%)

## Topics Implemented

School Math holds the bulk of modules; Extra Math has the word problems subgroup; Verbal Reasoning has `wordSplit`.

- `multiplication` ✖️ — `{ a, b, answer }` — two 2-digit numbers
- `division` ➗ — `{ dividend, divisor, answer }` — divisor 2–12
- `fractions` 🍕 — `{ n1, n2, denom, answerNum, answerDen }` — custom Input, format picker, cross-multiply check
- `decimals` 🔢 — `{ left, right, op, answer }` — 1-decimal add/subtract
- `compare` ⚖️ — `{ num, den, decimal, fracOnLeft, answer }` — fraction vs decimal; answer is `'<'`/`'='`/`'>'`; 33% equal probability; denominators: 2,5,10,20,50,100; auto-submits on button click
- `rounding` 🎯 — `{ type, numStr, answer, answerDisplay }` — round to nearest tenth (X.YZ) or hundredth (X.YZW); 50% chance deciding digit is 4 or 5; integer arithmetic to avoid float issues
- `percent` 💯 — `{ num, den, pct, simplNum, simplDen, direction }` — convert fraction↔percentage; direction is `'toPercent'` or `'toFraction'`; only denominators dividing 100 (2,4,5,10,20,25,50); accepts any equivalent fraction; custom Input adapts to direction via `problem` prop
- `perimeters` 📏 — `{ shape, answer, ...dims }` — one of 6 shapes: square `{a}`, rectangle `{w,h}`, rhombus `{a}`, trapezoid `{a,b,c}` (isosceles, legs=c), pentagon `{a}` (regular), cutout `{W,H,cw,ch}` (L-shape, perimeter=2W+2H); SVG with SideLabel/TickMark helpers for diagonal sides
- **Extra Math** (`group: 'extra'`) — currently only the Word Problems subgroup:
  - **Word Problems subgroup** (📝, `subgroup: 'word'`):
    - `proportions` 💱 — `{ story, question, item1-3, aVal1-3($), bVal1-2(£), answer(£), choices[4] }` — currency exchange; 5 settings (NYC trip, US website, airport, street market, fan shop); 14 names, ~40 items; 8 rates; all whole numbers; 2×2 MC grid, auto-submits
- **Areas subgroup** (📐, `subgroup: 'areas'`) shown under SubgroupHeader in Home:
  - `square` ⬜ — `{ a, answer }` — SVG square with HDim + VDim
  - `rectangle` ▭ — `{ w, h, answer }` — SVG rectangle with HDim + VDim
  - `rectangleCutout` 📐 — `{ W, H, cw, ch, answer }` — L-shape SVG (width=370), dashed ghost corner, 4 dimension lines
- **Verbal Reasoning** (`group: 'verbal'`):
  - `wordSplit` 🧩 — `{ w1, w2, validAnswers: [string], isNone: bool, _key }` — given two source words, find a 4-letter target formed by taking 1–3 letters from end of `w1` + remaining 3–1 from start of `w2`. 50% of problems are "no word" (user clicks **No word** button). Data in `wordSplitData.js`: 60 TARGETS (kid-known 4-letter words), ~400-word SOURCE_POOL (5+ letters, dedup, no targets); `buildPairsMap()` indexes pool by suffix/prefix length 1/2/3 at module load, producing `PAIRS_BY_TARGET` so generation is just a random pick. `canFormTargets(w1, w2)` returns ALL targets a pair can form (pair problems accept any equivalent target); `pickRandomNoPair()` samples until a pair forms zero targets. Custom Input: 4-letter text field (auto-uppercase, A-Z only) + **Check Word** + **No word** buttons; No word auto-submits the `NONE_VALUE` sentinel. `CorrectView` highlights the contributing letters in green and reveals the target in a bouncing pill (or "✓ No 4-letter word" for the no-word case).

## Fractions Input Detail
- User picks format first: **Whole number**, **Fraction**, **Mixed number**
- All three are valid for any given problem (e.g. `1/2+1/2` accepts `1`, `2/2`, or `1 0/2`)
- `check()` uses cross-multiplication to accept any equivalent fraction
- Mixed: `whole + num/den === answerNum/answerDen`

## Pending / To Be Defined
- Extra Math and Verbal Reasoning each have one module — more to come
- Profile list is fixed to the 3 seeded profiles (no UI to add/remove/rename yet)
- No aggregate/cross-profile stats view (only per-profile heatmap)

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
