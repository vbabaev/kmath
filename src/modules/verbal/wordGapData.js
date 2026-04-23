// Each entry: { word, configs: [{ pos, answer, decoys }] }
//   pos      — 0-indexed start of the 3-letter gap in the word
//   answer   — the 3 letters that fill the gap
//   decoys   — pool of wrong 3-letter options. A config must guarantee that
//              NO decoy, when inserted, forms a valid English word. 4 are
//              sampled per problem and shown alongside the answer.
//
// Guidelines when adding/editing:
// - Every decoy, combined with the surrounding letters, must NOT spell a word.
// - When multiple words share a suffix/prefix pattern (e.g. ___KET: BASKET,
//   BUCKET, JACKET, MARKET, ROCKET, TICKET), each word's decoys must avoid
//   the OTHER valid prefixes for that pattern.
// - Aim for 6+ decoys per config so the 4 sampled feel varied across replays.

export const WORDS = [
  // ─── 6-letter words ───────────────────────────────────────────────────────
  { word: 'ANIMAL', configs: [
    { pos: 0, answer: 'ANI', decoys: ['ENA', 'TOB', 'GRU', 'SPI', 'WET', 'PAC', 'LIB'] },
    { pos: 2, answer: 'IMA', decoys: ['KIB', 'PUM', 'WOF', 'GRE', 'SLO', 'BIP', 'VEX'] },
    { pos: 3, answer: 'MAL', decoys: ['BET', 'KER', 'GLO', 'TRO', 'PUB', 'WIN', 'RAX'] },
  ]},
  { word: 'ANSWER', configs: [
    { pos: 0, answer: 'ANS', decoys: ['TIM', 'HEP', 'VAS', 'BRI', 'MUR', 'FAC', 'JIB'] },
    { pos: 2, answer: 'SWE', decoys: ['KUB', 'WOF', 'MIR', 'RIP', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'WER', decoys: ['TIM', 'POK', 'JUB', 'LEX', 'HUD', 'RAN', 'WIG'] },
  ]},
  { word: 'BASKET', configs: [
    { pos: 0, answer: 'BAS', decoys: ['FRE', 'GLO', 'NIM', 'PRA', 'SHA', 'SWI', 'TRU'] },
    { pos: 2, answer: 'SKE', decoys: ['KUP', 'WOF', 'MIR', 'RIP', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'KET', decoys: ['WAV', 'FUG', 'PYU', 'OAT', 'TRY', 'NKO', 'RLM'] },
  ]},
  { word: 'BEAUTY', configs: [
    { pos: 0, answer: 'BEA', decoys: ['NOR', 'FID', 'TUK', 'GLA', 'VUP', 'SOR', 'WIX'] },
    { pos: 2, answer: 'AUT', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
    { pos: 3, answer: 'UTY', decoys: ['CHE', 'NAP', 'MOG', 'SLE', 'RID', 'WOP', 'VIN'] },
  ]},
  { word: 'BEFORE', configs: [
    { pos: 0, answer: 'BEF', decoys: ['KUR', 'WIM', 'TOR', 'HAP', 'LOG', 'BRI', 'PYN'] },
    { pos: 2, answer: 'FOR', decoys: ['KUP', 'WOF', 'TID', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ORE', decoys: ['LUG', 'KIN', 'RAD', 'WHI', 'POT', 'SEN', 'TIM'] },
  ]},
  { word: 'BOTTLE', configs: [
    { pos: 0, answer: 'BOT', decoys: ['FRA', 'CHI', 'SKO', 'DRU', 'GLI', 'PEN', 'MUR'] },
    { pos: 2, answer: 'TTL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TLE', decoys: ['RUM', 'GAX', 'NOB', 'FID', 'KER', 'SAP', 'WUN'] },
  ]},
  { word: 'BRANCH', configs: [
    { pos: 0, answer: 'BRA', decoys: ['SPO', 'GLU', 'KER', 'MIR', 'WOB', 'FIP', 'DUC'] },
    { pos: 2, answer: 'ANC', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'NCH', decoys: ['GEL', 'WOR', 'TIP', 'FAD', 'SUM', 'MAP', 'RIB'] },
  ]},
  { word: 'BRIDGE', configs: [
    { pos: 0, answer: 'BRI', decoys: ['KOL', 'MIR', 'NOP', 'STA', 'FRO', 'CLI', 'BAR'] },
    { pos: 2, answer: 'IDG', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'DGE', decoys: ['TNA', 'WOR', 'MEL', 'KUP', 'VIN', 'FAD', 'ROB'] },
  ]},
  { word: 'BRIGHT', configs: [
    { pos: 0, answer: 'BRI', decoys: ['GRA', 'WAK', 'NOP', 'KEB', 'SHU', 'TAM', 'FLO'] },
    { pos: 2, answer: 'IGH', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'GHT', decoys: ['JER', 'VAS', 'TOM', 'RUP', 'MIG', 'POD', 'NIF'] },
  ]},
  { word: 'BUCKET', configs: [
    { pos: 0, answer: 'BUC', decoys: ['FRE', 'GLO', 'NIM', 'PRA', 'SHA', 'SWI', 'TRU'] },
    { pos: 2, answer: 'CKE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'KET', decoys: ['NER', 'GAP', 'WOF', 'ILM', 'ROD', 'TYN', 'MAU'] },
  ]},
  { word: 'BUTTON', configs: [
    { pos: 0, answer: 'BUT', decoys: ['WAR', 'GLI', 'PRO', 'FRE', 'STA', 'NIK', 'TOB'] },
    { pos: 2, answer: 'TTO', decoys: ['KIP', 'WOF', 'MAR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TON', decoys: ['KER', 'WAX', 'MIG', 'RAP', 'VUL', 'HIT', 'FOG'] },
  ]},
  { word: 'CANDLE', configs: [
    { pos: 0, answer: 'CAN', decoys: ['SOR', 'FIB', 'PER', 'KOR', 'VIT', 'BAR', 'RIM'] },
    { pos: 2, answer: 'NDL', decoys: ['KIP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'FUG'] },
    { pos: 3, answer: 'DLE', decoys: ['RUM', 'WOP', 'GAN', 'TIF', 'BEX', 'KUR', 'MAP'] },
  ]},
  { word: 'CASTLE', configs: [
    { pos: 0, answer: 'CAS', decoys: ['WHI', 'NUM', 'PRI', 'FLO', 'BRA', 'GOR', 'MUK'] },
    { pos: 2, answer: 'STL', decoys: ['KIP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'FUG'] },
    { pos: 3, answer: 'TLE', decoys: ['PUR', 'KAG', 'WOD', 'RIB', 'MEN', 'FIN', 'NOK'] },
  ]},
  { word: 'CENTER', configs: [
    { pos: 0, answer: 'CEN', decoys: ['BRA', 'CLO', 'CRE', 'DRA', 'FRI', 'NEW', 'YEL'] },
    { pos: 2, answer: 'NTE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TER', decoys: ['GRU', 'SHU', 'LOP', 'DAB', 'VIS', 'FAM', 'KID'] },
  ]},
  { word: 'CHANGE', configs: [
    { pos: 0, answer: 'CHA', decoys: ['FRO', 'TRI', 'SLU', 'MOR', 'BIP', 'WRE', 'GUL'] },
    { pos: 2, answer: 'ANG', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'NGE', decoys: ['TIM', 'FAR', 'WOP', 'KUR', 'SIB', 'VOL', 'NUT'] },
  ]},
  { word: 'CIRCLE', configs: [
    { pos: 0, answer: 'CIR', decoys: ['PHO', 'WRA', 'SLU', 'BEF', 'DRA', 'MEN', 'GAF'] },
    { pos: 2, answer: 'RCL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'CLE', decoys: ['PON', 'WAV', 'TIB', 'RUG', 'MEK', 'FOD', 'HAP'] },
  ]},
  { word: 'DANGER', configs: [
    { pos: 0, answer: 'DAN', decoys: ['MUK', 'FRO', 'VIP', 'SWI', 'BRE', 'CLO', 'PHY'] },
    { pos: 2, answer: 'NGE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'GER', decoys: ['PUD', 'NAM', 'ROB', 'TIQ', 'WAF', 'SEK', 'LIF'] },
  ]},
  { word: 'DOCTOR', configs: [
    { pos: 0, answer: 'DOC', decoys: ['PRI', 'SNA', 'WHI', 'GLA', 'FRU', 'KEB', 'BRI'] },
    { pos: 2, answer: 'CTO', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TAD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TOR', decoys: ['GEB', 'NIM', 'WUP', 'HAR', 'FIL', 'KES', 'ROP'] },
  ]},
  { word: 'DOLLAR', configs: [
    { pos: 0, answer: 'DOL', decoys: ['KRA', 'PEN', 'WHI', 'FRU', 'MAS', 'TRO', 'GIB'] },
    { pos: 2, answer: 'LLA', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'LAR', decoys: ['KIN', 'WUP', 'MOB', 'JEY', 'RAG', 'TIN', 'FED'] },
  ]},
  { word: 'DRAGON', configs: [
    { pos: 0, answer: 'DRA', decoys: ['PHI', 'WRE', 'SKO', 'GUR', 'NEM', 'HAP', 'BRI'] },
    { pos: 2, answer: 'AGO', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'GON', decoys: ['FIR', 'TEP', 'MUX', 'WEK', 'PAL', 'VIB', 'SOR'] },
  ]},
  { word: 'EMPIRE', configs: [
    { pos: 0, answer: 'EMP', decoys: ['CRA', 'OGE', 'VRA', 'SHI', 'NUB', 'TRA', 'WIL'] },
    { pos: 2, answer: 'PIR', decoys: ['KUP', 'WOF', 'SAL', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'IRE', decoys: ['KUG', 'NAP', 'WOP', 'TAV', 'MEF', 'RIB', 'SUD'] },
  ]},
  { word: 'ENOUGH', configs: [
    { pos: 0, answer: 'ENO', decoys: ['KRI', 'VAL', 'POM', 'SHA', 'TUB', 'WIG', 'FEM'] },
    { pos: 2, answer: 'OUG', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'UGH', decoys: ['TAR', 'KEP', 'MIN', 'FRO', 'WOB', 'VAN', 'SEL'] },
  ]},
  { word: 'FAMILY', configs: [
    { pos: 0, answer: 'FAM', decoys: ['BRA', 'CRE', 'WIZ', 'PLU', 'SNO', 'GRU', 'HEB'] },
    { pos: 2, answer: 'MIL', decoys: ['KUP', 'WOF', 'KEB', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ILY', decoys: ['PEG', 'KUR', 'TOB', 'WAP', 'NID', 'RUF', 'MOS'] },
  ]},
  { word: 'FATHER', configs: [
    { pos: 0, answer: 'FAT', decoys: ['WRI', 'SPA', 'PRI', 'GLO', 'BRU', 'NOP', 'CRE'] },
    { pos: 2, answer: 'THE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'HER', decoys: ['GUM', 'LIK', 'RAV', 'WOP', 'PEN', 'NAB', 'TOR'] },
  ]},
  { word: 'FINGER', configs: [
    { pos: 0, answer: 'FIN', decoys: ['BRA', 'CLO', 'SHU', 'PRE', 'WRA', 'TRU', 'GLO'] },
    { pos: 2, answer: 'NGE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'GER', decoys: ['WUP', 'KEB', 'MOB', 'TAV', 'RIL', 'PUF', 'DAB'] },
  ]},
  { word: 'FINISH', configs: [
    { pos: 0, answer: 'FIN', decoys: ['GRO', 'PRU', 'CHE', 'BLE', 'SWA', 'MUR', 'TRI'] },
    { pos: 2, answer: 'NIS', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ISH', decoys: ['WOP', 'KUR', 'NAB', 'TEG', 'RUM', 'MIG', 'VAR'] },
  ]},
  { word: 'FLOWER', configs: [
    { pos: 0, answer: 'FLO', decoys: ['KRE', 'WHI', 'SPA', 'BRU', 'MOG', 'TIP', 'NAG'] },
    { pos: 2, answer: 'OWE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'WER', decoys: ['GUM', 'KIB', 'RAM', 'POD', 'NUG', 'TAX', 'VIL'] },
  ]},
  { word: 'FOREST', configs: [
    { pos: 0, answer: 'FOR', decoys: ['BRI', 'CLA', 'GLU', 'SNE', 'WIK', 'HEP', 'NOP'] },
    { pos: 2, answer: 'RES', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'EST', decoys: ['KUB', 'WAP', 'MOB', 'NAR', 'RID', 'VOL', 'TIL'] },
  ]},
  { word: 'FRIEND', configs: [
    { pos: 0, answer: 'FRI', decoys: ['BLO', 'WHI', 'STO', 'GRA', 'POM', 'KUR', 'NAV'] },
    { pos: 2, answer: 'IEN', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'END', decoys: ['KOS', 'WAP', 'RIB', 'MUF', 'TIB', 'LOM', 'NUP'] },
  ]},
  { word: 'FROZEN', configs: [
    { pos: 0, answer: 'FRO', decoys: ['WAM', 'TRI', 'GLU', 'PHO', 'SNE', 'BRI', 'KEP'] },
    { pos: 2, answer: 'OZE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ZEN', decoys: ['KIB', 'WAF', 'MOR', 'TAV', 'PED', 'RUN', 'NIL'] },
  ]},
  { word: 'GARDEN', configs: [
    { pos: 0, answer: 'GAR', decoys: ['PHI', 'KRO', 'SPA', 'BRU', 'NEM', 'WHI', 'FLO'] },
    { pos: 2, answer: 'RDE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'DEN', decoys: ['KAF', 'WUP', 'MOB', 'RIL', 'TIG', 'PEV', 'NUX'] },
  ]},
  { word: 'GENTLE', configs: [
    { pos: 0, answer: 'GEN', decoys: ['FRI', 'WHA', 'KRO', 'PLU', 'BRI', 'MUR', 'SNO'] },
    { pos: 2, answer: 'NTL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TLE', decoys: ['KUB', 'WOF', 'MAP', 'RIN', 'TOD', 'PEK', 'NUG'] },
  ]},
  { word: 'GOLDEN', configs: [
    { pos: 0, answer: 'GOL', decoys: ['KRE', 'BRO', 'WHI', 'SPA', 'PRU', 'MIB', 'FLA'] },
    { pos: 2, answer: 'LDE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'DEN', decoys: ['KUB', 'WAP', 'MOR', 'TIF', 'RAG', 'PEV', 'NOX'] },
  ]},
  { word: 'GROUND', configs: [
    { pos: 0, answer: 'GRO', decoys: ['BRI', 'PLA', 'SHE', 'WRI', 'KEP', 'FLU', 'TRU'] },
    { pos: 2, answer: 'OUN', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NAL'] },
    { pos: 3, answer: 'UND', decoys: ['KIB', 'WOF', 'MAP', 'TAN', 'RIL', 'PED', 'NUV'] },
  ]},
  { word: 'HAPPEN', configs: [
    { pos: 0, answer: 'HAP', decoys: ['BRO', 'FRE', 'CLI', 'STU', 'WRI', 'NEM', 'GLO'] },
    { pos: 2, answer: 'PPE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'PEN', decoys: ['KUR', 'WOF', 'MOB', 'TIL', 'RAV', 'NUG', 'DEX'] },
  ]},
  { word: 'HIDDEN', configs: [
    { pos: 0, answer: 'HID', decoys: ['KRE', 'SPO', 'WHI', 'FRA', 'BRI', 'PLU', 'NEM'] },
    { pos: 2, answer: 'DDE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
    { pos: 3, answer: 'DEN', decoys: ['KOR', 'WUP', 'MAF', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'HUNGRY', configs: [
    { pos: 0, answer: 'HUN', decoys: ['BLI', 'FRE', 'WRI', 'SPA', 'PRO', 'NEM', 'GLO'] },
    { pos: 2, answer: 'NGR', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'GRY', decoys: ['KUB', 'WOF', 'MAP', 'RIN', 'TOL', 'PEV', 'NUX'] },
  ]},
  { word: 'ISLAND', configs: [
    { pos: 0, answer: 'ISL', decoys: ['KEP', 'WOR', 'NAP', 'PIB', 'TRU', 'GLO', 'FRU'] },
    { pos: 2, answer: 'LAN', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'AND', decoys: ['KUB', 'WOF', 'MIR', 'RIG', 'TOL', 'PEX', 'NUV'] },
  ]},
  { word: 'JACKET', configs: [
    { pos: 0, answer: 'JAC', decoys: ['FRE', 'GLO', 'NIM', 'PRA', 'SHA', 'SWI', 'TRU'] },
    { pos: 2, answer: 'CKE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'KET', decoys: ['WUR', 'MIB', 'POL', 'TAG', 'NEV', 'FUB', 'RAX'] },
  ]},
  { word: 'JUNGLE', configs: [
    { pos: 0, answer: 'JUN', decoys: ['KRE', 'BRO', 'SPA', 'WHI', 'PLU', 'NEM', 'FRA'] },
    { pos: 2, answer: 'NGL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'GLE', decoys: ['KIB', 'WAP', 'MOR', 'TUN', 'RED', 'PEV', 'NUX'] },
  ]},
  { word: 'LETTER', configs: [
    { pos: 0, answer: 'LET', decoys: ['BRA', 'CLO', 'CRE', 'DRA', 'FRI', 'NEW', 'YEL'] },
    { pos: 2, answer: 'TTE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TER', decoys: ['GUM', 'KIB', 'RAV', 'WOP', 'PEN', 'NAB', 'MIG'] },
  ]},
  { word: 'LITTLE', configs: [
    { pos: 0, answer: 'LIT', decoys: ['KUR', 'WOF', 'MIB', 'SPA', 'BRE', 'PLU', 'NEM'] },
    { pos: 2, answer: 'TTL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TLE', decoys: ['KOB', 'WAP', 'MOR', 'RIF', 'TUN', 'PEV', 'NUG'] },
  ]},
  { word: 'MAGNET', configs: [
    { pos: 0, answer: 'MAG', decoys: ['KRE', 'BRO', 'SPA', 'WHI', 'PLU', 'NEM', 'FRA'] },
    { pos: 2, answer: 'GNE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'NET', decoys: ['KUB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'MANAGE', configs: [
    { pos: 0, answer: 'MAN', decoys: ['KRE', 'SPA', 'WHI', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'NAG', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'LUM'] },
    { pos: 3, answer: 'AGE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUX'] },
  ]},
  { word: 'MARKET', configs: [
    { pos: 0, answer: 'MAR', decoys: ['FRE', 'GLO', 'NIM', 'PRA', 'SHA', 'SWI', 'TRU'] },
    { pos: 2, answer: 'RKE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'KET', decoys: ['WUP', 'FIB', 'NOL', 'TAG', 'REV', 'PUD', 'SIM'] },
  ]},
  { word: 'MATTER', configs: [
    { pos: 0, answer: 'MAT', decoys: ['BRA', 'CLO', 'CRE', 'DRA', 'FRI', 'NEW', 'YEL'] },
    { pos: 2, answer: 'TTE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TER', decoys: ['KIB', 'WOF', 'MOG', 'RAV', 'TUN', 'PEV', 'NUG'] },
  ]},
  { word: 'MEMBER', configs: [
    { pos: 0, answer: 'MEM', decoys: ['KRO', 'BRA', 'SPA', 'WHI', 'PLU', 'NEB', 'FRA'] },
    { pos: 2, answer: 'MBE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'BER', decoys: ['KUP', 'WOF', 'MIR', 'RIG', 'TOL', 'PEV', 'NUX'] },
  ]},
  { word: 'MIDDLE', configs: [
    { pos: 0, answer: 'MID', decoys: ['KRE', 'BRO', 'SPA', 'WHI', 'PLU', 'NEM', 'FRA'] },
    { pos: 2, answer: 'DDL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'DLE', decoys: ['KUP', 'WOF', 'MIR', 'RAB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'MINUTE', configs: [
    { pos: 0, answer: 'MIN', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'NUT', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'SAG'] },
    { pos: 3, answer: 'UTE', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'MOTHER', configs: [
    { pos: 0, answer: 'MOT', decoys: ['BRA', 'CLO', 'CRE', 'DRA', 'FRI', 'NEW', 'YEL'] },
    { pos: 2, answer: 'THE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'HER', decoys: ['KIB', 'WOF', 'MAP', 'RAV', 'TUN', 'PEV', 'NUG'] },
  ]},
  { word: 'NUMBER', configs: [
    { pos: 0, answer: 'NUM', decoys: ['KRE', 'BRO', 'SPA', 'WHI', 'PLU', 'JEN', 'FRA'] },
    { pos: 2, answer: 'MBE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'BER', decoys: ['KUP', 'WOF', 'MIR', 'RIG', 'TOL', 'PEV', 'NUX'] },
  ]},
  { word: 'ORANGE', configs: [
    { pos: 0, answer: 'ORA', decoys: ['KRE', 'SPA', 'FRO', 'TRI', 'BRU', 'KUB', 'TEM'] },
    { pos: 2, answer: 'ANG', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'NGE', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'PALACE', configs: [
    { pos: 0, answer: 'PAL', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'LAC', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ACE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'PARENT', configs: [
    { pos: 0, answer: 'PAR', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'REN', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ENT', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'PENCIL', configs: [
    { pos: 0, answer: 'PEN', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'NCI', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'CIL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'PEOPLE', configs: [
    { pos: 0, answer: 'PEO', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'BRU', 'GUF'] },
    { pos: 2, answer: 'OPL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'PLE', decoys: ['KIB', 'WOF', 'MAR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'PLANET', configs: [
    { pos: 0, answer: 'PLA', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'TRU', 'BRI', 'GLO'] },
    { pos: 2, answer: 'ANE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'NET', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'POTATO', configs: [
    { pos: 0, answer: 'POT', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'TAT', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ATO', decoys: ['KIB', 'WOF', 'MUP', 'RIB', 'LON', 'PEV', 'NUG'] },
  ]},
  { word: 'RABBIT', configs: [
    { pos: 0, answer: 'RAB', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'BBI', decoys: ['KUP', 'WOF', 'MIR', 'LON', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'BIT', decoys: ['KUP', 'WOF', 'MIR', 'RIL', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'RECORD', configs: [
    { pos: 0, answer: 'REC', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'COR', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ORD', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'RESULT', configs: [
    { pos: 0, answer: 'RES', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'SUL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ULT', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'RIBBON', configs: [
    { pos: 0, answer: 'RIB', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'BBO', decoys: ['KUP', 'WOF', 'MIR', 'NAP', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'BON', decoys: ['KIB', 'WOF', 'MAP', 'RIL', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'ROCKET', configs: [
    { pos: 0, answer: 'ROC', decoys: ['FRE', 'GLO', 'NIM', 'PRA', 'SHA', 'SWI', 'TRU'] },
    { pos: 2, answer: 'CKE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'KET', decoys: ['WUP', 'FIB', 'NOL', 'TAG', 'REV', 'PUD', 'SIM'] },
  ]},
  { word: 'SCHOOL', configs: [
    { pos: 0, answer: 'SCH', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'HOO', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'OOL', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'SECRET', configs: [
    { pos: 0, answer: 'SEC', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'CRE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'RET', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'SILVER', configs: [
    { pos: 0, answer: 'SIL', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'LVE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'VER', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEK', 'NUG'] },
  ]},
  { word: 'SIMPLE', configs: [
    { pos: 0, answer: 'SIM', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'BRU', 'GUF'] },
    { pos: 2, answer: 'MPL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'PLE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'SISTER', configs: [
    { pos: 0, answer: 'SIS', decoys: ['BRA', 'CLO', 'CRE', 'DRA', 'FRI', 'NEW', 'YEL'] },
    { pos: 2, answer: 'STE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TER', decoys: ['KIB', 'WOF', 'MAP', 'RAV', 'TUN', 'PEV', 'NUG'] },
  ]},
  { word: 'SOCCER', configs: [
    { pos: 0, answer: 'SOC', decoys: ['KRE', 'WHI', 'NIM', 'FRO', 'PLU', 'BRU', 'GUF'] },
    { pos: 2, answer: 'CCE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'CER', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'SPIDER', configs: [
    { pos: 0, answer: 'SPI', decoys: ['KRE', 'WHI', 'FRA', 'FRO', 'PLU', 'TRU', 'GLO'] },
    { pos: 2, answer: 'IDE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'DER', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'SPRING', configs: [
    { pos: 0, answer: 'SPR', decoys: ['KRE', 'WHI', 'FRA', 'FRO', 'PLU', 'GLO', 'NEP'] },
    { pos: 2, answer: 'RIN', decoys: ['KUP', 'WOF', 'MIR', 'LAB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ING', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'SQUARE', configs: [
    { pos: 0, answer: 'SQU', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'UAR', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ARE', decoys: ['KIB', 'WOF', 'MUP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'STREAM', configs: [
    { pos: 0, answer: 'STR', decoys: ['KRE', 'WHI', 'FRA', 'FRO', 'PLU', 'TRU', 'GLO'] },
    { pos: 2, answer: 'REA', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'EAM', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'SUDDEN', configs: [
    { pos: 0, answer: 'SUD', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'DDE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'DEN', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'SUMMER', configs: [
    { pos: 0, answer: 'SUM', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'MME', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'MER', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'SUNSET', configs: [
    { pos: 0, answer: 'SUN', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'TRI', 'BRU'] },
    { pos: 2, answer: 'NSE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'SET', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'TICKET', configs: [
    { pos: 0, answer: 'TIC', decoys: ['FRE', 'GLO', 'NIM', 'PRA', 'SHA', 'SWI', 'TRU'] },
    { pos: 2, answer: 'CKE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'KET', decoys: ['WUP', 'FIB', 'NOL', 'TAG', 'REV', 'PUD', 'SIM'] },
  ]},
  { word: 'TOILET', configs: [
    { pos: 0, answer: 'TOI', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'BRI', 'GLO'] },
    { pos: 2, answer: 'ILE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'LET', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},
  { word: 'TOMATO', configs: [
    { pos: 0, answer: 'TOM', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'BRI', 'GLO'] },
    { pos: 2, answer: 'MAT', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ATO', decoys: ['KIB', 'WOF', 'MUP', 'RIB', 'LON', 'PEV', 'NUG'] },
  ]},
  { word: 'TRAVEL', configs: [
    { pos: 0, answer: 'TRA', decoys: ['KRE', 'WHI', 'FRA', 'FRO', 'PLU', 'TRU', 'GLO'] },
    { pos: 2, answer: 'AVE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'VEL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEK', 'NUG'] },
  ]},
  { word: 'TUNNEL', configs: [
    { pos: 0, answer: 'TUN', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'BRI', 'GLO'] },
    { pos: 2, answer: 'NNE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'NEL', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},
  { word: 'TURTLE', configs: [
    { pos: 0, answer: 'TUR', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'BRI', 'GLO'] },
    { pos: 2, answer: 'RTL', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TLE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},
  { word: 'VELVET', configs: [
    { pos: 0, answer: 'VEL', decoys: ['KRE', 'WHI', 'SPA', 'FRO', 'PLU', 'BRI', 'GLO'] },
    { pos: 2, answer: 'LVE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'VET', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOD', 'PEK', 'NUG'] },
  ]},
  { word: 'WINDOW', configs: [
    { pos: 0, answer: 'WIN', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'BRI', 'GLO', 'TRU'] },
    { pos: 2, answer: 'NDO', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'DOW', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},
  { word: 'WINTER', configs: [
    { pos: 0, answer: 'WIN', decoys: ['BRA', 'CLO', 'CRE', 'DRA', 'FRI', 'NEW', 'YEL'] },
    { pos: 2, answer: 'NTE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'TER', decoys: ['KIB', 'WOF', 'MAP', 'RAV', 'TUN', 'PEV', 'NUG'] },
  ]},
  { word: 'WIZARD', configs: [
    { pos: 0, answer: 'WIZ', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'NAM', 'GLO', 'TRU'] },
    { pos: 2, answer: 'ZAR', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'ARD', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'YELLOW', configs: [
    { pos: 0, answer: 'YEL', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'BRI', 'GLO', 'TRU'] },
    { pos: 2, answer: 'LLO', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 3, answer: 'LOW', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},

  // ─── 7-letter words (prefix gap 0–2; suffix gap 4–6) ──────────────────────
  { word: 'BROTHER', configs: [
    { pos: 0, answer: 'BRO', decoys: ['KRE', 'SPA', 'KUP', 'PLU', 'GLO', 'WOK', 'NIB'] },
    { pos: 2, answer: 'OTH', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TAD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'HER', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},
  { word: 'CHAPTER', configs: [
    { pos: 0, answer: 'CHA', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'APT', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'TER', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},
  { word: 'KITCHEN', configs: [
    { pos: 0, answer: 'KIT', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'TCH', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'HEN', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'MORNING', configs: [
    { pos: 0, answer: 'MOR', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'RNI', decoys: ['KUP', 'WOF', 'MAR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'ING', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},
  { word: 'NETWORK', configs: [
    { pos: 0, answer: 'NET', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'TWO', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'ORK', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'NOTHING', configs: [
    { pos: 0, answer: 'NOT', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'THI', decoys: ['KUP', 'WOF', 'MAR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'ING', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},
  { word: 'PICTURE', configs: [
    { pos: 0, answer: 'PIC', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'CTU', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'URE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'RAINBOW', configs: [
    { pos: 0, answer: 'RAI', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'INB', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'BOW', decoys: ['KIB', 'WOF', 'MAP', 'RIV', 'TOD', 'PEG', 'NUG'] },
  ]},
  { word: 'STATION', configs: [
    { pos: 0, answer: 'STA', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'ATI', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'ION', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'TEACHER', configs: [
    { pos: 0, answer: 'TEA', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'ACH', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'HER', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOD', 'PEV', 'NUG'] },
  ]},
  { word: 'COUNTRY', configs: [
    { pos: 0, answer: 'COU', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'UNT', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'TRY', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'DIAMOND', configs: [
    { pos: 0, answer: 'DIA', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'AMO', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'OND', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'FACTORY', configs: [
    { pos: 0, answer: 'FAC', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'CTO', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TAD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'ORY', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'HOLIDAY', configs: [
    { pos: 0, answer: 'HOL', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'LID', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TON', 'PEV', 'NUG'] },
    { pos: 4, answer: 'DAY', decoys: ['KIB', 'WOF', 'MAP', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
  { word: 'PACKAGE', configs: [
    { pos: 0, answer: 'PAC', decoys: ['KRE', 'SPA', 'FRO', 'PLU', 'GLO', 'TRU', 'NIB'] },
    { pos: 2, answer: 'CKA', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOD', 'PEV', 'NUG'] },
    { pos: 4, answer: 'AGE', decoys: ['KUP', 'WOF', 'MIR', 'RIB', 'TOL', 'PEV', 'NUG'] },
  ]},
]
