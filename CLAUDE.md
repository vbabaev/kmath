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
    multiplication.jsx # Module: generate, View, check
    division.jsx
    fractions.jsx
    decimals.jsx
  screens/
    Home.jsx           # Topic list (Quick Quiz) + Custom Mix builder
    Quiz.jsx           # Consumes problems: [{ module, problem }]
    Results.jsx        # Score summary + rank
```

## Module Interface
Each module in `src/modules/` exports a default object:
```js
{
  id, label, emoji, color, bgLight, border, description, inputHint,
  generate(),           // returns a problem object (shape is module-specific)
  View({ problem }),    // React component — renders the question display
  check(problem, input) // returns boolean
}
```

## Quiz Flow
1. `Home.jsx` calls `generateProblems(counts)` → `[{ module, problem }]`, shuffled
2. Array passed to `App.jsx` → `Quiz.jsx` via props
3. `Quiz.jsx` renders `<module.View problem={problem} />` and calls `module.check()` on submit
4. On completion → `Results.jsx` with `{ score, streak, results }`

## Quiz Modes (Home screen)
- **Quick Quiz**: 10 questions from one selected topic
- **Custom Mix**: stepper (0–20) per topic, problems shuffled together

## Game Mechanics
- **+10 points** per correct answer
- **+5 bonus** on streak ≥ 2 (resets on wrong answer)
- Feedback shown ~900ms then auto-advances
- Ranks: Math Wizard (≥90%), Star Student (≥70%), Good Job (≥50%), Keep Practicing (<50%)

## Topics Implemented
| ID | Label | generate() returns |
|----|-------|--------------------|
| `multiplication` | Multiplication ✖️ | `{ a, b, answer }` |
| `division` | Division ➗ | `{ dividend, divisor, answer }` |
| `fractions` | Fractions 🍕 | `{ n1, n2, denom, answer }` (same-denom addition, simplified) |
| `decimals` | Decimals 🔢 | `{ left, right, op, answer }` (1-decimal add/subtract) |

## Pending / To Be Defined
- User has more math concepts to describe — modules can be added freely
- No persistent score storage yet (no localStorage / backend)
- No user profile / name personalization yet

## Key Decisions
- Problems are generated all upfront (not on the fly) — enables shuffling across topics
- `module.View` renders only the question display; input + submit live in `Quiz.jsx`
- Fraction answers compared as normalized strings (e.g. `"3/4"`)
- Tailwind v4 requires `--legacy-peer-deps` due to Vite 8 peer constraint

## Running the App
```bash
npm run dev      # Start dev server
npm run build    # Production build
```
