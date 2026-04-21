export const TARGETS = [
  'BEAR', 'YEAR', 'TEAR', 'STAR', 'COIN', 'DARK', 'TASK', 'PART', 'FARM', 'HEAD',
  'HEAR', 'HEAT', 'READ', 'MEAT', 'BEAT', 'TEAM', 'HARM', 'LASH', 'SALT', 'RAIN',
  'LINK', 'MASK', 'WALL', 'BALL', 'CALL', 'FALL', 'HALL', 'TALL', 'KING', 'RING',
  'SING', 'BANK', 'LONG', 'SONG', 'WIND', 'FIND', 'MIND', 'WARM', 'CORN', 'WORD',
  'STOP', 'SHOP', 'SHIP', 'HELP', 'LAMP', 'PUSH', 'MOON', 'BOOK', 'LOOK', 'GOLD',
]

export const TARGETS_SET = new Set(TARGETS)

export const NONE_VALUE = '(none)'

const RAW_POOL = [
  'ABOUT', 'ABOVE', 'ACROSS', 'ACTIVE', 'ACUTE', 'ADJUST', 'ADMIT', 'ADOPT', 'ADORE', 'ADULT',
  'AFTER', 'AGAIN', 'AGREE', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIVE', 'ALLEY', 'ALLIED',
  'ALLOW', 'ALMOND', 'ALONE', 'ALONG', 'ALPHA', 'ALREADY', 'ALTAR', 'ALTER', 'ALWAYS', 'AMAZE',
  'AMBER', 'AMONG', 'AMOUNT', 'AMPLE', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'ANIMAL', 'ANKLE',
  'ANNOY', 'ANSWER', 'APART', 'APPLE', 'APPLY', 'APRIL', 'APRON', 'ARGUE', 'ARMED', 'ARMOR',
  'AROUND', 'ARRIVE', 'ARROW', 'ARTIST', 'ARTICLE', 'ASHES', 'ASHORE', 'ASIDE', 'ASKED', 'ASKING',
  'ATLAS', 'ATTACK', 'AVOID', 'AWAKE', 'AWARE', 'BACON', 'BADGE', 'BAKER', 'BAMBOO', 'BANANA',
  'BARELY', 'BASIC', 'BASKET', 'BATCH', 'BATHE', 'BEACH', 'BEANS', 'BEAST', 'BEAUTY', 'BEFORE',
  'BEGIN', 'BEHIND', 'BELIEVE', 'BELOW', 'BENCH', 'BERRY', 'BETWEEN', 'BICYCLE', 'BIGGER', 'BISCUIT',
  'BITTER', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLEED', 'BLEND', 'BLIND', 'BLINK',
  'BLOCK', 'BLOOD', 'BLOOM', 'BLUSH', 'BOARD', 'BOTTLE', 'BOTTOM', 'BRAIN', 'BRAKE', 'BRANCH',
  'BRAVE', 'BREAD', 'BREAK', 'BRICK', 'BRIDGE', 'BRIGHT', 'BRING', 'BROKE', 'BROWN', 'BRUSH',
  'BUCKET', 'BUILD', 'BUNCH', 'BUSHEL', 'BUTTER', 'BUTTON', 'CABIN', 'CABLE', 'CACHE', 'CAMERA',
  'CANDLE', 'CANDY', 'CANOE', 'CARGO', 'CARRY', 'CASTLE', 'CATCH', 'CAUGHT', 'CEDAR', 'CELERY',
  'CELLAR', 'CEMENT', 'CENTER', 'CEREAL', 'CERTAIN', 'CHAIN', 'CHAIR', 'CHALK', 'CHANCE', 'CHANGE',
  'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEEK', 'CHEER', 'CHEESE', 'CHERRY', 'CHEST',
  'CHICKEN', 'CHIEF', 'CHILD', 'CHILL', 'CHOOSE', 'CHUNK', 'CIDER', 'CIRCLE', 'CIRCUS', 'CIVIL',
  'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLIFF', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOTH', 'CLOTHE',
  'CLOUD', 'CLOWN', 'COACH', 'COAST', 'COFFEE', 'COLOR', 'COMET', 'COPPER', 'COUGH', 'COUNT',
  'COUSIN', 'COVER', 'CRACK', 'CRAFT', 'CRANE', 'CRASH', 'CRAWL', 'CRAZY', 'CREAM', 'CREATE',
  'CROSS', 'CROWD', 'CROWN', 'CRUSH', 'CYCLE', 'DAIRY', 'DAISY', 'DANCE', 'DANGER', 'DAUGHTER',
  'DECIDE', 'DELAY', 'DEPART', 'DESIGN', 'DESIRE', 'DETAIL', 'DINNER', 'DIRECT', 'DIRTY', 'DISCO',
  'DITCH', 'DIVIDE', 'DOCTOR', 'DOLPHIN', 'DOZEN', 'DRAGON', 'DRAIN', 'DRAMA', 'DREAM', 'DRESS',
  'DRINK', 'DRIVE', 'DUSTY', 'DYNAMO', 'EAGER', 'EAGLE', 'EARLY', 'EARNED', 'EARTH', 'EATEN',
  'EATING', 'EDGES', 'EFFECT', 'EFFORT', 'EIGHT', 'ELBOW', 'ELDER', 'ELECT', 'ELEVEN', 'ELITE',
  'EMPIRE', 'EMPLOY', 'EMPTY', 'ENEMY', 'ENERGY', 'ENGAGE', 'ENGINE', 'ENJOY', 'ENOUGH', 'ENTER',
  'ENTIRE', 'EQUAL', 'ERRAND', 'ERROR', 'ESCAPE', 'EVENT', 'EVERY', 'EXACT', 'EXCITE', 'EXIST',
  'EXPECT', 'EXPLAIN', 'EXPLORE', 'EXTRA', 'FABRIC', 'FACTOR', 'FAIRY', 'FAITH', 'FALCON', 'FAMILY',
  'FAMOUS', 'FANCY', 'FARMER', 'FATHER', 'FAULT', 'FEAST', 'FEATHER', 'FEMALE', 'FENCE', 'FERRY',
  'FETCH', 'FEVER', 'FIFTH', 'FIFTY', 'FIGHT', 'FIGURE', 'FINAL', 'FINGER', 'FINISH', 'FIRST',
  'FISHING', 'FLAME', 'FLASH', 'FLESH', 'FLOAT', 'FLOCK', 'FLOOD', 'FLOOR', 'FLOUR', 'FLOWER',
  'FLUID', 'FLYING', 'FOCUS', 'FOREST', 'FORGET', 'FORMAL', 'FORMER', 'FORTH', 'FORTY', 'FOUGHT',
  'FOUND', 'FRAME', 'FREEZE', 'FRESH', 'FRIEND', 'FROGS', 'FRONT', 'FROST', 'FROZEN', 'FRUIT',
  'FUNNY', 'FUTURE', 'GADGET', 'GALAXY', 'GAMES', 'GARDEN', 'GARLIC', 'GATHER', 'GENTLE', 'GIANT',
  'GIVEN', 'GLANCE', 'GLASS', 'GLIDE', 'GLOBE', 'GLOOM', 'GLOVE', 'GOLDEN', 'GOOSE', 'GRAIN',
  'GRAND', 'GRAPE', 'GRAPH', 'GRASP', 'GRASS', 'GRAVEL', 'GREAT', 'GREEN', 'GRIND', 'GROUND',
  'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'GUITAR', 'HABIT', 'HAIRY', 'HAMMER',
  'HANDLE', 'HAPPY', 'HARBOR', 'HARDER', 'HATCH', 'HEART', 'HEAVY', 'HEDGE', 'HELLO', 'HELMET',
  'HENCE', 'HIDDEN', 'HIGHER', 'HIPPIE', 'HIPPO', 'HOBBY', 'HOLDER', 'HOLLOW', 'HONEY', 'HONOR',
  'HORROR', 'HORSE', 'HOTEL', 'HOUSE', 'HOVER', 'HUMAN', 'HUMBLE', 'HUMID', 'HUMOR', 'HUNGRY',
  'HUNTER', 'HURRY', 'HUSKY', 'ICING', 'IDEAL', 'IGLOO', 'IGNITE', 'IGNORE', 'IMAGE', 'IMAGINE',
  'IMPACT', 'IMPROVE', 'INCLUDE', 'INCOME', 'INDEED', 'INDEX', 'INDOOR', 'INFORM', 'INHALE', 'INJURE',
  'INGEST', 'INGOT', 'INKED', 'INKING', 'INKWELL', 'INLAND', 'INNER', 'INSECT', 'INSIDE', 'INSIST',
  'INVENT', 'INVITE',
  'ISSUE', 'ITEMS', 'JACKET', 'JEALOUS', 'JELLY', 'JEWEL', 'JOKER', 'JOURNEY', 'JUDGE', 'JUICE',
  'JUICY', 'JUMBLE', 'JUNGLE', 'KERNEL', 'KETTLE', 'KIDNEY', 'KITCHEN', 'KITTEN', 'KNEEL', 'KNIFE',
  'KNIGHT', 'KNOCK', 'LABEL', 'LABOR', 'LADDER', 'LARGE', 'LATER', 'LAUGH', 'LAUNCH', 'LEADER',
  'LEARN', 'LEAST', 'LEATHER', 'LEAVE', 'LEMON', 'LEVEL', 'LIGHT', 'LIKELY', 'LIMIT', 'LISTEN',
  'LITTLE', 'LIVING', 'LOATHE', 'LOCAL', 'LOGIC', 'LONELY', 'LOOSE', 'LOYAL', 'LUCKY', 'LUNCH',
  'MAGIC', 'MAGNET', 'MAJOR', 'MAKER', 'MAMMAL', 'MANAGE', 'MARBLE', 'MARCH', 'MARKED', 'MARKET',
  'MARRY', 'MARSH', 'MASTER', 'MATCH', 'MATTER', 'MAYBE', 'MEADOW', 'MEDAL', 'MELODY', 'MELON',
  'MEMBER', 'MEMORY', 'METAL', 'METHOD', 'MIDDLE', 'MIGHT', 'MIGHTY', 'MILLION', 'MINER', 'MINERAL',
  'MINOR', 'MINUTE', 'MIRROR', 'MODEL', 'MODERN', 'MONEY', 'MONKEY', 'MONTH', 'MORAL', 'MORNING',
  'MOTEL', 'MOTHER', 'MOTION', 'MOTOR', 'MOUND', 'MOUSE', 'MOVIE', 'MUSIC', 'NAPKIN', 'NARROW',
  'NATION', 'NATIVE', 'NATURE', 'NEARBY', 'NEEDLE', 'NERVE', 'NEVER', 'NIGHT', 'NINTH', 'NOBLE',
  'NOISE', 'NORTH', 'NOTICE', 'NOVEL', 'NUMBER', 'NURSE', 'NYLON', 'OASIS', 'OBSERVE', 'OCCUR',
  'OCEAN', 'OFFER', 'OFFICE', 'OFTEN', 'OLDER', 'OLDEST', 'OLIVE', 'ONION', 'ONSET', 'ONWARD',
  'OPENED', 'OPERA', 'OPTION', 'ORANGE', 'ORBIT', 'ORCHARD', 'ORDER', 'ORDEAL', 'ORGAN', 'ORNATE',
  'ORNAMENT', 'OTHER', 'OUNCE', 'OUTER', 'OUTSIDE', 'OWNED', 'OWNER', 'OYSTER', 'PACKET', 'PADDLE',
  'PAINT', 'PALACE', 'PANCAKE', 'PANDA', 'PANEL', 'PANIC', 'PAPER', 'PARADE', 'PARENT', 'PARROT',
  'PARTY', 'PATCH', 'PATTERN', 'PAUSE', 'PEACE', 'PEACH', 'PEANUT', 'PEARL', 'PENCIL', 'PENNY',
  'PEOPLE', 'PEPPER', 'PERFECT', 'PERIOD', 'PERSON', 'PHONE', 'PIANO', 'PICKLE', 'PICNIC', 'PIECE',
  'PIGEON', 'PILLAR', 'PILLOW', 'PILOT', 'PIRATE', 'PITCH', 'PIZZA', 'PLACE', 'PLAIN', 'PLANE',
  'PLANET', 'PLANT', 'PLATE', 'PLAYED', 'PLAYER', 'PLEASE', 'PLUMB', 'POINT', 'POLAR', 'POLICE',
  'POLITE', 'POSTER', 'POUND', 'POWDER', 'POWER', 'PRETTY', 'PRICE', 'PRIDE', 'PRINCE', 'PRINT',
  'PRISON', 'PRIZE', 'PROMISE', 'PROOF', 'PROUD', 'PROVE', 'PUBLIC', 'PUDDLE', 'PUMPKIN', 'PUPPY',
  'PURPLE', 'PUZZLE', 'QUACK', 'QUAKE', 'QUEEN', 'QUEST', 'QUICK', 'QUIET', 'QUITE', 'QUOTE',
  'RABBIT', 'RACING', 'RADAR', 'RADIO', 'RAINBOW', 'RAISE', 'RAISIN', 'RANCH', 'RANGE', 'RATHER',
  'RATTLE', 'RAVEN', 'REACH', 'READY', 'REBEL', 'RECALL', 'RECENT', 'RECORD', 'REFUSE', 'REGION',
  'REGRET', 'REGULAR', 'REJECT', 'RELAX', 'RELIEF', 'REMAIN', 'REMIND', 'REMOTE', 'REMOVE', 'REPAIR',
  'REPEAT', 'REPLY', 'REPORT', 'RESCUE', 'RESULT', 'RETURN', 'REVEAL', 'REVIEW', 'REWARD', 'RHINO',
  'RHYME', 'RIBBON', 'RIDER', 'RIDGE', 'RIFLE', 'RIGHT', 'RIVER', 'ROBIN', 'ROBOT', 'ROCKET',
  'ROLLER', 'ROUGH', 'ROUND', 'ROYAL', 'RUBBER', 'RULER', 'RUSTY', 'SADLY', 'SAFETY', 'SAILOR',
  'SALAD', 'SALON', 'SAMPLE', 'SANDAL', 'SANDY', 'SAUCE', 'SCALE', 'SCARE', 'SCARF', 'SCENE',
  'SCENT', 'SCHOOL', 'SCIENCE', 'SCOOP', 'SCORE', 'SCOUT', 'SCREEN', 'SEASON', 'SECOND', 'SECRET',
  'SELECT', 'SELLER', 'SENSE', 'SERVE', 'SEVEN', 'SEWING', 'SHAKE', 'SHAME', 'SHAPE', 'SHARE',
  'SHARK', 'SHARP', 'SHAVE', 'SHEEP', 'SHEET', 'SHELF', 'SHELL', 'SHIELD', 'SHINE', 'SHIRT',
  'SHIVER', 'SHOCK', 'SHORE', 'SHORT', 'SHOUT', 'SHOWER', 'SILENT', 'SILVER', 'SIMPLE', 'SINCE',
  'SINGLE', 'SISTER', 'SIXTH', 'SIZED', 'SKATE', 'SKILL', 'SLEEP', 'SLICE', 'SLIDE', 'SMART',
  'SMELL', 'SMILE', 'SMITH', 'SMOKE', 'SMOOTH', 'SNACK', 'SNAIL', 'SNAKE', 'SNEAK', 'SNOWY',
  'SOBER', 'SOCIAL', 'SOLAR', 'SOLID', 'SOLVE', 'SOOTHE', 'SOUND', 'SOUTH', 'SPACE', 'SPARK',
  'SPEAK', 'SPEAR', 'SPEED', 'SPELL', 'SPEND', 'SPICE', 'SPIDER', 'SPIRIT', 'SPLASH', 'SPOON',
  'SPORT', 'SPRAY', 'SPREAD', 'SPRING', 'SQUARE', 'STABLE', 'STAGE', 'STAIN', 'STAIRS', 'STAMP',
  'STAND', 'STARE', 'START', 'STATE', 'STEAM', 'STEEL', 'STEEP', 'STICK', 'STIFF', 'STILL',
  'STOCK', 'STOMP', 'STONE', 'STORE', 'STORM', 'STORY', 'STOVE', 'STRAW', 'STREAM', 'STREET',
  'STRIKE', 'STRONG', 'STUCK', 'STUDENT', 'STUDY', 'STUFF', 'STUMP', 'STYLE', 'SUGAR', 'SUMMER',
  'SUNDAY', 'SUNSET', 'SUPER', 'SUPPER', 'SUPPLY', 'SURFACE', 'SWEET', 'SWIFT', 'SWING', 'SWORD',
  'SYSTEM', 'TABLE', 'TABLET', 'TAILOR', 'TALENT', 'TALON', 'TAMED', 'TANGO', 'TARDY', 'TARGET',
  'TASTE', 'TASTY', 'TAUGHT', 'TEACH', 'TEAPOT', 'TEMPER', 'TEMPLE', 'TENDER', 'TENNIS', 'TENTH',
  'THANK', 'THEIR', 'THEME', 'THICK', 'THIEF', 'THING', 'THINK', 'THIRD', 'THIRTY', 'THORN',
  'THREAD', 'THROAT', 'THROW', 'THUMB', 'THUMP', 'TIGER', 'TIGHT', 'TIMBER', 'TIRED', 'TITLE',
  'TOAST', 'TODAY', 'TOILET', 'TOKEN', 'TOMATO', 'TONGUE', 'TOOTH', 'TOPIC', 'TOPPLE', 'TORCH',
  'TOTAL', 'TOUCH', 'TOUGH', 'TOWEL', 'TOWER', 'TRACE', 'TRACK', 'TRADE', 'TRAIL', 'TRAIN',
  'TRAVEL', 'TREAT', 'TRIBE', 'TRICK', 'TROUBLE', 'TRUCK', 'TRUMP', 'TRUNK', 'TRUST', 'TRUTH',
  'TULIP', 'TUNNEL', 'TURKEY', 'TURTLE', 'TWELVE', 'TWENTY', 'TWIST', 'TYPING', 'UMBRELLA', 'UMPIRE',
  'UNCLE', 'UNDER', 'UNFAIR', 'UNION', 'UNIQUE', 'UNITE', 'UNITY', 'UNLESS', 'UNTIL', 'UPPER',
  'UPSET', 'URBAN', 'USEFUL', 'USHER', 'USING', 'USUAL', 'VALLEY', 'VALUE', 'VAMPIRE', 'VAPOR',
  'VELVET', 'VERSE', 'VIDEO', 'VILLAGE', 'VIOLET', 'VIOLIN', 'VISIT', 'VISUAL', 'VOICE', 'VOLCANO',
  'VOLUME', 'VOYAGE', 'WAITED', 'WAITER', 'WALKED', 'WANDER', 'WARMER', 'WASTE', 'WATCH', 'WATER',
  'WEALTH', 'WEAPON', 'WEATHER', 'WEDGE', 'WEIGHT', 'WELCOME', 'WHALE', 'WHEAT', 'WHEEL', 'WHILE',
  'WHITE', 'WIDER', 'WIDOW', 'WINDOW', 'WINNER', 'WINTER', 'WISDOM', 'WITCH', 'WOMAN', 'WONDER',
  'WOODEN', 'WORLD', 'WORRY', 'WORTH', 'WOUND', 'WRITE', 'YEAST', 'YELLOW', 'YIELD', 'YOUNG',
  'YOUTH', 'ZEBRA', 'ZIPPER',
]

export const SOURCE_POOL = Array.from(
  new Set(
    RAW_POOL
      .map((w) => w.toUpperCase())
      .filter((w) => /^[A-Z]+$/.test(w) && w.length >= 5 && !TARGETS_SET.has(w))
  )
)

export function canFormTargets(w1, w2) {
  const found = new Set()
  for (let k = 1; k <= 3; k++) {
    if (w1.length < k || w2.length < 4 - k) continue
    const suffix = w1.slice(w1.length - k)
    const prefix = w2.slice(0, 4 - k)
    const candidate = suffix + prefix
    if (TARGETS_SET.has(candidate)) found.add(candidate)
  }
  return Array.from(found)
}

function buildPairsMap() {
  const endsWith = { 1: {}, 2: {}, 3: {} }
  const startsWith = { 1: {}, 2: {}, 3: {} }
  for (const w of SOURCE_POOL) {
    for (const k of [1, 2, 3]) {
      const suffix = w.slice(w.length - k)
      if (!endsWith[k][suffix]) endsWith[k][suffix] = []
      endsWith[k][suffix].push(w)
      const prefix = w.slice(0, k)
      if (!startsWith[k][prefix]) startsWith[k][prefix] = []
      startsWith[k][prefix].push(w)
    }
  }

  const map = {}
  for (const t of TARGETS) {
    const pairs = []
    const seen = new Set()
    for (let k = 1; k <= 3; k++) {
      const A = t.slice(0, k)
      const B = t.slice(k)
      const w1s = endsWith[k][A] ?? []
      const w2s = startsWith[4 - k][B] ?? []
      for (const w1 of w1s) {
        for (const w2 of w2s) {
          if (w1 === w2) continue
          const key = `${w1}|${w2}`
          if (seen.has(key)) continue
          seen.add(key)
          pairs.push([w1, w2])
        }
      }
    }
    map[t] = pairs
  }
  return map
}

export const PAIRS_BY_TARGET = buildPairsMap()

if (typeof window !== 'undefined' && import.meta?.env?.DEV) {
  for (const t of TARGETS) {
    const n = PAIRS_BY_TARGET[t]?.length ?? 0
    if (n === 0) console.warn(`wordSplit: no pairs for target ${t}`)
  }
}

export function pickRandomPairForTarget(target) {
  const pairs = PAIRS_BY_TARGET[target]
  if (!pairs || pairs.length === 0) return null
  return pairs[Math.floor(Math.random() * pairs.length)]
}

export function pickRandomNoPair(maxTries = 200) {
  for (let i = 0; i < maxTries; i++) {
    const w1 = SOURCE_POOL[Math.floor(Math.random() * SOURCE_POOL.length)]
    const w2 = SOURCE_POOL[Math.floor(Math.random() * SOURCE_POOL.length)]
    if (w1 === w2) continue
    if (canFormTargets(w1, w2).length === 0) return [w1, w2]
  }
  return null
}
