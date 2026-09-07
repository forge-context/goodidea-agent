/* The film's only clock: a time in seconds becomes one complete picture.
 *
 * Everything the stage draws — papers, the designer, the agent rail, the fusion
 * panel, the ink, the cursor, the version number — is sampled from `sampleScene(t)`.
 * Nothing keeps its own timer and nothing animates in CSS, so playing to a second,
 * dragging to it, looping past it and re-entering the viewport all produce the same
 * frame. Time is quantised to 12fps first, which is where the stop-motion feel comes
 * from and also why scrubbing never lands between two states.
 *
 * This module imports nothing on purpose: the build's prerender step reads
 * `PAPER_SECONDS` out of it with a bare transpile, so the page's stated length can
 * never disagree with the script.
 */

export const STAGE = { w: 1600, h: 900 } as const;
/* Narrow screens get a portrait composition of the same film rather than the desk
 * shrunk until nothing on it is readable. */
export const MOBILE_STAGE = { w: 760, h: 1380 } as const;
export const STEP_FPS = 12;
const FRAME = 1 / STEP_FPS;

/** Paper-local coordinates. The text layer and the sheet share one parent, so a line
 *  can never drift off the page it belongs to. */
export const LAYOUT = {
  product: {
    w: 570, h: 760, pad: { left: 116, right: 72 },
    rows: {
      stageLabel: 105, title: 145, original1: 211, original2: 247,
      revised1: 302, revised2: 340, proposalCard: 336, button: 664, buttonCompact: 668,
      sketch: 417, revisedMark: 656,
      /* During the client preview the confirmed lines lift, which opens the room the
       * questions and the preview card need. */
      liftTo1: 196, liftTo2: 232, asks: 272, preview: 388,
    },
  },
  work: {
    w: 480, h: 640, pad: { left: 68, right: 60 },
    rows: {
      title: 92, byline: 130, tag: 166,
      /* Research states two lines; UX draws; engineering reasons in four short lines
       * and signs off with a note. Every sheet keeps the same title/byline/tag head. */
      researchLine: 236, researchGap: 44,
      uxQuestion: 196, uxSketch: 266, uxOption: 570, uxOptionCompact: 548,
      engLine: 214, engGap: 44, engQuote: 300, engSuggest: 372, engFootnote: 486,
    },
  },
  /* The opening quote reuses the research sheet's texture at a different size. */
  quote: { w: 440, h: 587, pad: { left: 62, right: 54 }, rows: { chip: 92, title: 176, price: 268 } },
} as const;

/* --------------------------------------------------------------- timeline */

type TimeTree = number | readonly TimeTree[] | { readonly [k: string]: TimeTree };
type Shift<T> = T extends number ? number
  : T extends readonly (infer U)[] ? Shift<U>[]
  : { [K in keyof T]: Shift<T[K]> };

/** Whole-act translation: each act writes its own beats from zero and the offset is
 *  added in exactly one place, so inserting a beat never means re-typing seconds. */
function shift<T extends TimeTree>(tree: T, by: number): Shift<T> {
  if (typeof tree === "number") return (tree + by) as Shift<T>;
  if (Array.isArray(tree)) return tree.map((v) => shift(v as TimeTree, by)) as Shift<T>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tree as object)) out[k] = shift(v as TimeTree, by);
  return out as Shift<T>;
}

/** How long one client question stays highlighted. A span, not a beat, so it is not
 *  translated with the act. */
const ASK_SPAN = 1.33;

const ESTABLISH = { duration: 2, enter: 0.25 } as const;
const FRICTION_BASE = {
  quoteEnter: 0.5, quoteChip: 1.25, quoteTitle: 1.5, quoteRule: 1.83, quotePrice: 2.08,
  notes: [2.58, 3.92, 5.25],
  thought: 6.83,
  cornerFade: { from: 8.92, to: 9.42 },
  notesFade: { from: 8.92, to: 9.58 },
  thoughtFade: { from: 9.17, to: 9.75 },
  quoteExit: { from: 9, to: 9.92 },
} as const;
const FRICTION = shift(FRICTION_BASE, ESTABLISH.duration);
const IDEA_START = ESTABLISH.duration + 9.67;
const IDEA = shift({
  ideaEnter: 0, productOriginal1: 1.08, productOriginal2: 1.5,
  handoff: { from: 2.33, to: 3.16 },
  productStageLabel: 3.25, productTitle: 3.5,
}, IDEA_START);
const OPENING = {
  corner: 0.42, ...FRICTION, ...IDEA,
  designerEnter: ESTABLISH.enter,
  designerThink: FRICTION.notes[1] - 0.25,
  designerIdea: IDEA.productOriginal1 - 0.25,
} as const;

/* The three working turns. Each agent takes the middle of the desk, says one thing,
 * and parks at the edge; the second and third also answer what came before them. */
const ACT_BASE = {
  researchEnter: 2.5, researchTitle: 3.5, researchByline: 3.67, researchTag: 3.83,
  researchLine1: 4.08, researchLine2: 4.58, underline: { from: 5.17, to: 5.5 },
  researchPark: { from: 6.5, to: 7.33 },
  /* The UX turn opens by quoting the research it is picking up, so the reference is
   * readable on the sheet that is in the middle of the desk. */
  uxEnter: 7.5, uxTitle: 8.5, uxByline: 8.67, uxTag: 8.83, uxQuestion: 9.08,
  uxSketch: [9.75, 10.75, 11.75, 12.75], uxOption: 13.5,
  uxPark: { from: 15, to: 15.83 },
  engineeringEnter: 16, engineeringTitle: 17, engineeringByline: 17.17, engineeringTag: 17.33,
  engineeringLines: [17.75, 18.25, 19.6, 20.1],
  /* Engineering's first two lines land on UX's open question: it quotes that line on
   * its own sheet, and circles it on UX's sheet as something for later. */
  engineeringQuote: 18.9, scopeCircle: 19.0,
  engineeringInk: 20.45, engineeringFootnote: 20.75,
  engineeringPark: { from: 22.3, to: 23.13 },
} as const;
const ACT_OFFSET = IDEA.handoff.to - 1.41;
const ACT = shift(ACT_BASE, ACT_OFFSET);

/* GoodIdea's own turn: the three signed contributions are collected, what they agree
 * on and what they disagree about are both said out loud, and only then does one
 * decision reach the product draft. */
const FUSE_BASE = {
  open: 0.17, links: [0.42, 0.87, 1.32],
  shared: 1.85, trade: 2.45, result: 3.0,
  arrow: 3.2, proposal: 3.45, proposalDetail: 3.95, deferred: 4.5, button: 4.95,
} as const;
const FUSE = shift(FUSE_BASE, ACT.engineeringPark.to);

/* The creator reads the proposal for three seconds before the cursor moves; nothing
 * on the product draft changes until the press. */
const DECIDE_BASE = {
  cursorIn: 0, cursorArrive: 0.75, cursorPress: 1.17, cursorRelease: 1.42, cursorOut: 1.92,
  proposalFade: { from: 2.17, to: 2.42 }, arrowFade: { from: 1.92, to: 2.17 },
  strike: { from: 2.67, to: 3.0 }, revised1: 3.25, revised2: 3.75,
  acceptedSketch: [4.5, 5.25, 6.0, 6.75], revisedMark: 7.5,
} as const;
const DECIDE = shift(DECIDE_BASE, FUSE.button + 3);

/* Two closing acts: the draft opens into what the client would see, then folds back
 * into a result on the product draft while the team gathers around it. */
const OUTLOOK_BASE = {
  spread: { from: 0, to: 0.83 }, card: 0.42,
  rows: [0.83, 1.08, 1.33], total: 1.67, button: 2.0,
  asks: [2.5, 3.83, 5.17],
  cursorIn: 6.83, cursorArrive: 7.33, cursorPress: 7.58, cursorRelease: 7.83, cursorOut: 8.33,
  confirm: 8.0,
  caption1: 8.58, caption2: 8.92, captionFade: { from: 10.33, to: 10.83 },
  cardOut: { from: 10.5, to: 11.0 },
  restore: { from: 10.92, to: 12.0 },
  brand: 12.5, brandLine1: 12.92, brandLine2: 13.25,
} as const;
const OUTLOOK_START = DECIDE.revisedMark + 1.33;
const OUTLOOK = shift(OUTLOOK_BASE, OUTLOOK_START);

export const DURATION = OUTLOOK.brandLine2 + 3.4;
/** What the page is allowed to say the film lasts. Derived, never typed in. */
export const PAPER_SECONDS = Math.round(DURATION);
/** Reduced motion, and the frame the poster holds before the first play. */
export const STATIC_TIME = OUTLOOK.brandLine2 + 1.6;
export const POSTER_TIME = OPENING.thought + 0.5;

export const CUES = {
  ...OPENING, ...ACT, fuse: FUSE, decide: DECIDE, outlook: OUTLOOK,
  fadeIn: { from: 0, to: 0.25 },
  fadeOut: { from: DURATION - 0.6, to: DURATION },
} as const;

/** Chapter starts, in order. Labels live with the copy; only the times are here. */
export const CHAPTER_STARTS = [
  0,
  CUES.ideaEnter,
  CUES.researchEnter,
  CUES.uxEnter,
  CUES.engineeringEnter,
  FUSE.open,
  DECIDE.cursorIn,
  DECIDE.strike.from,
  OUTLOOK_START,
  CUES.outlook.restore.from,
] as const;

export const quantize = (t: number) => Math.floor(t * STEP_FPS + 1e-6) / STEP_FPS;

export function chapterAt(seconds: number): number {
  const t = Math.max(0, Math.min(seconds, DURATION));
  return CHAPTER_STARTS.filter((start) => t >= start).length - 1;
}

/** Stepping between chapters by hand should land on a settled, readable frame rather
 *  than mid-move, so each still sits just before the next chapter begins. */
export function chapterStill(chapter: number): number {
  const index = Math.max(0, Math.min(chapter, CHAPTER_STARTS.length - 1));
  return index === CHAPTER_STARTS.length - 1
    ? STATIC_TIME
    : Math.max(CHAPTER_STARTS[index], CHAPTER_STARTS[index + 1] - 1);
}

export function advanceTime(raw: number, dt: number, duration: number, loop: boolean) {
  const next = raw + Math.min(Math.max(dt, 0), 1 / STEP_FPS);
  if (next < duration) return { time: next, playing: true };
  return loop ? { time: next % duration, playing: true } : { time: duration, playing: false };
}

/* ----------------------------------------------------------------- geometry */

export type Pose = { x: number; y: number; rot: number; scale: number; opacity: number };
type PoseKey = { t: number } & Partial<Pose>;
export type Role = "research" | "experience" | "engineering";
export const ROLES: readonly Role[] = ["research", "experience", "engineering"];
export type ButtonState = "hidden" | "idle" | "press" | "done";
type Anchor = { x: number; y: number; rot?: number };

/** Stage-level anchors. Wide and narrow each get their own composition instead of one
 *  being patched out of the other with offsets. */
const GEO = {
  wide: {
    corner: { x: 92, y: 58 },
    notes: [{ x: 1006, y: 258, rot: -2.4 }, { x: 1072, y: 426, rot: 3.1 }, { x: 986, y: 594, rot: -1.6 }],
    thought: { x: 462, y: 776 },
    caption: { x: 290, y: 352 },
    brand: { x: 290, y: 318 },
    /* The fusion panel sits between the parked sheets and the product draft, which is
     * the path the contributions actually travel. */
    fusion: { x: 258, y: 418, w: 448, h: 372 },
  },
  compact: {
    corner: { x: 44, y: 46 },
    notes: [{ x: 104, y: 898, rot: -2.4 }, { x: 330, y: 1000, rot: 3.1 }, { x: 146, y: 1102, rot: -1.6 }],
    thought: { x: 82, y: 1210 },
    caption: { x: 80, y: 340 },
    brand: { x: 62, y: 172 },
    fusion: { x: 130, y: 130, w: 600, h: 400 },
  },
} as const;
export type StageGeo = {
  corner: Anchor; notes: readonly Anchor[]; thought: Anchor; caption: Anchor; brand: Anchor;
  fusion: { x: number; y: number; w: number; h: number };
};
export const geo = (compact: boolean) => (compact ? GEO.compact : GEO.wide) as StageGeo;

const CLIENT_CURSOR = {
  wide: { from: { x: 1010, y: 816 }, to: { x: 668, y: 694 } },
  compact: { from: { x: 596, y: 1284 }, to: { x: 270, y: 1188 } },
} as const;

function productKeys(compact: boolean): PoseKey[] {
  const o = CUES.ideaEnter;
  const O = CUES.outlook;
  return compact
    ? [
      { t: 0, x: 340, y: 948, rot: 2.4, scale: 0.84, opacity: 0 },
      { t: o, opacity: 1 },
      { t: o + 0.5, x: 394, y: 884, rot: -0.9, scale: 0.888 },
      { t: o + 0.67, x: 390, y: 880, rot: 0.5, scale: 0.88 },
      { t: o + 0.83, x: 388, y: 880, rot: 0 },
      { t: CUES.handoff.from },
      /* On a phone the draft drops out of the way while the team works, so a sheet in
       * the middle of the desk can be read whole, and comes back up for the decision. */
      { t: CUES.handoff.to, x: 380, y: 1140, rot: 0, scale: 1 },
      { t: CUES.fuse.open - 0.7 },
      { t: CUES.fuse.open + 0.3, y: 965 },
      { t: O.spread.from },
      { t: O.spread.to, y: 906 },
      { t: O.restore.from },
      { t: O.restore.to, x: 380, y: 880, rot: -0.8, scale: 0.78 },
    ]
    : [
      { t: 0, x: 700, y: 518, rot: 2.4, scale: 0.9, opacity: 0 },
      { t: o, opacity: 1 },
      { t: o + 0.5, x: 776, y: 456, rot: -0.9, scale: 0.938 },
      { t: o + 0.67, x: 772, y: 452, rot: 0.5, scale: 0.93 },
      { t: o + 0.83, x: 770, y: 452, rot: 0 },
      { t: CUES.handoff.from },
      /* Parked to the right of the fusion panel, with the agent rail beyond it. */
      { t: CUES.handoff.to, x: 1015, y: 452, rot: 0, scale: 1 },
      { t: O.spread.from },
      /* The rail is put away for the client preview, so the draft takes the middle. */
      { t: O.spread.to, x: 890 },
      { t: O.restore.from },
      { t: O.restore.to, x: 1010, y: 450, rot: -0.8, scale: 0.78 },
    ];
}

function quoteKeys(compact: boolean): PoseKey[] {
  const o = CUES.quoteEnter;
  const home = compact ? { x: 468, y: 576 } : { x: 785, y: 440 };
  const away = compact ? { x: 120, y: 1296 } : { x: 250, y: 838 };
  return [
    { t: 0, x: home.x - 62, y: home.y + 62, rot: -3.4, scale: 0.96, opacity: 0 },
    { t: o, opacity: 1 },
    { t: o + 0.5, x: home.x + 6, y: home.y - 6, rot: 1.2, scale: 1.006 },
    { t: o + 0.67, ...home, rot: -1.4, scale: 1 },
    { t: o + 0.83, x: home.x + 2, y: home.y, rot: -0.8 },
    { t: CUES.quoteExit.from },
    { t: CUES.quoteExit.to, ...away, rot: -14, scale: 0.5, opacity: 0 },
  ];
}

/* Parked in one row above the fusion panel, in the order they contributed. */
const PARKED: Record<Role, Pose> = {
  research: { x: 322, y: 232, rot: -8, scale: 0.27, opacity: 0.78 },
  experience: { x: 478, y: 232, rot: 5, scale: 0.27, opacity: 0.78 },
  engineering: { x: 634, y: 232, rot: -4, scale: 0.27, opacity: 0.78 },
};
const MOBILE_PARKED: Record<Role, Pose> = {
  research: { x: 105, y: 486, rot: -8, scale: 0.2, opacity: 0.78 },
  experience: { x: 655, y: 486, rot: 6, scale: 0.2, opacity: 0.78 },
  engineering: { x: 380, y: 486, rot: -4, scale: 0.2, opacity: 0.78 },
};
/** The closing composition: the sheets gather back around the finished draft without
 *  covering the brand line. */
const FINALE: Record<Role, Pose> = {
  research: { x: 700, y: 260, rot: -8, scale: 0.4, opacity: 0.62 },
  experience: { x: 1350, y: 300, rot: 6, scale: 0.42, opacity: 0.64 },
  engineering: { x: 1290, y: 626, rot: -5, scale: 0.4, opacity: 0.64 },
};
const MOBILE_FINALE: Record<Role, Pose> = {
  research: { x: 285, y: 510, rot: -8, scale: 0.26, opacity: 0.62 },
  experience: { x: 620, y: 480, rot: 6, scale: 0.26, opacity: 0.64 },
  engineering: { x: 380, y: 1240, rot: -4, scale: 0.22, opacity: 0.64 },
};
const WORK_TIMES = {
  research: { enter: CUES.researchEnter, park: CUES.researchPark, rot: -3.2 },
  experience: { enter: CUES.uxEnter, park: CUES.uxPark, rot: 1.8 },
  engineering: { enter: CUES.engineeringEnter, park: CUES.engineeringPark, rot: -1.5 },
} as const;

function workKeys(role: Role, compact: boolean): PoseKey[] {
  const { enter, park, rot } = WORK_TIMES[role];
  const focus = compact ? { x: 380, y: 520 } : { x: 472, y: 440 };
  const focusScale = compact ? 0.84 : 1;
  const O = CUES.outlook;
  return [
    { t: 0, x: focus.x - 95, y: focus.y + 60, rot: rot - 7, scale: focusScale * 0.98, opacity: 0 },
    { t: enter, opacity: 1 },
    { t: enter + 0.67, x: focus.x + 3, y: focus.y - 2, rot: rot + 0.5, scale: focusScale },
    { t: enter + 0.83, ...focus, rot },
    { t: park.from },
    { t: park.to, ...(compact ? MOBILE_PARKED : PARKED)[role] },
    { t: O.restore.from },
    { t: O.restore.to, ...(compact ? MOBILE_FINALE : FINALE)[role] },
  ];
}

/** Fixed paths in paper-local or stage-local coordinates. Nothing here is random, so
 *  a stroke drawn at t looks the same on every pass. */
export const INK = {
  quoteRule: ["M 64 232 C 138 228, 248 235, 372 230"],
  underline: ["M 128 321 C 158 318, 181 324, 209 320", "M 209 320 L 248 321"],
  strike: ["M 111 265 C 154 261, 186 268, 221 264", "M 221 264 L 279 265"],
  engineering: ["M 65 461 C 130 457, 205 464, 302 459"],
  /** Engineering's answer, drawn around UX's open question on the UX sheet. */
  scopeCircle: ["M 66 610 C 40 594, 78 566, 190 562 C 320 557, 424 570, 420 588 C 416 608, 300 618, 190 614 C 120 611, 72 612, 62 602"],
  /* Three short arrows from the parked sheets down into the fusion panel. */
  /* Routed around the identity markers under each parked sheet rather than through
   * them, so the marks stay readable while the contributions travel. */
  links: [
    ["M 298 320 C 252 348, 258 388, 288 420", "M 288 420 L 277 409 M 288 420 L 297 408"],
    ["M 502 322 C 556 352, 522 390, 472 420", "M 472 420 L 470 406 M 472 420 L 485 412"],
    ["M 658 322 C 702 354, 662 392, 620 420", "M 620 420 L 619 406 M 620 420 L 633 412"],
  ],
  /* And one from the panel to the proposal on the product draft. */
  fusionArrow: ["M 712 556 C 764 552, 792 528, 828 512", "M 828 512 L 814 511 M 828 512 L 817 521"],
  mobileFusionArrow: ["M 372 552 C 352 676, 316 820, 300 906", "M 300 906 L 296 890 M 300 906 L 311 894"],
} as const;

/* ------------------------------------------------------------------ sampling */

function designerKeys(compact: boolean): PoseKey[] {
  const home = compact ? { x: -6, y: 320, scale: 0.73 } : { x: 96, y: 235, scale: 1 };
  /* Once the idea is handed over the creator stays beside the project space; the
   * agent rail never takes their place in the frame. */
  const beside = compact ? { x: 16, y: 224, scale: 0.23 } : { x: 24, y: 486, scale: 0.46 };
  return [
    { t: 0, ...home, rot: 0, opacity: 0 },
    { t: CUES.designerEnter, opacity: 1 },
    { t: CUES.handoff.from },
    { t: CUES.handoff.to, ...beside, opacity: 1 },
    { t: CUES.outlook.restore.from },
    { t: CUES.outlook.restore.to, ...(compact ? { x: 24, y: 455, scale: 0.3 } : beside) },
  ];
}

/** The creator only changes what they are thinking when something new has landed. */
const CREATOR_BEATS = [
  { at: CUES.handoff.to, thought: 0, gesture: "think" },
  { at: CUES.researchLine2 + 0.75, thought: 1, gesture: "think" },
  { at: CUES.uxSketch[2] + 0.5, thought: 2, gesture: "idea" },
  { at: CUES.engineeringLines[1] + 0.5, thought: 3, gesture: "think" },
  { at: FUSE.result + 0.4, thought: 4, gesture: "think" },
  { at: DECIDE.cursorIn - 0.25, thought: 5, gesture: "idea" },
  { at: DECIDE.revised2 + 0.5, thought: 6, gesture: "idea" },
  { at: CUES.outlook.card + 1, thought: 7, gesture: "work" },
  { at: CUES.outlook.confirm + 0.25, thought: 8, gesture: "idea" },
] as const;

/* What each agent is doing, and what it has handed in. Both are indexes into the
 * copy, so the rail says the same thing in three languages and changes only when the
 * film actually shows the contribution being made. */
type AgentStep = { at: number; work: number; note: number };
const AGENT_STEPS: Record<Role, AgentStep[]> = {
  research: [
    { at: CUES.researchEnter, work: 0, note: -1 },
    { at: CUES.researchLine1, work: 1, note: -1 },
    { at: CUES.researchLine2 + 0.5, work: 2, note: 0 },
  ],
  experience: [
    { at: CUES.uxEnter, work: 0, note: -1 },
    { at: CUES.uxSketch[0], work: 1, note: -1 },
    { at: CUES.uxOption + 0.5, work: 2, note: 0 },
  ],
  engineering: [
    { at: CUES.engineeringEnter, work: 0, note: -1 },
    { at: CUES.engineeringLines[1] + 0.5, work: 1, note: 0 },
    { at: CUES.engineeringFootnote + 0.5, work: 2, note: 1 },
  ],
};

export type WorkText = { title: number; byline: number; tag: number; lines: number[]; quote: number; footnote: number };
/** One client question's reading state: shown / currently highlighted / answered. */
export type AskState = { opacity: number; live: boolean; done: boolean };
export type AgentState = {
  role: Role;
  /** Index into the agent's `work` lines, or -1 before its turn starts. */
  work: number;
  /** Index into the agent's `notes`, or -1 before it has handed anything in. */
  note: number;
  /** 0 waiting · 1 working · 2 handed in. */
  phase: 0 | 1 | 2;
  /** True while this agent's sheet is the one in the middle of the desk. */
  live: boolean;
};
export type Scene = {
  t: number; fade: number; compact: boolean; product: Pose; quote: Pose;
  designer: { pose: Pose; gesture: "work" | "think" | "idea"; equipment: number; thought: number; thoughtOpacity: number };
  workspace: { opacity: number; phase: number; status: number; adopted: boolean; version: string; decision: number };
  opening: {
    corner: number; quoteChip: number; quoteTitle: number; quoteRule: number; quotePrice: number;
    notes: AskState[]; thought: number;
  };
  work: Record<Role, Pose>; workText: Record<Role, WorkText>;
  /** Where the small identity marker for a parked sheet goes, and how visible it is. */
  tags: Record<Role, { x: number; y: number; opacity: number }>;
  rail: { opacity: number; agents: AgentState[]; summary: number };
  fusion: { opacity: number; chips: number[]; shared: number; trade: number; result: number };
  productText: {
    stageLabel: number; title: number; original: number; originalLines: [number, number];
    proposal: number; proposalDetail: number; deferred: number;
    revised1: number; revised2: number; revisedMark: number; lift: number;
  };
  uxSketch: number[]; acceptedSketch: number[]; sketchOpacity: number;
  proposalOpacity: number; button: ButtonState;
  outlook: {
    card: number; rows: number[]; total: number; button: ButtonState; confirm: number;
    asks: AskState[]; caption: [number, number]; brand: [number, number, number];
  };
  ink: { underline: number; strike: number; engineering: number; scopeCircle: number; links: number[]; fusionArrow: number; arrowOpacity: number };
  cursor: { visible: boolean; x: number; y: number; pressed: boolean };
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
const appear = (t: number, at: number) => (t < at ? 0 : t < at + FRAME ? 0.55 : t < at + 2 * FRAME ? 0.88 : 1);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

function samplePose(keys: PoseKey[], t: number): Pose {
  let pose: Pose = { x: 0, y: 0, rot: 0, scale: 1, opacity: 1 };
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.t > t) {
      if (!i) break;
      const p = ramp(t, keys[i - 1].t, key.t);
      // Moving out to the edge is a long trip: ease in and out rather than crossing
      // half the desk on the first frame.
      const parking = key.scale !== undefined && key.scale < 0.9;
      const eased = parking ? p * p * (3 - 2 * p) : 1 - (1 - p) ** 3;
      for (const axis of ["x", "y", "rot", "scale", "opacity"] as const) {
        if (axis === "opacity" && pose.opacity === 0) continue;
        const target = key[axis];
        if (target !== undefined) pose[axis] += (target - pose[axis]) * eased;
      }
      break;
    }
    pose = {
      x: key.x ?? pose.x, y: key.y ?? pose.y, rot: key.rot ?? pose.rot,
      scale: key.scale ?? pose.scale, opacity: key.opacity ?? pose.opacity,
    };
  }
  return pose;
}

function sampleAgent(role: Role, t: number, live: boolean): AgentState {
  const steps = AGENT_STEPS[role];
  let work = -1;
  let note = -1;
  for (const step of steps) {
    if (t < step.at) break;
    work = step.work;
    if (step.note >= 0) note = step.note;
  }
  return { role, work, note, phase: note >= 0 ? 2 : work >= 0 ? 1 : 0, live };
}

export function sampleScene(rawTime: number, compact = false, loop = true): Scene {
  const t = quantize(Math.max(0, Math.min(rawTime, DURATION)));
  const a = (at: number) => appear(t, at);
  const stroke = (at: number) => ramp(t, at, at + 0.33);
  const O = CUES.outlook;
  const F = CUES.fuse;
  const D = CUES.decide;

  /* How far into the client's view the film is: 1 while the draft is opened out, 0
   * once it folds back. Everything that belongs to the workspace — team sheets, the
   * rail, the struck-out first description, the accepted sketch — reads the inverse,
   * so opening and folding back are symmetrical at any time you drag to. */
  const focus = clamp01(ramp(t, O.spread.from, O.spread.to) - ramp(t, O.restore.from, O.restore.to));
  const periphery = 1 - focus;

  const button: ButtonState = t < F.button ? "hidden"
    : t < D.cursorPress ? "idle" : t < D.cursorRelease ? "press" : "done";
  const clientButton: ButtonState = t < O.button ? "hidden"
    : t < O.cursorPress ? "idle" : t < O.cursorRelease ? "press" : "done";

  const asks = (starts: readonly number[], endAll: number): AskState[] =>
    starts.map((at) => {
      const end = Math.min(at + ASK_SPAN, endAll);
      const live = t >= at && t < end;
      return { opacity: a(at) * (live ? 1 : 0.58), live, done: t >= end };
    });

  const actCursor = t >= D.cursorIn && t < D.cursorOut;
  const endCursor = t >= O.cursorIn && t < O.cursorOut;
  const cc = compact ? CLIENT_CURSOR.compact : CLIENT_CURSOR.wide;
  const actP = ramp(t, D.cursorIn, D.cursorArrive);
  const endP = ramp(t, O.cursorIn, O.cursorArrive);
  const cursor = endCursor
    ? {
      visible: true, x: lerp(cc.from.x, cc.to.x, endP), y: lerp(cc.from.y, cc.to.y, endP),
      pressed: clientButton === "press",
    }
    : {
      visible: actCursor,
      x: (compact ? 436 : 1072) - 155 * actP, y: (compact ? 1333 : 800) - 76 * actP,
      pressed: button === "press",
    };

  const work = {
    research: samplePose(workKeys("research", compact), t),
    experience: samplePose(workKeys("experience", compact), t),
    engineering: samplePose(workKeys("engineering", compact), t),
  };
  /* On a narrow screen the fusion card needs the whole upper half, so the parked
   * sheets stand down for it; their identities carry on in the card's signed rows. */
  /* On a phone the fusion card owns the upper half while it is open, so the parked
   * sheets and the creator's line stand down for it and come back — in that order —
   * once it has closed, which is a beat before the decision rather than after it. */
  const fusionEnd = compact
    ? { from: D.cursorIn - 1.6, to: D.cursorIn - 1.1 }
    : D.arrowFade;
  const mobileFusionHide = compact
    ? clamp01(ramp(t, F.open, F.open + 0.5) - ramp(t, D.cursorIn - 1.1, D.cursorIn - 0.6))
    : 0;
  const mobileThoughtHide = compact
    ? clamp01(ramp(t, F.open - 0.3, F.open + 0.2) - ramp(t, D.cursorIn - 0.9, D.cursorIn - 0.4))
    : 0;
  const paperH = LAYOUT.work.h;
  const tags = {} as Scene["tags"];
  /* While one sheet is in the middle of the desk it lies over the parked ones, so the
   * markers wait: they belong to the moment every sheet is side by side. */
  const anyLive = t < CUES.engineeringPark.to && t >= CUES.researchEnter;
  for (const role of ROLES) {
    work[role].opacity *= periphery * (1 - mobileFusionHide);
    const pose = work[role];
    tags[role] = {
      x: pose.x,
      y: pose.y + (paperH * pose.scale) / 2 + (compact ? 12 : 16),
      // The signature is printed on the sheet at reading size; once the sheet is small
      // enough that the print cannot be read, this marker takes over.
      opacity: anyLive ? 0 : pose.opacity * clamp01((0.62 - pose.scale) / 0.12),
    };
  }

  const creator = [...CREATOR_BEATS].reverse().find((beat) => t >= beat.at);
  const workspaceOpacity = ramp(t, CUES.handoff.from, CUES.handoff.to);
  const updated = t >= D.revised2;
  const workspaceStatus = t >= O.spread.from && t < O.restore.from ? 5
    : updated ? 4 : button === "done" ? 3 : t >= F.open ? 2
    : t >= CUES.researchEnter ? 1 : 0;

  const agents = ROLES.map((role) => sampleAgent(
    role, t,
    // "Live" means this agent's sheet is the one being worked on in the middle.
    role === "research" ? t >= CUES.researchEnter && t < CUES.researchPark.to
      : role === "experience" ? t >= CUES.uxEnter && t < CUES.uxPark.to
      : t >= CUES.engineeringEnter && t < CUES.engineeringPark.to,
  ));
  const handedIn = agents.filter((agent) => agent.note >= 0).length;
  const railSummary = button === "done" ? 5 : t >= F.open ? 4 : handedIn;

  const fusionOpen = ramp(t, F.open, F.open + 0.33) * (1 - ramp(t, fusionEnd.from, fusionEnd.to));

  return {
    t, compact,
    workspace: {
      opacity: workspaceOpacity, status: workspaceStatus,
      phase: updated ? 3 : t >= F.open ? 2 : t >= CUES.researchEnter ? 1 : 0,
      adopted: button === "done", version: updated ? "v0.2" : "v0.1",
      decision: button === "done" ? 2 : t >= F.proposal ? 1 : 0,
    },
    product: samplePose(productKeys(compact), t),
    quote: samplePose(quoteKeys(compact), t),
    designer: {
      pose: samplePose(designerKeys(compact), t),
      gesture: creator?.gesture ?? (t < CUES.designerThink ? "work" : t < CUES.designerIdea ? "think" : "idea"),
      thought: creator ? creator.thought : -1,
      /* On a phone the fusion card takes the space the thought sits in, so the two
       * take turns rather than stacking on top of each other. */
      thoughtOpacity: creator
        ? a(creator.at) * (1 - ramp(t, O.restore.from, O.restore.to)) * (1 - mobileThoughtHide)
        : 0,
      equipment: 1 - ramp(t, CUES.ideaEnter, CUES.designerIdea),
    },
    fade: ramp(t, CUES.fadeIn.from, CUES.fadeIn.to) * (loop ? 1 - ramp(t, CUES.fadeOut.from, CUES.fadeOut.to) : 1),
    opening: {
      corner: a(CUES.corner) * (1 - ramp(t, CUES.cornerFade.from, CUES.cornerFade.to)),
      quoteChip: a(CUES.quoteChip), quoteTitle: a(CUES.quoteTitle),
      quoteRule: stroke(CUES.quoteRule), quotePrice: a(CUES.quotePrice),
      notes: asks(CUES.notes, CUES.thought).map((s) => ({
        ...s, opacity: s.opacity * (1 - ramp(t, CUES.notesFade.from, CUES.notesFade.to)),
      })),
      thought: a(CUES.thought) * (1 - ramp(t, CUES.thoughtFade.from, CUES.thoughtFade.to)),
    },
    work, tags,
    workText: {
      research: {
        title: a(CUES.researchTitle), byline: a(CUES.researchByline), tag: a(CUES.researchTag),
        lines: [a(CUES.researchLine1), a(CUES.researchLine2)], quote: 0, footnote: 0,
      },
      experience: {
        title: a(CUES.uxTitle), byline: a(CUES.uxByline), tag: a(CUES.uxTag),
        lines: [a(CUES.uxQuestion)], quote: 0, footnote: a(CUES.uxOption),
      },
      engineering: {
        title: a(CUES.engineeringTitle), byline: a(CUES.engineeringByline), tag: a(CUES.engineeringTag),
        lines: CUES.engineeringLines.map(a), quote: a(CUES.engineeringQuote),
        footnote: a(CUES.engineeringFootnote),
      },
    },
    rail: {
      // On a phone the fusion card carries all three signed contributions itself, so
      // the status strip steps aside for it rather than repeating them above it.
      opacity: workspaceOpacity * (1 - ramp(t, O.spread.from, O.spread.to)) * (1 - mobileFusionHide),
      agents, summary: railSummary,
    },
    fusion: {
      opacity: fusionOpen * periphery,
      chips: F.links.map(a), shared: a(F.shared), trade: a(F.trade), result: a(F.result),
    },
    productText: {
      stageLabel: a(CUES.productStageLabel), title: a(CUES.productTitle),
      original: periphery, originalLines: [a(CUES.productOriginal1), a(CUES.productOriginal2)],
      proposal: a(F.proposal), proposalDetail: a(F.proposalDetail), deferred: a(F.deferred),
      revised1: a(D.revised1), revised2: a(D.revised2),
      revisedMark: a(D.revisedMark), lift: focus,
    },
    uxSketch: CUES.uxSketch.map(stroke),
    // The gate is explicit: exploration cannot reach the product draft before the
    // creator has confirmed it.
    acceptedSketch: D.acceptedSketch.map((at) => (button === "done" ? stroke(at) : 0)),
    sketchOpacity: periphery,
    proposalOpacity: 1 - ramp(t, D.proposalFade.from, D.proposalFade.to),
    button,
    outlook: {
      card: ramp(t, O.spread.from, O.spread.to) * a(O.card) * (1 - ramp(t, O.cardOut.from, O.cardOut.to)),
      rows: O.rows.map(a), total: a(O.total),
      button: clientButton, confirm: a(O.confirm),
      asks: asks(O.asks, O.cursorIn),
      caption: [a(O.caption1), a(O.caption2)].map((v) => v * (1 - ramp(t, O.captionFade.from, O.captionFade.to))) as [number, number],
      brand: [a(O.brand), a(O.brandLine1), a(O.brandLine2)],
    },
    ink: {
      underline: ramp(t, CUES.underline.from, CUES.underline.to),
      strike: button === "done" ? ramp(t, D.strike.from, D.strike.to) : 0,
      engineering: stroke(CUES.engineeringInk),
      scopeCircle: stroke(CUES.scopeCircle),
      links: F.links.map(stroke),
      fusionArrow: stroke(F.arrow),
      arrowOpacity: (1 - ramp(t, fusionEnd.from, fusionEnd.to)) * periphery,
    },
    cursor,
  };
}
