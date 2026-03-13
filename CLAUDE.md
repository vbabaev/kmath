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
  screens/
    Home.jsx           # Topic picker grid
    Quiz.jsx           # Active quiz — 10 questions per session
    Results.jsx        # Score summary + rank
  data/
    topics.js          # TOPICS array (id, label, emoji, colors, description)
    questions.js       # Question generators per topic (generateQuestion(topicId))
```

## Game Mechanics
- **10 questions** per session
- **+10 points** per correct answer
- **+5 bonus points** for each answer when on a streak ≥ 2
- Streak resets on wrong answer
- Ranks: Math Wizard (≥90%), Star Student (≥70%), Good Job (≥50%), Keep Practicing (<50%)
- Feedback shown for ~900ms then auto-advances

## Topics Implemented
| ID | Label | Generator |
|----|-------|-----------|
| `multiplication` | Multiplication | Two 2-digit numbers |
| `division` | Division | Divisor 2–12, whole-number answer |
| `fractions` | Fractions | Same-denominator addition, simplified |
| `decimals` | Decimals | 1-decimal-place add/subtract |

## Pending / To Be Defined
- User has more concepts to explain — topics may be extended or customized
- No persistent score storage yet (no localStorage / backend)
- No user profile / name personalization yet
- Mobile responsiveness not fully tested

## Key Decisions
- `generateQuestion(topicId)` in `data/questions.js` returns `{ question, answer, type }`
- Answer comparison uses `normalizeAnswer()` — trims whitespace, handles fractions as strings like `"3/4"`
- Tailwind v4 requires `--legacy-peer-deps` due to Vite 8 peer constraint
- `App.css` was removed; all styling is Tailwind utility classes

## Running the App
```bash
npm run dev      # Start dev server
npm run build    # Production build
```
