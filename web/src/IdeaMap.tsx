import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type MapLocale = "en" | "ja" | "zh-CN";

type Point = { x: number; y: number };

type MapCopy = {
  nodes: { label: string; question: string }[];
  detours: { label: string; note: string }[];
  result: { label: string; note: string };
  /* The hero this drawing belonged to. It has left the landing page, so the words it
   * needs live here rather than in `siteCopy`, where they would read as copy the site
   * still shows. */
  eyebrow: string;
  title: string;
  intro: string;
  closing: string;
  replay: string;
  replayed: string;
};

// The map is drawn in this space; labels are positioned as percentages of it, so the
// text stays real DOM while the route stays vector.
const VIEW = { width: 1000, height: 600 };

type Layout = {
  nodes: Point[];
  result: Point;
  detours: { from: number; to: Point }[];
};

const WIDE: Layout = {
  // Spaced with the shortest box in mind: the drawing stretches, the labels do not,
  // so a laptop-height map compresses these gaps in pixels while the cards stay put.
  nodes: [
    { x: 175, y: 455 },
    { x: 285, y: 350 },
    { x: 445, y: 470 },
    { x: 615, y: 290 },
    { x: 745, y: 405 },
  ],
  // Nudged out and up from 845,118: at the readable label size the boundary card is
  // two lines tall and its corner reached the result card.
  result: { x: 870, y: 105 },
  detours: [
    { from: 0, to: { x: 245, y: 160 } },
    { from: 1, to: { x: 400, y: 590 } },
    { from: 2, to: { x: 560, y: 120 } },
  ],
};

/* Narrow screens read top to bottom, so the route does too: the first idea is the
 * first thing scrolled past and the finished plan is the last. The earlier compact
 * layout climbed upward, which put the result on screen before the work that earned
 * it. Two columns rather than three, because one card is more than a third of a
 * phone's width; and one detour rather than three, because the roads not taken are
 * what compresses first when the alternative is dropping what a landmark means. */
const COMPACT: Layout = {
  // Two columns that alternate down the page, with a gap wide enough that a left card
  // and a right card can never touch whatever language they are in. `y` values are
  // spaced for the tallest cards, which are English and Japanese rather than Chinese.
  nodes: [
    { x: 250, y: 125 },
    { x: 730, y: 225 },
    { x: 250, y: 310 },
    { x: 250, y: 430 },
    { x: 730, y: 500 },
  ],
  // Last, and on its own side, so the finished plan is the bottom of the scroll.
  result: { x: 250, y: 530 },
  detours: [{ from: 2, to: { x: 730, y: 390 } }],
};

const COPY: Record<MapLocale, MapCopy> = {
  en: {
    nodes: [
      { label: "A rough idea", question: "One sentence is enough" },
      { label: "Who has the problem", question: "And when does it hit them" },
      { label: "See a prototype", question: "Something you can click" },
      { label: "Version one's scope", question: "What it will not do" },
      { label: "Handoff", question: "Coding AI, with acceptance" },
    ],
    detours: [
      { label: "Start writing code", note: "Looks fastest" },
      { label: "Pick the stack first", note: "Feels like progress" },
      { label: "Build every feature", note: "Looks more complete" },
    ],
    result: { label: "First-version plan", note: "Prototype, scope, acceptance" },
    eyebrow: "For people about to build with AI",
    title: "Turn one idea into a prototype you can see and a first version you can hand over.",
    intro: "You can already get AI to write the code. What is missing is version one: who it is for, what it looks like, what it does and does not do.",
    closing: "An idea is not a straight line. The next step can still be clear.",
    replay: "Play the route again",
    replayed: "The route starts over.",
  },
  ja: {
    nodes: [
      { label: "曖昧なアイデア", question: "一文あれば足ります" },
      { label: "誰の困りごとか", question: "いつ起きるのか" },
      { label: "試作を見る", question: "触れるものを先に" },
      { label: "初版の範囲", question: "この版でやらないこと" },
      { label: "引き渡し", question: "完了条件つきで AI へ" },
    ],
    detours: [
      { label: "すぐコードを書く", note: "一番速く見える" },
      { label: "先に技術を選ぶ", note: "進んで見える" },
      { label: "機能を全部入れる", note: "完成して見える" },
    ],
    result: { label: "初版の計画", note: "試作・範囲・完了条件" },
    eyebrow: "AI と一緒に作り始める人へ",
    title: "アイデアを、目に見える試作と、引き渡せる初版に。",
    intro: "コードは AI に書かせられる。決まっていないのは初版です。誰のどの困りごとを、どこまで解くのか。",
    closing: "アイデアは直線ではない。それでも次の一歩は決められる。",
    replay: "ルートをもう一度",
    replayed: "ルートを最初から再生します。",
  },
  "zh-CN": {
    nodes: [
      { label: "一句模糊想法", question: "先说出来就够" },
      { label: "谁遇到这个问题", question: "什么时候遇到" },
      { label: "看见原型", question: "先看到能点的东西" },
      { label: "第一版的范围", question: "这一版不做什么" },
      { label: "交给编程 AI", question: "带着验收条件开工" },
    ],
    detours: [
      { label: "直接开始写代码", note: "看起来最快" },
      { label: "先挑技术栈", note: "看起来在推进" },
      { label: "把功能全部做上", note: "看起来更完整" },
    ],
    result: { label: "第一版方案", note: "原型、范围、验收条件" },
    eyebrow: "给准备用 AI 写代码的人",
    title: "把一个想法，变成看得见的原型和可以交接的第一版。",
    intro: "你已经能让 AI 写代码，缺的是第一版到底该做什么：为谁解决什么，这一版做什么和不做什么。",
    closing: "想法不是直线，但下一步可以很清楚。",
    replay: "重看这段路线",
    replayed: "路线重新开始。",
  },
};

/* The route is generated from the layout rather than hand-timed, because the phone
 * shows one detour and the desktop shows three, and a hand-written beat table can
 * only be right for one of them.
 *
 * Every beat only ever adds something: nothing already lit goes dark again, so an
 * interrupted frame still reads. Refusing a detour is three separate moments rather
 * than one — the idea holds still, the sign is crossed out, and only then does the
 * wrong road fade. Collapsing them made the decision invisible.
 *
 * The whole run finishes in under five seconds, so nothing a visitor needs to
 * understand is behind a wait, and there is a replay control besides. */
type Beat =
  | { kind: "node"; index: number }
  | { kind: "tempt" | "hold" | "cross" | "dim"; detour: number };

const DURATION: Record<Beat["kind"], number> = {
  node: 300,
  tempt: 260,
  hold: 210,
  cross: 250,
  dim: 190,
};
const RESULT_MS = 340;

type Script = {
  /** Where the idea sits at each beat, including the times it wanders off. */
  positions: Point[];
  /** Beat index at which each landmark lights. */
  nodeAt: number[];
  detourAt: { tempt: number; cross: number; dim: number }[];
  resultAt: number;
  hesitating: boolean[];
  /** Cumulative offsets from the start, one per beat after the first. */
  times: number[];
};

function toward(from: Point, to: Point, amount: number): Point {
  return { x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount };
}

function buildScript(layout: Layout): Script {
  const beats: Beat[] = [];
  layout.nodes.forEach((_, index) => {
    beats.push({ kind: "node", index });
    layout.detours.forEach((detour, at) => {
      if (detour.from !== index) return;
      beats.push({ kind: "tempt", detour: at });
      beats.push({ kind: "hold", detour: at });
      beats.push({ kind: "cross", detour: at });
      beats.push({ kind: "dim", detour: at });
    });
  });

  const positions: Point[] = [];
  const nodeAt: number[] = [];
  const detourAt: { tempt: number; cross: number; dim: number }[] = layout.detours.map(() => ({
    tempt: Number.POSITIVE_INFINITY,
    cross: Number.POSITIVE_INFINITY,
    dim: Number.POSITIVE_INFINITY,
  }));
  const hesitating: boolean[] = [];
  const times: number[] = [];
  let clock = 0;

  beats.forEach((beat, index) => {
    if (index > 0) {
      clock += DURATION[beats[index - 1].kind];
      times.push(clock);
    }
    hesitating.push(beat.kind === "hold" || beat.kind === "cross");
    if (beat.kind === "node") {
      nodeAt[beat.index] = index;
      positions.push(layout.nodes[beat.index]);
      return;
    }
    const detour = layout.detours[beat.detour];
    const anchor = layout.nodes[detour.from];
    if (beat.kind === "tempt") detourAt[beat.detour].tempt = index;
    if (beat.kind === "cross") detourAt[beat.detour].cross = index;
    if (beat.kind === "dim") detourAt[beat.detour].dim = index;
    positions.push(beat.kind === "dim" ? anchor : toward(anchor, detour.to, beat.kind === "tempt" ? 0.42 : 0.46));
  });

  clock += DURATION[beats[beats.length - 1].kind] + RESULT_MS;
  times.push(clock);
  hesitating.push(false);
  positions.push(layout.result);

  return { positions, nodeAt, detourAt, resultAt: positions.length - 1, hesitating, times };
}

/** A tilt in the direction of travel. Full rotation would read as tumbling. */
function tiltAt(stage: number, positions: Point[]): number {
  if (stage === 0) return 0;
  const from = positions[stage - 1];
  const to = positions[stage];
  const degrees = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  return Math.max(-24, Math.min(24, degrees * 0.28));
}

function curve(from: Point, to: Point): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const bow = (to.y - from.y) * 0.2;
  return `M ${from.x} ${from.y} Q ${midX + bow} ${midY - bow} ${to.x} ${to.y}`;
}

/** The shell, kept from the hero mark: an idea that has not hatched yet. */
function eggPath(center: Point, w: number, h: number): string {
  const { x, y } = center;
  return [
    `M ${x} ${y - h}`,
    `C ${x + w * 0.62} ${y - h} ${x + w} ${y - h * 0.18} ${x + w} ${y + h * 0.22}`,
    `C ${x + w} ${y + h * 0.72} ${x + w * 0.58} ${y + h} ${x} ${y + h}`,
    `C ${x - w * 0.58} ${y + h} ${x - w} ${y + h * 0.72} ${x - w} ${y + h * 0.22}`,
    `C ${x - w} ${y - h * 0.18} ${x - w * 0.62} ${y - h} ${x} ${y - h}`,
    "Z",
  ].join(" ");
}

/** One small mark per stage, so five landmarks do not read as five identical boxes. */
function StageMark({ index }: { index: number }) {
  const marks = [
    // A rough idea: an outline that has not closed yet.
    <circle cx="7" cy="7" r="5" strokeDasharray="3 2.6" key="idea" />,
    // Who has it: a person-shaped mark rather than another box.
    <g key="who">
      <circle cx="7" cy="4.6" r="2.6" />
      <path d="M 2.2 12.4 C 2.9 9 11.1 9 11.8 12.4" />
    </g>,
    // What already exists: something checked off a source.
    <g key="evidence">
      <rect x="1.6" y="1.6" width="10.8" height="10.8" rx="2.4" />
      <path d="M 4.4 7.2 L 6.4 9.2 L 9.8 5" />
    </g>,
    // Scope: a line this version does not cross.
    <g key="boundary">
      <path d="M 1.6 7 L 12.4 7" strokeDasharray="2.6 2.2" />
      <path d="M 4 3.4 L 4 10.6" />
    </g>,
    // Handoff: it leaves, into something else.
    <g key="handoff">
      <path d="M 1.6 7 L 9.6 7" />
      <path d="M 6.8 4 L 9.8 7 L 6.8 10" />
      <path d="M 12.4 2.8 L 12.4 11.2" />
    </g>,
  ];
  return (
    <svg className="map-mark-icon" viewBox="0 0 14 14" aria-hidden="true">
      {marks[index]}
    </svg>
  );
}

/**
 * The landing page's first hero: an idea finding a route past the roads not taken.
 *
 * It no longer opens the site — the page now shows the outcome of the case the demo
 * works out, rather than a second animation of a different metaphor — but it is kept
 * whole, and runs at `/lab/?view=hero`.
 */
export function IdeaMapHero({
  locale,
  actions,
}: {
  locale: MapLocale;
  actions?: ReactNode;
}) {
  const copy = COPY[locale];
  const [compact, setCompact] = useState(false);
  const [stage, setStage] = useState(0);
  const [run, setRun] = useState(0);
  const [replayed, setReplayed] = useState(false);
  const reduceMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;
  const layout = compact ? COMPACT : WIDE;
  const script = useMemo(() => buildScript(layout), [layout]);
  const final = script.resultAt;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setStage(final);
      return;
    }
    setStage(0);
    const timers = script.times.map((at, index) =>
      window.setTimeout(() => setStage(index + 1), at),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [final, reduceMotion, run, script]);

  const replay = useCallback(() => {
    setReplayed(true);
    setRun((value) => value + 1);
  }, []);

  const token = script.positions[Math.min(stage, final)];
  const percent = (point: Point) => ({
    left: `${(point.x / VIEW.width) * 100}%`,
    top: `${(point.y / VIEW.height) * 100}%`,
  });
  const lit = script.nodeAt.filter((at) => stage >= at).length;
  const cracks = Math.max(0, Math.min(3, lit - 1));
  const hatched = stage >= script.nodeAt[4];
  const arrived = stage >= final;
  // The held beat before each refusal: the idea leans into the wrong road and stops.
  const hesitating = script.hesitating[Math.min(stage, final)];

  const detourState = (index: number) => {
    const beats = script.detourAt[index];
    if (stage >= beats.dim) return "refused";
    if (stage >= beats.cross) return "crossed";
    if (stage >= beats.tempt) return "tempting";
    return "hidden";
  };

  return (
    <section className="map-hero section-shell" id="top" data-stage={stage}>
      <div className="map-copy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="hero-intro">{copy.intro}</p>
        {actions}
        <p className="map-closing" data-visible={arrived}>
          {copy.closing}
        </p>
      </div>

      <div className="map-stage">
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Terrain, barely there. Concentric ellipses read as a radar sweep, so these
              are off-centre, uneven, and broken where a ridge would be hidden. */}
          <g className="map-contours">
            <path d="M 120 470 C 210 350 300 500 430 430 C 560 360 610 470 760 400 C 850 358 900 300 960 316" />
            <path
              className="map-contour-broken"
              d="M 60 350 C 180 250 280 400 420 320 C 540 252 660 356 790 286 C 860 248 910 210 970 224"
            />
            <path d="M 150 570 C 260 500 330 590 470 540 C 620 486 700 560 830 500" />
            <path
              className="map-contour-broken"
              d="M 210 230 C 320 150 420 260 540 190 C 640 130 720 200 840 150"
            />
            <path d="M 340 110 C 430 60 520 130 640 80" />
          </g>

          {layout.detours.map((detour, index) => (
            <path
              className="map-detour"
              d={curve(layout.nodes[detour.from], detour.to)}
              data-state={detourState(index)}
              key={`detour-${index}`}
            />
          ))}

          {/* Two layers per stretch: the ground is lit first, then the direction is
              committed to. Drawing only the line made the route look like a chart. */}
          {layout.nodes.slice(1).map((node, index) => (
            <path
              className="map-glow"
              d={curve(layout.nodes[index], node)}
              data-drawn={stage >= script.nodeAt[index + 1] - 1}
              key={`glow-${index}`}
            />
          ))}
          <path
            className="map-glow"
            d={curve(layout.nodes[4], layout.result)}
            data-drawn={stage >= final - 1}
          />
          {layout.nodes.slice(1).map((node, index) => (
            <path
              className="map-route"
              d={curve(layout.nodes[index], node)}
              data-drawn={stage >= script.nodeAt[index + 1]}
              key={`route-${index}`}
            />
          ))}
          <path
            className="map-route"
            d={curve(layout.nodes[4], layout.result)}
            data-drawn={arrived}
          />
        </svg>

        <div className="map-fog" data-cleared={stage >= script.nodeAt[1]} />
        <div className="map-fog map-fog-far" data-cleared={arrived} />

        {copy.nodes.map((node, index) => (
          <div
            className="map-mark"
            data-lit={stage >= script.nodeAt[index]}
            key={node.label}
            style={percent(layout.nodes[index])}
          >
            <div className="map-mark-card">
              <StageMark index={index} />
              <strong>{node.label}</strong>
              <small>{node.question}</small>
            </div>
            <span className="map-mark-pin" />
          </div>
        ))}

        {layout.detours.map((detour, index) => {
          const sign = copy.detours[index];
          return (
            <div
              className="map-mark map-mark-detour"
              data-state={detourState(index)}
              key={sign.label}
              style={percent(detour.to)}
            >
              <div className="map-mark-card">
                <strong>
                  {/* The refusal belongs to the sign, not to the air above it. */}
                  <span className="map-cross" aria-hidden="true">
                    ×
                  </span>
                  {sign.label}
                </strong>
                <small>{sign.note}</small>
              </div>
              <span className="map-mark-pin" />
            </div>
          );
        })}

        <div className="map-result-card" data-arrived={arrived} style={percent(layout.result)}>
          <span className="map-result-mark" />
          <strong>{copy.result.label}</strong>
          <small>{copy.result.note}</small>
        </div>

        {/* The idea itself, carried along the route: whole at the start, cracked by
            each answer, open by the time anything is handed over. */}
        <div
          className="map-token"
          data-hatched={hatched}
          data-hesitating={hesitating}
          data-arrived={arrived}
          style={{ ...percent(token), ["--tilt" as string]: `${tiltAt(Math.min(stage, final), script.positions)}deg` }}
        >
          <svg viewBox="0 0 24 30" aria-hidden="true">
            <defs>
              <radialGradient id="token-core" cx="50%" cy="58%">
                <stop offset="0%" stopColor="#BC4637" />
                <stop offset="100%" stopColor="#7A3F9F" />
              </radialGradient>
            </defs>
            <path className="map-token-core" d={eggPath({ x: 12, y: 15 }, 9.5, 12.5)} />
            <path className="map-token-shell" d={eggPath({ x: 12, y: 15 }, 9.5, 12.5)} />
            <g className="map-token-cracks" data-cracks={cracks}>
              <path d="M 12 3 L 9.5 9 L 13 12" />
              <path d="M 3 16 L 8 18 L 6 22" />
              <path d="M 20 14 L 15 19 L 18 24" />
            </g>
          </svg>
          <span className="map-token-spark" />
        </div>

        {/* The route is short and every landmark stays lit once it appears, so this is
            for a second look rather than for catching up. */}
        {!reduceMotion && (
          <button type="button" className="map-replay" onClick={replay}>
            {copy.replay}
          </button>
        )}
        <p className="sr-only" aria-live="polite">
          {replayed ? copy.replayed : ""}
        </p>
      </div>
    </section>
  );
}
