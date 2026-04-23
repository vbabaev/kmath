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
    areas/             # subgroup: 'areas' (School Math)
      square.jsx
      rectangle.jsx
    rectangleCutout.jsx  # L-shape (Extra Math, standalone — no subgroup)
    word/              # subgroup: 'word'
      proportions.jsx
    complicatedPercent.jsx      # Extra Math — multi-template % module
    complicatedPercentData.js   # LIST_PROBLEMS + WORDS banks for the above
    verbal/            # group: 'verbal'
      wordSplit.jsx
      wordSplitData.js # Target words + source pool + indexed pair builder
      wordGap.jsx
      wordGapData.js   # 100 words × 3 gap configs each (prefix/middle/suffix), hand-curated decoys
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
  - `localStorage['kmath.profile.<id>']` → `{ id, name, emoji, color, settings: { group }, points, sessions: [], activeQuiz? }`.
- **`activeQuiz`** (optional) — snapshot of an in-progress quiz for F5 / tab-close recovery:
  ```js
  { problems: [{ moduleId, problem }],    // original queue (for initialCount)
    queue:    [{ moduleId, problem }],    // current queue (grows with retries)
    index, score, streak, problemAttempts, totalAttempts,
    completedProblems: [{ moduleId, attempts, timeMs }] }
  ```
  Module refs are serialised as `moduleId` (live module object can't be JSON-ified) and rehydrated in `App.hydrateQuizState` via `fromProblemRef`. Cleared on quiz finish/cancel; `input` / `feedback` / timers are NOT persisted (reset on restore).
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
- **Auto-save:** `Quiz` has a `useEffect` that writes the current state to `profile.activeQuiz` on every meaningful change (submit, retry). `App` detects `activeQuiz` on mount and on `selectProfile` via `enterProfile()` and routes straight into `Quiz` with `initialState` instead of `home`.
- **Cancel button** (top-left of Quiz, replaces the old "← Home" link): opens a confirmation modal showing `unsolved × 5 ⭐` as the penalty; confirm calls `onCancel(penalty)` → `App.cancelQuiz` which clears `activeQuiz`, deducts the penalty via `adjustActivePoints(-penalty)` (clamped to 0), and returns to Home. No session is logged for cancelled quizzes.

## Quiz Modes (Home screen)
- **Quick Quiz**: 10 questions from one selected topic
- **Custom Mix**: stepper (0–20) per topic, problems shuffled together

## Game Mechanics
- **+10 points** per correct answer (first try only)
- **+5 bonus** on streak ≥ 2 consecutive first-try solves (resets on any wrong answer)
- Wrong answer: stay on problem, reset streak, no points deducted
- **Cancel penalty:** `−5 ⭐` per unsolved original problem (`PENALTY_PER_UNSOLVED` in `Quiz.jsx`) — deducted from lifetime `profile.points`, clamped at 0
- Results: accuracy = `completedProblems.length / totalAttempts * 100%`, plus "X of N solved on first try"
- Per-module stats: accuracy %, avg time per solve, sorted slowest-first; only shown when >1 module played
- Ranks based on accuracy: Math Wizard (≥90%), Star Student (≥70%), Good Job (≥50%), Keep Practicing (<50%)

## Topics Implemented

School Math holds the bulk of modules; Extra Math has Word Problems + `complicatedPercent`; Verbal Reasoning has `wordSplit` and `wordGap`.

- `multiplication` ✖️ — `{ a, b, answer }` — two 2-digit numbers
- `division` ➗ — `{ dividend, divisor, answer }` — divisor 2–12
- `fractions` 🍕 — `{ n1, n2, denom, answerNum, answerDen }` — custom Input, format picker, cross-multiply check
- `decimals` 🔢 — `{ left, right, op, answer }` — 1-decimal add/subtract
- `compare` ⚖️ — `{ num, den, decimal, fracOnLeft, answer }` — fraction vs decimal; answer is `'<'`/`'='`/`'>'`; 33% equal probability; denominators: 2,5,10,20,50,100; auto-submits on button click
- `rounding` 🎯 — `{ type, numStr, answer, answerDisplay }` — round to nearest tenth (X.YZ) or hundredth (X.YZW); 50% chance deciding digit is 4 or 5; integer arithmetic to avoid float issues
- `percent` 💯 — `{ num, den, pct, simplNum, simplDen, direction }` — convert fraction↔percentage; direction is `'toPercent'` or `'toFraction'`; only denominators dividing 100 (2,4,5,10,20,25,50); accepts any equivalent fraction; custom Input adapts to direction via `problem` prop
- `perimeters` 📏 — `{ shape, answer, ...dims }` — one of 6 shapes: square `{a}`, rectangle `{w,h}`, rhombus `{a}`, trapezoid `{a,b,c}` (isosceles, legs=c), pentagon `{a}` (regular), cutout `{W,H,cw,ch}` (L-shape, perimeter=2W+2H); SVG with SideLabel/TickMark helpers for diagonal sides
- **Extra Math** (`group: 'extra'`):
  - **Word Problems subgroup** (📝, `subgroup: 'word'`):
    - `proportions` 💱 — `{ story, question, item1-3, aVal1-3($), bVal1-2(£), answer(£), choices[4] }` — currency exchange; 5 settings (NYC trip, US website, airport, street market, fan shop); 14 names, ~40 items; 8 rates; all whole numbers; 2×2 MC grid, auto-submits
  - `complicatedPercent` 🎯 ("Percent Puzzles", pink) — multi-template % module. Every problem's answer is guaranteed to be a whole-number percentage. `generate()` uniformly picks one of three templates and sets `problem.template = 'grid' | 'list' | 'word'`; `View` dispatches to per-template sub-views; `CorrectView` re-renders the same sub-view with `reveal` (highlights what was counted) plus a bouncing "X%" pill. Custom numeric `Input` (digits-only, max 3 chars, with a `%` suffix) includes its own Check-Answer button.
    - **Grid template** — `{ rows, cols, shaded, answer }`. Three grid configs: 10×10 (1%/cell, shaded ∈ 10..90), 5×4 (5%/cell, shaded ∈ 2..18), 2×5 (10%/cell, shaded ∈ 1..9). Cells are shaded contiguously from the top-left (full rows first, then partial). Reveal recolors shaded cells pink.
    - **List template** — `{ listId, items, listLabel, questionId, prompt, answer }`. Data in `complicatedPercentData.js` → `LIST_PROBLEMS`: 6 lists (months×12, names×10, colors×10, fruits×10, sports×10, weekdays×5). Every `{ listId, questionId }` pair has a hand-verified `count` that divides the list size into a whole percent (months only allow counts 3/6/9). Reveal highlights matching items in pink; `matchesQuestion(item, listId, questionId)` is a switch-based classifier that mirrors each question's rule (used only for the highlight — the stored `count` is the source of truth for the answer).
    - **Word template** — `{ word, kind, answer }` where `kind = 'vowels' | 'consonants'`. Word bank (`WORDS`) contains kid-known 4-, 5-, and 10-letter words only — lengths that divide 100 evenly. Vowel set is A/E/I/O/U (Y is a consonant). Reveal highlights matching letters in pink.
    - Dedup `key` = `cp:<template>:<subkey>`, where `_subkey` is grid size+shaded count / list-id+question-id / word+kind.
- **Areas subgroup** (📐, `subgroup: 'areas'`, School Math) shown under SubgroupHeader in Home:
  - `square` ⬜ — `{ a, answer }` — SVG square with HDim + VDim
  - `rectangle` ▭ — `{ w, h, answer }` — SVG rectangle with HDim + VDim
- `rectangleCutout` 📐 (Extra Math, **no subgroup**) — `{ W, H, cw, ch, answer }` — L-shape SVG (width=370), dashed ghost corner, 4 dimension lines. Lives in `src/modules/rectangleCutout.jsx` (moved out of `areas/` since it's no longer a School Math module).
- **Verbal Reasoning** (`group: 'verbal'`):
  - `wordSplit` 🧩 — `{ w1, w2, validAnswers: [string], isNone: bool, _key }` — given two source words, find a 4-letter target formed by taking 1–3 letters from end of `w1` + remaining 3–1 from start of `w2`. 50% of problems are "no word" (user clicks **No word** button). Data in `wordSplitData.js`: 60 TARGETS (kid-known 4-letter words), ~400-word SOURCE_POOL (5+ letters, dedup, no targets); `buildPairsMap()` indexes pool by suffix/prefix length 1/2/3 at module load, producing `PAIRS_BY_TARGET` so generation is just a random pick. `canFormTargets(w1, w2)` returns ALL targets a pair can form (pair problems accept any equivalent target); `pickRandomNoPair()` samples until a pair forms zero targets. Custom Input: 4-letter text field (auto-uppercase, A-Z only) + **Check Word** + **No word** buttons; No word auto-submits the `NONE_VALUE` sentinel. `CorrectView` highlights the contributing letters in green and reveals the target in a bouncing pill (or "✓ No 4-letter word" for the no-word case).
  - `wordGap` 🔤 — `{ word, pos, answer, choices[5], _key }` — show part of a 6- or 7-letter word; pick the 3 letters that complete it from 5 MC options. Data in `wordGapData.js` (`WORDS`): 100 kid-known words, each with 3 `configs` — all three gap positions are used: prefix (`pos:0`), middle (`pos:2`), suffix (`pos + 3 === word.length`). Each config carries 6–8 `decoys` — wrong 3-letter strings hand-picked so NONE forms a valid word when inserted. Watch out for (a) suffix-sharing words like `___KET` for BASKET/BUCKET/JACKET — decoys must avoid other valid prefixes — and (b) middle-gap patterns like `CA___LE` that accept CANDLE/CASTLE/CATTLE/CANTLE, so decoys must avoid NDL/STL/TTL/NTL. `key` = `wg:WORD:pos` for dedup (different gap positions on the same word count as distinct). MC Input auto-submits. **View** gives no positional hint: it renders `before + after` concatenated (for BEAUTY middle gap → "BEY"; prefix → "UTY"; suffix → "BEA") with a generic "Which 3 letters complete the word?" prompt. The kid figures out whether to prepend, append, or insert. **CorrectView** renders `before + answer (emerald-600) + after (muted)` — revealing the gap's location only after a correct answer — and bounces the full word pill. Note: decoys were originally validated only for their config's specific insertion point, so for middle configs it is theoretically possible (though unlikely, given the random-looking 3-letter decoys) that a decoy could form a valid word at a different split — fix individual collisions in the data as they're reported.

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
