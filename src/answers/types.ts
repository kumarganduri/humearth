// Hum v4 answers: the shapes in data/sources/answers.source.json and public/data/answers.json.

export type Provenance = 'measured' | 'estimate' | 'company_claim' | 'forecast' | 'dataset';
export const PROVENANCE: readonly Provenance[] = ['measured', 'estimate', 'company_claim', 'forecast', 'dataset'];

export type Stamp = 'YES' | 'PARTLY' | 'NO' | 'NOBODY KNOWS';
export const STAMPS: readonly Stamp[] = ['YES', 'PARTLY', 'NO', 'NOBODY KNOWS'];

export const CATEGORIES = [
  'About you',
  'Comparisons and myths',
  "The world's total",
  'Growth and the future',
  'Your bills and the grid',
  'Water',
  'Near you',
  'Power sources',
  'Company claims',
  'Other costs',
  'Policy and rules',
  'Hard to know',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface AnswerSource {
  /** Who published it, with enough context to know what the figure counts. */
  publisher: string;
  /** Verbatim from the page (or, for kind "dataset", the data row as copied). */
  quote: string;
  url: string;
  retrieved: string;
  kind: Provenance;
  checked: 'page' | 'dataset';
}

/** One of Hum's sums. `text` is what readers see; the build evaluates `expr` and checks it against `result`. */
export interface Calc {
  text: string;
  expr: string;
  result: number;
  /** Numbers that are Hum's assumptions, not quotes (e.g. "15": "tap water starts at 15 °C"). Shown in text. */
  assume?: Record<string, string>;
}

export interface FigurePoint {
  value: number;
  label: string;
  how: string;
  source: string;
  /** The figure a claim relies on, drawn as a dashed outline. */
  claim?: boolean;
}

export interface Points {
  title: string;
  unit: string;
  items: FigurePoint[];
}

export interface Range {
  low: number;
  high: number;
  unit: string;
  what: string;
  source: string;
  claim: number;
  claimWhat: string;
}

export interface Guess {
  prompt: string;
  options: string[];
  right: number;
}

export interface Answer {
  slug: string;
  q: string;
  cat: Category;
  type: 'claim' | 'how-much';
  /** Claim cards: what people say, and where it's heard. */
  heard?: string;
  heardFrom?: string;
  stamp?: Stamp;
  chips: string[];
  guess?: Guess;
  /** The answer in a few words ("About 2% of a phone charge"). */
  result: string;
  /** One sentence shown under the result after a guess. */
  reveal: string;
  answer: string;
  /** The bigger picture: the total, written for this card. */
  world: string;
  /** Shows "What this means for you" (answers about one person's use). */
  you: boolean;
  why?: string;
  dontknow: string[];
  next: { deeper: string; bigger: string; closer: string };
  share: string;
  points?: Points;
  range?: Range;
  /** Highlighted rung on the "How big is that?" ladder. */
  rung?: string;
  cites: string[];
  calcs: string[];
}

export interface Rung {
  key: string;
  wh: number;
  label: string;
  note: string;
  source: string;
  calc?: string;
}

export interface AnswersSource {
  sources: Record<string, AnswerSource>;
  calcs: Record<string, Calc>;
  ladder: Rung[];
  answers: Answer[];
  /** The front door's card order (slugs): personal and big-picture cards alternate. */
  deck: string[];
  /** Launch day (UTC) for Today's numbering. */
  launch: string;
}

/** public/data/answers.json: what the client needs for cards, search and Today (no source quotes). */
export interface AnswersFile {
  contentHash: string;
  builtAt: string;
  launch: string;
  deck: string[];
  answers: Pick<Answer, 'slug' | 'q' | 'cat' | 'type' | 'heard' | 'heardFrom' | 'stamp' | 'guess' | 'result' | 'reveal' | 'world' | 'you' | 'share' | 'points' | 'range'>[];
}
