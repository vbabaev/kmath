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
  modules/
    index.js           # MODULES array + getModule(id) helper
    multiplication.jsx
    division.jsx
    fractions.jsx      # Has custom Input component with format picker
    decimals.jsx
  screens/
    Home.jsx           # Topic list (Quick Quiz) + Custom Mix builder
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
3. Wrong answer: show "try again" feedback, reset input, **stay on same problem**, reset streak
4. Correct answer: advance, award points only on first try
5. On completion → `Results.jsx` with `{ score, totalAttempts, completedProblems }`

## Quiz Modes (Home screen)
- **Quick Quiz**: 10 questions from one selected topic
- **Custom Mix**: stepper (0–20) per topic, problems shuffled together

## Game Mechanics
- **+10 points** per correct answer (first try only)
- **+5 bonus** on streak ≥ 2 consecutive first-try solves (resets on any wrong answer)
- Wrong answer: stay on problem, reset streak, no points deducted
- Results: accuracy = `problems.length / totalAttempts * 100%`, plus "X of N solved on first try"
- Ranks based on accuracy: Math Wizard (≥90%), Star Student (≥70%), Good Job (≥50%), Keep Practicing (<50%)

## Topics Implemented
| ID | Label | Problem shape | Notes |
|----|-------|---------------|-------|
| `multiplication` | Multiplication ✖️ | `{ a, b, answer }` | |
| `division` | Division ➗ | `{ dividend, divisor, answer }` | |
| `fractions` | Fractions 🍕 | `{ n1, n2, denom, answerNum, answerDen }` | Format picker: whole / fraction / mixed; checked via cross-multiplication |
| `decimals` | Decimals 🔢 | `{ left, right, op, answer }` | 1-decimal add/subtract |

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
- Tailwind v4 requires `--legacy-peer-deps` due to Vite 8 peer constraint

## Running the App
```bash
npm run dev      # Start dev server
npm run build    # Production build
```
