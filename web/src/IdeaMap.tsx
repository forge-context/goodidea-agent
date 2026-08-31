import { useEffect, useState, type ReactNode } from "react";

export type MapLocale = "en" | "ja" | "zh-CN";

type Point = { x: number; y: number };

type MapCopy = {
  eyebrow: string;
  title: string[];
  description: string;
  closing: string;
  nodes: { label: string; question: string }[];
  detours: { label: string; note: string }[];
  result: { label: string; note: string };
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
  result: { x: 845, y: 118 },
  detours: [
    { from: 0, to: { x: 245, y: 160 } },
    { from: 1, to: { x: 400, y: 590 } },
    { from: 2, to: { x: 560, y: 120 } },
  ],
};

// A narrow screen gets a route that climbs instead of spreading, so eight labels
// still have room not to touch.
const COMPACT: Layout = {
  nodes: [
    { x: 230, y: 575 },
    { x: 430, y: 485 },
    { x: 250, y: 385 },
    { x: 470, y: 285 },
    { x: 250, y: 160 },
  ],
  result: { x: 640, y: 70 },
  detours: [
    // Spaced for the tallest labels, which are Japanese and English rather than Chinese.
    { from: 0, to: { x: 620, y: 585 } },
    { from: 1, to: { x: 720, y: 375 } },
    { from: 2, to: { x: 590, y: 215 } },
  ],
};

const COPY: Record<MapLocale, MapCopy> = {
  en: {
    eyebrow: "GOODIDEA / FROM IDEA TO MVP",
    title: ["An idea is not a straight line.", "The next step can still be clear."],
    description:
      "You do not have to answer everything at once. Each turn lights the one stretch that is worth walking.",
    closing: "Do not look for every answer. Find the next one that matters.",
    nodes: [
      { label: "A rough idea", question: "One sentence is enough" },
      { label: "Evidence", question: "Is the market real?" },
      { label: "Decision", question: "What do we test first?" },
      { label: "Boundary", question: "What this version will not do" },
      { label: "Handoff", question: "Coding agent" },
    ],
    detours: [
      { label: "Start writing code", note: "Looks fastest" },
      { label: "Design the screens first", note: "Looks like a product" },
      { label: "Build every feature", note: "Looks more complete" },
    ],
    result: { label: "Buildable MVP", note: "A path lit by evidence" },
  },
  ja: {
    eyebrow: "GOODIDEA / FROM IDEA TO MVP",
    title: ["アイデアは​直線ではない。", "それでも​次の一歩は​決められる。"],
    description:
      "すべてに一度で答える必要はありません。毎回、歩く価値のある一区間だけを照らします。",
    closing: "すべての答えを探さない。次に効く答えを一つ見つける。",
    nodes: [
      { label: "曖昧なアイデア", question: "一文あれば足ります" },
      { label: "根拠", question: "市場は実在するか" },
      { label: "判断", question: "まず何を検証するか" },
      { label: "境界", question: "この版でやらないこと" },
      { label: "引き渡し", question: "Coding Agent" },
    ],
    detours: [
      { label: "すぐコードを書く", note: "一番速く見える" },
      { label: "先に画面を作る", note: "製品らしく見える" },
      { label: "機能を全部入れる", note: "完成して見える" },
    ],
    result: { label: "Buildable MVP", note: "根拠に照らされた一本の道" },
  },
  "zh-CN": {
    eyebrow: "GOODIDEA / FROM IDEA TO MVP",
    title: ["想法不是直线。", "但下一步可以很清楚。"],
    description: "不需要一次回答所有问题。每次只点亮一段真正有价值的路。",
    closing: "不要一次寻找全部答案。找到下一个最重要的答案。",
    nodes: [
      { label: "模糊想法", question: "一句话就够" },
      { label: "证据", question: "市场真实吗？" },
      { label: "决定", question: "先验证什么？" },
      { label: "边界", question: "这一版不做什么？" },
      { label: "交接", question: "Coding Agent" },
    ],
    detours: [
      { label: "直接开始写代码", note: "看起来最快" },
      { label: "先做漂亮页面", note: "看起来像产品" },
      { label: "把功能全部做上", note: "看起来更完整" },
    ],
    result: { label: "Buildable MVP", note: "一条被证据照亮的路径" },
  },
};

// Eighteen beats over about six and a half seconds. Every beat only ever adds
// something: nothing already lit goes dark again, so an interrupted frame still reads.
//
// Refusing a detour is three separate moments rather than one: the idea holds still,
// the sign is crossed out, and only then does the wrong road fade and the right one
// light up. Collapsing them made the decision invisible.
const BEATS = [
  0, 620, 1040, 1340, 1560, 1830, 2340, 2760, 3060, 3280, 3550, 4060, 4480, 4780, 5000,
  5270, 5820, 6480,
];
const FINAL = BEATS.length - 1;

const NODE_STAGE = [0, 5, 10, 15, 16];
const DETOUR_TEMPT = [1, 6, 11];
const DETOUR_HOLD = [2, 7, 12];
const DETOUR_CROSS = [3, 8, 13];
const DETOUR_DIM = [4, 9, 14];

/** Where the idea sits at each beat, including the three times it wanders off. */
function tokenAt(stage: number, layout: Layout): Point {
  const { nodes, detours, result } = layout;
  const toward = (from: Point, to: Point, amount: number): Point => ({
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount,
  });
  if (stage >= 17) return result;
  if (stage >= 16) return nodes[4];
  if (stage >= 15) return nodes[3];
  if (stage >= 14) return nodes[2];
  if (stage >= 11) return toward(nodes[2], detours[2].to, 0.4);
  if (stage >= 10) return nodes[2];
  if (stage >= 9) return nodes[1];
  if (stage >= 6) return toward(nodes[1], detours[1].to, 0.42);
  if (stage >= 5) return nodes[1];
  if (stage >= 4) return nodes[0];
  if (stage >= 1) return toward(nodes[0], detours[0].to, 0.46);
  return nodes[0];
}

/** A tilt in the direction of travel. Full rotation would read as tumbling. */
function tiltAt(stage: number, layout: Layout): number {
  if (stage === 0) return 0;
  const from = tokenAt(stage - 1, layout);
  const to = tokenAt(stage, layout);
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
    // Evidence: something checked off a source.
    <g key="evidence">
      <rect x="1.6" y="1.6" width="10.8" height="10.8" rx="2.4" />
      <path d="M 4.4 7.2 L 6.4 9.2 L 9.8 5" />
    </g>,
    // Decision: one road becomes two, and one is taken.
    <g key="decision">
      <path d="M 7 12.6 L 7 7.4" />
      <path d="M 7 7.4 L 3 2.6" />
      <path d="M 7 7.4 L 11 2.6" />
    </g>,
    // Boundary: a line this version does not cross.
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
  const layout = compact ? COMPACT : WIDE;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage(FINAL);
      return;
    }
    const timers = BEATS.slice(1).map((at, index) =>
      window.setTimeout(() => setStage(index + 1), at),
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  const token = tokenAt(stage, layout);
  const percent = (point: Point) => ({
    left: `${(point.x / VIEW.width) * 100}%`,
    top: `${(point.y / VIEW.height) * 100}%`,
  });
  const cracks = stage >= 15 ? 3 : stage >= 10 ? 2 : stage >= 5 ? 1 : 0;
  const hatched = stage >= 16;
  const arrived = stage >= FINAL;
  // The held beat before each refusal: the idea leans into the wrong road and stops.
  const hesitating = DETOUR_HOLD.includes(stage) || DETOUR_CROSS.includes(stage);

  const detourState = (index: number) =>
    stage >= DETOUR_DIM[index]
      ? "refused"
      : stage >= DETOUR_CROSS[index]
        ? "crossed"
        : stage >= DETOUR_TEMPT[index]
          ? "tempting"
          : "hidden";

  return (
    <section className="map-hero section-shell" id="top" data-stage={stage}>
      <div className="map-copy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>
          {copy.title.map((row, index) => (
            <span className={index ? "hero-line hero-accent" : "hero-line"} key={row}>
              {row}
            </span>
          ))}
        </h1>
        <p className="hero-intro">{copy.description}</p>
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
              data-drawn={stage >= NODE_STAGE[index + 1] - 1}
              key={`glow-${index}`}
            />
          ))}
          <path
            className="map-glow"
            d={curve(layout.nodes[4], layout.result)}
            data-drawn={stage >= FINAL - 1}
          />
          {layout.nodes.slice(1).map((node, index) => (
            <path
              className="map-route"
              d={curve(layout.nodes[index], node)}
              data-drawn={stage >= NODE_STAGE[index + 1]}
              key={`route-${index}`}
            />
          ))}
          <path
            className="map-route"
            d={curve(layout.nodes[4], layout.result)}
            data-drawn={arrived}
          />
        </svg>

        <div className="map-fog" data-cleared={stage >= 7} />
        <div className="map-fog map-fog-far" data-cleared={arrived} />

        {copy.nodes.map((node, index) => (
          <div
            className="map-mark"
            data-lit={stage >= NODE_STAGE[index]}
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

        {copy.detours.map((detour, index) => (
          <div
            className="map-mark map-mark-detour"
            data-state={detourState(index)}
            key={detour.label}
            style={percent(layout.detours[index].to)}
          >
            <div className="map-mark-card">
              <strong>
                {/* The refusal belongs to the sign, not to the air above it. */}
                <span className="map-cross" aria-hidden="true">
                  ×
                </span>
                {detour.label}
              </strong>
              <small>{detour.note}</small>
            </div>
            <span className="map-mark-pin" />
          </div>
        ))}

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
          style={{ ...percent(token), ["--tilt" as string]: `${tiltAt(stage, layout)}deg` }}
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
      </div>
    </section>
  );
}
