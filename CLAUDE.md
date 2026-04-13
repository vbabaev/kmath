# KMath — 5th Grade Math Learning App

A game-like React web app for a 5th grader to practice math with points, streaks, and instant feedback.

## Tech Stack
- **Vite 8 + React 19 + JavaScript** (no TypeScript)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (installed with `--legacy-peer-deps`)
- No router — screen state managed in `App.jsx` (`home | quiz | results`)

## Project Structure
```
src/
  App.jsx              # Root — screen state machine (home/quiz/results)
  main.jsx             # Entry point
  index.css            # Only contains: @import "tailwindcss";
  components/
    ShapeCanvas.jsx    # SVG helpers: ShapeCanvas, HDim, VDim, SHAPE_FILL, SHAPE_STROKE
  modules/
    index.js           # MODULES array, GROUP_META, getModule(id)
    multiplication.jsx
    division.jsx
    fractions.jsx      # Custom Input with format picker (whole/fraction/mixed)
    decimals.jsx
    rounding.jsx       # Round to nearest tenth or hundredth; integer arithmetic
    areas/
      square.jsx
      rectangle.jsx
      rectangleCutout.jsx  # L-shaped figure with dashed ghost lines
  screens/
    Home.jsx           # Topic list (Quick Quiz) + Custom Mix; groups rendered with GroupHeader
    Quiz.jsx           # Consumes problems: [{ module, problem }]
    Results.jsx        # Accuracy % + score
```

## Module Interface
Each module exports a default object:
```js
{
  id, label, emoji, color, bgLight, border, description,
  inputHint,            // optional — placeholder for default text input
  defaultInput,         // optional — initial input state (default: '')
  defaultCount,         // number of questions for Quick Quiz (10 for most, 5 for word problems)
  generate(),           // returns a problem object (shape is module-specific)
  key(problem),         // returns a string key for deduplication
  View({ problem }),    // React component — renders the question display
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
- `multiplication` ✖️ — `{ a, b, answer }` — two 2-digit numbers
- `division` ➗ — `{ dividend, divisor, answer }` — divisor 2–12
- `fractions` 🍕 — `{ n1, n2, denom, answerNum, answerDen }` — custom Input, format picker, cross-multiply check
- `decimals` 🔢 — `{ left, right, op, answer }` — 1-decimal add/subtract
- `compare` ⚖️ — `{ num, den, decimal, fracOnLeft, answer }` — fraction vs decimal; answer is `'<'`/`'='`/`'>'`; 33% equal probability; denominators: 2,5,10,20,50,100; auto-submits on button click
- `rounding` 🎯 — `{ type, numStr, answer, answerDisplay }` — round to nearest tenth (X.YZ) or hundredth (X.YZW); 50% chance deciding digit is 4 or 5; integer arithmetic to avoid float issues
- `percent` 💯 — `{ num, den, pct, simplNum, simplDen, direction }` — convert fraction↔percentage; direction is `'toPercent'` or `'toFraction'`; only denominators dividing 100 (2,4,5,10,20,25,50); accepts any equivalent fraction; custom Input adapts to direction via `problem` prop
- **Word Problems group** (📝) shown under GroupHeader in Home:
  - `proportions` 💱 — `{ story, question, item1-3, aVal1-3($), bVal1-2(£), answer(£), choices[4] }` — currency exchange; 5 settings (NYC trip, US website, airport, street market, fan shop); 14 names, ~40 items; 8 rates; all whole numbers; 2×2 MC grid, auto-submits
- **Areas group** (📐) shown under GroupHeader in Home:
  - `square` ⬜ — `{ a, answer }` — SVG square with HDim + VDim
  - `rectangle` ▭ — `{ w, h, answer }` — SVG rectangle with HDim + VDim
  - `rectangleCutout` 📐 — `{ W, H, cw, ch, answer }` — L-shape SVG (width=370), dashed ghost corner, 4 dimension lines

## Fractions Input Detail
- User picks format first: **Whole number**, **Fraction**, **Mixed number**
- All three are valid for any given problem (e.g. `1/2+1/2` accepts `1`, `2/2`, or `1 0/2`)
- `check()` uses cross-multiplication to accept any equivalent fraction
- Mixed: `whole + num/den === answerNum/answerDen`

## Pending / To Be Defined
- User has more math concepts to describe — modules can be added freely
- No persistent score storage (no localStorage / backend)
- No user profile / name personalization

## Key Decisions
- Problems generated all upfront; `key()` on each module prevents duplicates
- `module.Input` overrides default text input; `defaultInput` seeds the state
- Modules with a custom `Input` that auto-submits: hide the "Check Answer" button; `submit()` accepts an optional `directValue` to bypass async state; `module.Input` receives `problem` prop (needed for MC choices)
- `module.isComplete(value, problem)` receives both args — existing modules that only take `(value)` still work since JS ignores extra args; `percent` uses `problem.direction` to know which fields to check
- Tailwind v4 requires `--legacy-peer-deps` due to Vite 8 peer constraint

## Running the App
```bash
npm run dev      # Start dev server
npm run build    # Production build
```
