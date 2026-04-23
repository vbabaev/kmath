// Data for the complicatedPercent module.
//
// Three templates:
//   1. GRID  — generated procedurally in the module (no data here).
//   2. LIST  — LIST_PROBLEMS: a list + categorising questions. Every
//              question's `count` must yield a WHOLE-number percentage
//              when computed as count / list.length * 100.
//              N=12 (months)   → only counts {0, 3, 6, 9, 12} are valid.
//              N=10            → any count is valid (10% steps).
//              N=5  (weekdays) → any count is valid (20% steps).
//   3. WORD  — WORDS: kid-friendly words whose length divides 100 evenly
//              (4, 5, or 10 letters). Answers are computed at runtime by
//              counting vowels (A/E/I/O/U — Y is treated as a consonant).

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_QUESTIONS = [
  { id: 'j',          prompt: 'begin with the letter J',                         count: 3 },
  { id: 'vowel',      prompt: 'begin with a vowel',                              count: 3 },
  { id: 'firstHalf',  prompt: 'are in the first half of the year',               count: 6 },
  { id: 'secondHalf', prompt: 'are in the second half of the year',              count: 6 },
  { id: 'summer',     prompt: 'are summer months (June, July, August)',          count: 3 },
  { id: 'winter',     prompt: 'are winter months (December, January, February)', count: 3 },
  { id: 'spring',     prompt: 'are spring months (March, April, May)',           count: 3 },
  { id: 'autumn',     prompt: 'are autumn months (September, October, November)', count: 3 },
  { id: 'notJ',       prompt: 'do NOT begin with the letter J',                  count: 9 },
  { id: 'hasA',       prompt: 'contain the letter A',                            count: 6 },
  { id: 'long',       prompt: 'have 7 or more letters',                          count: 6 },
  { id: 'short',      prompt: 'have fewer than 7 letters',                       count: 6 },
]

// Letter counts: Alice(5) Bob(3) Charlie(7) David(5) Emma(4) Frank(5) Grace(5) Henry(5) Ivy(3) Jack(4)
const NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack']
const NAME_QUESTIONS = [
  { id: 'vowel', prompt: 'begin with a vowel',                  count: 3 },
  { id: 'len5',  prompt: 'have exactly 5 letters',              count: 5 },
  { id: 'short', prompt: 'have 4 or fewer letters',             count: 4 },
  { id: 'long',  prompt: 'have 6 or more letters',              count: 1 },
  { id: 'bc',    prompt: 'begin with B or C',                   count: 2 },
  { id: 'ej',    prompt: 'begin with a letter from E to J',     count: 6 },
]

// Letter counts: Red(3) Blue(4) Green(5) Yellow(6) Purple(6) Orange(6) Pink(4) Black(5) White(5) Brown(5)
const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White', 'Brown']
const COLOR_QUESTIONS = [
  { id: 'b',       prompt: 'begin with the letter B',                 count: 3 },
  { id: 'primary', prompt: 'are primary colors (Red, Blue, Yellow)',  count: 3 },
  { id: 'long',    prompt: 'have 5 or more letters',                  count: 7 },
  { id: 'len4',    prompt: 'have exactly 4 letters',                  count: 2 },
  { id: 'double',  prompt: 'contain a double letter',                 count: 2 },
  { id: 'vowel',   prompt: 'begin with a vowel',                      count: 1 },
  { id: 'hasE',    prompt: 'contain the letter E',                    count: 7 },
]

// Letter counts: Apple(5) Banana(6) Cherry(6) Grape(5) Orange(6) Lemon(5) Pear(4) Peach(5) Plum(4) Kiwi(4)
const FRUITS = ['Apple', 'Banana', 'Cherry', 'Grape', 'Orange', 'Lemon', 'Pear', 'Peach', 'Plum', 'Kiwi']
const FRUIT_QUESTIONS = [
  { id: 'p',      prompt: 'begin with the letter P',  count: 3 },
  { id: 'vowel',  prompt: 'begin with a vowel',       count: 2 },
  { id: 'long',   prompt: 'have 5 or more letters',   count: 7 },
  { id: 'len4',   prompt: 'have exactly 4 letters',   count: 3 },
  { id: 'yellow', prompt: 'are yellow when ripe',     count: 2 },
  { id: 'hasE',   prompt: 'contain the letter E',     count: 7 },
]

const SPORTS = ['Soccer', 'Tennis', 'Baseball', 'Basketball', 'Hockey', 'Swimming', 'Running', 'Cycling', 'Skating', 'Boxing']
const SPORT_QUESTIONS = [
  { id: 'ball', prompt: 'are played with a ball',    count: 4 },
  { id: 'b',    prompt: 'begin with the letter B',   count: 3 },
  { id: 'ing',  prompt: 'end with the letters -ing', count: 5 },
  { id: 'team', prompt: 'are team sports',           count: 4 },
  { id: 's',    prompt: 'begin with the letter S',   count: 3 },
]

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const WEEKDAY_QUESTIONS = [
  { id: 't',    prompt: 'begin with the letter T',  count: 2 },
  { id: 'len6', prompt: 'have exactly 6 letters',   count: 2 },
  { id: 'long', prompt: 'have 7 or more letters',   count: 3 },
  { id: 'hasN', prompt: 'contain the letter N',     count: 2 },
]

export const LIST_PROBLEMS = [
  { id: 'months',   items: MONTHS,   label: 'months of the year',    questions: MONTH_QUESTIONS },
  { id: 'names',    items: NAMES,    label: 'children in the class', questions: NAME_QUESTIONS },
  { id: 'colors',   items: COLORS,   label: 'colors',                questions: COLOR_QUESTIONS },
  { id: 'fruits',   items: FRUITS,   label: 'fruits',                questions: FRUIT_QUESTIONS },
  { id: 'sports',   items: SPORTS,   label: 'sports',                questions: SPORT_QUESTIONS },
  { id: 'weekdays', items: WEEKDAYS, label: 'weekdays',              questions: WEEKDAY_QUESTIONS },
]

// Every word's length divides 100 evenly, so vowels/length is always a
// whole percent. Y is treated as a consonant.
export const WORDS = [
  // 5-letter (20% per vowel)
  'APPLE', 'GRAPE', 'HOUSE', 'CLOUD', 'CHAIR', 'BREAD', 'FRUIT', 'SMILE',
  'TABLE', 'MOUSE', 'TIGER', 'EAGLE', 'OCEAN', 'BEACH', 'BRAIN', 'LEMON',
  'HAPPY', 'GRASS', 'TRUCK', 'FROST', 'PIANO', 'RADIO', 'HOTEL', 'STORM',
  'CROWN', 'PLANT', 'BRICK', 'QUEEN', 'SMOKE', 'STONE', 'RIVER', 'SUGAR',
  // 4-letter (25% per vowel)
  'LOVE', 'HOME', 'CAKE', 'RAIN', 'PLAY', 'BOOK', 'MOON', 'JUMP',
  'GAME', 'FIRE', 'DOOR', 'STAR', 'TREE', 'COOL', 'KING', 'WIND',
  'GOLD', 'LAKE', 'BIRD', 'FOOT',
  // 10-letter (10% per vowel)
  'BASKETBALL', 'CALCULATOR', 'STRAWBERRY', 'CHOCOLATES', 'HELICOPTER',
  'PINEAPPLES', 'ADVENTURES', 'DICTIONARY', 'IMPORTANCE',
]
