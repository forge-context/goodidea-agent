/* The whole picture for one sampled frame.
 *
 * Reading order of the project space, left to right: the creator, the team's sheets,
 * GoodIdea's fusion panel, the product draft, and — narrow enough to stay support and
 * not the subject — the agent rail. Nothing here decides anything: every value comes
 * from the scene the timeline produced.
 *
 * Two things are resolved here rather than in the timeline, and for the same reason:
 * the pointer's destination and every mark drawn on a line of text. Both belong to
 * boxes the browser lays out — a button whose width is its label, a sentence whose
 * length is its language — so both are measured on the sheet they sit on and then
 * carried through that sheet's own transform. That is the single coordinate chain
 * the spec asks for: the button, the arrow's point, the ripple under it and the ink
 * over a sentence cannot disagree, because none of them is written down twice.
 */

import {
  useLayoutEffect, useMemo, useRef, useState, type RefCallback,
} from "react";

import {
  CURSOR_APPROACH, INK, LAYOUT, MOBILE_STAGE, ROLES, STAGE,
  arrowStrokes, circleStroke, geo, lerp, strikeStroke, underlineStroke,
  type AskState, type Point, type Pose, type Role, type Scene, type TextBox,
} from "./paperTimeline";
import type { PaperCopyShape } from "./paperCopy";
import { ASSETS, Designer, Desk, GoodIdeaMark, Ink, Paper, ScopeSketch } from "./stageParts";

const P = LAYOUT.product;
const W = LAYOUT.work;
const Q = LAYOUT.quote;
const SHEET = { research: `${ASSETS}/research-paper.webp`, experience: `${ASSETS}/product-paper.webp`, engineering: `${ASSETS}/research-paper.webp` };
const row = (top: number, opacity: number) => ({ top, opacity });
const askClass = (s: AskState) => (s.live ? " is-live" : s.done ? " is-done" : "");

/** Whose earlier work a contribution answers. Fixed by the script, which is what makes
 *  the two references in the film real rather than decorative. */
const NOTE_REF: Partial<Record<Role, Role>> = { experience: "research", engineering: "experience" };

/* ------------------------------------------------------------------ geometry */

/** Everything whose box has to be known rather than guessed. */
const MARKS = [
  "adopt", "client", "proposal", "original0", "original1",
  "researchLine", "engLine", "uxOption",
] as const;
type Mark = (typeof MARKS)[number];
type Boxes = Partial<Record<Mark, TextBox>>;
/** The marks that answer a particular sentence, each built from the box that sentence
 *  actually occupies — so a longer translation moves the words and the ink together. */
type Marks = { strike: string[]; underline: string[]; engineering: string[]; scopeCircle: string[] };

/** Where the arrow's point actually is inside the 26px cursor sprite: the path's
 *  first vertex, (4, 2) of a 24-unit viewBox. Everything about the pointer — where it
 *  is placed, what it scales around, where the ripple is centred — is this one point,
 *  because a click that lands anywhere else is a click the viewer can see miss. */
const TIP = { x: (4 / 24) * 26, y: (2 / 24) * 26 };

/** A box in the coordinates of the sheet it is printed on: offsets only, so the
 *  sheet's own rotation, scale and place on the desk never enter the number. */
function localBox(el: HTMLElement | null): TextBox | null {
  if (!el || (!el.offsetWidth && !el.offsetHeight)) return null;
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && !node.classList.contains("gip-paper")) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  if (!node) return null;
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

const moved = (a: TextBox | undefined, b: TextBox | undefined) => {
  if (!a || !b) return a !== b;
  return Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5
    || Math.abs(a.w - b.w) > 0.5 || Math.abs(a.h - b.h) > 0.5;
};

/**
 * Read back what the browser laid out, once per frame, before it is painted.
 *
 * A layout effect rather than an observer: a visitor can drag the slider straight to
 * the second the pointer presses, and that frame is the first time the button has
 * existed. Measuring after paint would draw one misaligned frame and then jump.
 */
function useBoxes() {
  const nodes = useRef({} as Partial<Record<Mark, HTMLElement | null>>);
  const fusionRef = useRef<HTMLDivElement | null>(null);
  const [boxes, setBoxes] = useState<Boxes>({});
  const [fusionH, setFusionH] = useState(0);

  useLayoutEffect(() => {
    const next: Boxes = {};
    let changed = false;
    for (const mark of MARKS) {
      const box = localBox(nodes.current[mark] ?? null);
      if (box) next[mark] = box;
      if (moved(box ?? undefined, boxes[mark])) changed = true;
    }
    if (changed) setBoxes(next);
    const h = fusionRef.current?.offsetHeight ?? 0;
    if (Math.abs(h - fusionH) > 0.5) setFusionH(h);
  });

  const ref = useMemo(() => {
    const cache = {} as Record<Mark, RefCallback<HTMLElement>>;
    for (const mark of MARKS) cache[mark] = (el) => { nodes.current[mark] = el; };
    return (mark: Mark) => cache[mark];
  }, []);

  return { ref, boxes, fusionRef, fusionH };
}

/** How tall the draft's own sheet is in the composition being drawn. */
const sheetH = (compact: boolean) => (compact ? P.hCompact : P.h);

/** A point on a sheet, in the coordinates of the desk the sheet is lying on. */
function toStage(pose: Pose, local: Point, w: number = P.w, h: number = P.h): Point {
  const dx = (local.x - w / 2) * pose.scale;
  const dy = (local.y - h / 2) * pose.scale;
  const a = (pose.rot * Math.PI) / 180;
  return {
    x: pose.x + dx * Math.cos(a) - dy * Math.sin(a),
    y: pose.y + dx * Math.sin(a) + dy * Math.cos(a),
  };
}

/* Only ever used for the frame before the first layout effect has run, and in test
 * environments that report no layout at all. Kept close to where the sheet puts these
 * controls so that even the fallback lands on the button rather than beside it. */
const FALLBACK: Record<"wide" | "compact", Record<"adopt" | "client" | "proposal", TextBox>> = {
  wide: {
    adopt: { x: P.pad.left + 20, y: P.rows.proposalCard + 196, w: 150, h: 44 },
    client: { x: P.pad.left + 14, y: P.rows.preview + 214, w: 108, h: 34 },
    proposal: { x: P.pad.left, y: P.rows.proposalCard, w: P.w - P.pad.left - P.pad.right, h: 258 },
  },
  compact: {
    adopt: { x: P.pad.left + 20, y: P.rows.proposalCard + 214, w: 172, h: 50 },
    client: { x: P.pad.left + 14, y: P.rows.previewCompact + 300, w: 124, h: 44 },
    proposal: { x: P.pad.left, y: P.rows.proposalCard, w: P.w - P.pad.left - P.pad.right, h: 282 },
  },
};

/* ------------------------------------------------------------------- opening */

type Props = { scene: Scene; copy: PaperCopyShape };

function QuotePaper({ scene, copy }: Props) {
  const c = copy.opening;
  const o = scene.opening;
  if (scene.quote.opacity <= 0.001) return null;
  return (
    <div className="gip-layer">
      <Paper pose={scene.quote} w={Q.w} h={Q.h} src={SHEET.research}>
        <div className="gip-sheet" style={{ left: Q.pad.left, right: Q.pad.right }}>
          <div className="gip-line" style={row(Q.rows.chip, o.quoteChip)}>
            <span className="gip-chip gip-chip-quote">{c.quoteChip}</span>
          </div>
          <div className="gip-line gip-quote-title" style={row(Q.rows.title, o.quoteTitle)}>{c.quoteTitle}</div>
          <div className="gip-line gip-quote-price" style={row(Q.rows.price, o.quotePrice)}>{c.quotePrice}</div>
        </div>
        <svg className="gip-paper-ink" viewBox={`0 0 ${Q.w} ${Q.h}`} aria-hidden="true">
          <Ink strokes={INK.quoteRule} progress={o.quoteRule} className="gip-ink gip-ink-quote" width={2.2} />
        </svg>
      </Paper>
    </div>
  );
}

/** The opening's stage-level text: who this is, the client's questions, the thought. */
function Opening({ scene, copy }: Props) {
  const c = copy.opening;
  const o = scene.opening;
  const g = geo(scene.compact);
  if (o.corner + o.thought + o.notes[0].opacity <= 0.001) return null;
  return (
    <div className="gip-opening">
      <div className="gip-corner" style={{ left: g.corner.x, top: g.corner.y, opacity: o.corner }}>
        <div className="gip-corner-title">{c.corner}</div>
        <div className="gip-corner-note">{c.cornerNote}</div>
      </div>
      {c.questions.map((text, i) => (
        <div
          key={text}
          className={`gip-note${askClass(o.notes[i])}`}
          style={{
            left: g.notes[i].x, top: g.notes[i].y, opacity: o.notes[i].opacity,
            transform: `rotate(${g.notes[i].rot ?? 0}deg)`,
          }}
        >
          {text}
        </div>
      ))}
      <div className="gip-thought" style={{ left: g.thought.x, top: g.thought.y, opacity: o.thought }}>
        {c.thought}
      </div>
    </div>
  );
}

/** The project space itself: whose project, what stage it is at, what is waiting. */
function Workspace({ scene, copy }: Props) {
  const w = scene.workspace;
  if (w.opacity <= 0) return null;
  return (
    <div className="gip-workspace" style={{ opacity: w.opacity }}>
      <div className="gip-ws-bar">
        <div className="gip-ws-brand"><GoodIdeaMark className="gip-ws-symbol" /><strong>GoodIdea</strong></div>
        <div className="gip-ws-project"><span>{copy.workspace.breadcrumb}</span><span className="gip-ws-slash">/</span>{copy.workspace.project}</div>
        <span className={`gip-ws-status${w.status === 2 ? " is-pending" : ""}`}><i />{copy.workspace.statuses[w.status]}</span>
      </div>
      {scene.compact ? <TeamStrip scene={scene} copy={copy} /> : <AgentRail scene={scene} copy={copy} />}
      <div className="gip-ws-foot">
        <div className="gip-ws-stages">
          {copy.workspace.stages.map((label, i) => (
            <span key={label} className={i === w.phase ? "is-current" : i < w.phase ? "is-past" : ""}>
              <b>{i < w.phase ? "✓" : `0${i + 1}`}</b>{label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The AI team, as a narrow column of support beside the work.
 *
 * Each agent shows a name, a discipline and one line that is worth reading: what it
 * is doing now, or — once it has handed something in — what that contribution was.
 * Never both, and never a line that only says something happened: a column that
 * repeats "handed in for this round" three times is a log, not support.
 */
function AgentRail({ scene, copy }: Props) {
  const rail = scene.rail;
  if (rail.opacity <= 0.001) return null;
  return (
    <div className="gip-rail" style={{ opacity: rail.opacity }}>
      <p className="gip-rail-title">{copy.rail.title}</p>
      <ul className="gip-rail-list">
        {rail.agents.map((agent) => {
          const c = copy.agents[agent.role];
          const ref = NOTE_REF[agent.role];
          const handed = agent.note >= 0;
          return (
            <li key={agent.role} className={`gip-agent is-phase-${agent.phase}${agent.live ? " is-live" : ""}`} data-role={agent.role}>
              <span className="gip-agent-mark" aria-hidden="true">{c.initial}</span>
              <div className="gip-agent-body">
                <p className="gip-agent-id"><b>{c.role}</b><span>{c.name}</span></p>
                {handed ? (
                  <p className="gip-agent-note">
                    {ref && <span className="gip-agent-ref" data-role={ref} aria-hidden="true">↳{copy.agents[ref].initial}</span>}
                    {c.notes[agent.note]}
                  </p>
                ) : (
                  <p className="gip-agent-work">{agent.work < 0 ? copy.rail.waiting : c.work[agent.work]}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="gip-rail-foot">
        <span className="gip-rail-brand">GoodIdea</span>
        <p>{copy.rail.summary[rail.summary]}</p>
      </div>
    </div>
  );
}

/** The same information on a phone, as one line per agent under the top bar. */
function TeamStrip({ scene, copy }: Props) {
  const rail = scene.rail;
  if (rail.opacity <= 0.001) return null;
  return (
    <div className="gip-strip" style={{ opacity: rail.opacity }}>
      <ul>
        {rail.agents.map((agent) => {
          const c = copy.agents[agent.role];
          return (
            <li key={agent.role} className={`gip-strip-agent is-phase-${agent.phase}${agent.live ? " is-live" : ""}`} data-role={agent.role}>
              <span className="gip-agent-mark" aria-hidden="true">{c.initial}</span>
              <b>{c.tagRole}</b>
              <span className="gip-strip-status">{agent.note >= 0 ? c.notes[agent.note] : agent.work < 0 ? copy.rail.waiting : c.work[agent.work]}</span>
            </li>
          );
        })}
      </ul>
      <p className="gip-strip-summary">{copy.rail.summary[rail.summary]}</p>
    </div>
  );
}

/**
 * GoodIdea's own turn, made visible.
 *
 * The three signed contributions arrive, what they agree on and what they disagree
 * about are both stated, and only then does one decision come out of it. The
 * trade-off is stated once and briefly: engineering's own reasoning has already been
 * read on its sheet a few seconds earlier, and repeating it here in full turned the
 * card into the longest thing on the desk.
 */
function FusionPanel({ scene, copy, panelRef }: Props & { panelRef: React.RefObject<HTMLDivElement | null> }) {
  const f = scene.fusion;
  if (f.opacity <= 0.001) return null;
  const g = geo(scene.compact).fusion;
  const c = copy.fusion;
  return (
    <div className="gip-fusion" ref={panelRef} style={{ left: g.x, top: g.y, width: g.w, minHeight: g.h, opacity: f.opacity }}>
      <p className="gip-fusion-kicker"><GoodIdeaMark className="gip-fusion-badge" />{c.kicker}</p>
      <ul className="gip-fusion-chips">
        {c.chips.map((chip, i) => (
          <li key={chip} data-role={ROLES[i]} style={{ opacity: f.chips[i] }}>
            <span className="gip-agent-mark" aria-hidden="true">{copy.agents[ROLES[i]].initial}</span>{chip}
          </li>
        ))}
      </ul>
      <div className="gip-fusion-read" style={{ opacity: f.shared }}>
        <b>{c.sharedLabel}</b><p>{c.shared}</p>
      </div>
      <div className="gip-fusion-read is-open" style={{ opacity: f.trade }}>
        <b>{c.tradeLabel}</b><p>{c.trade}</p>
      </div>
      <div className="gip-fusion-result" style={{ opacity: f.result }}>
        <b>{c.resultLabel}</b><p>{c.result}</p>
      </div>
    </div>
  );
}

/** The client-facing side of the same draft, opened out. */
function OutlookCard({ scene, copy, mark }: Props & { mark: (m: Mark) => RefCallback<HTMLElement> }) {
  const c = copy.outlook;
  const ol = scene.outlook;
  return (
    <>
      {/* The three opening questions come back to the page, each lighting up with the
          preview row that answers it. */}
      <div className="gip-line gip-asks" style={row(scene.compact ? P.rows.asksCompact : P.rows.asks, 1)}>
        {copy.opening.questions.map((q, i) => (
          <div key={q} className={`gip-ask${askClass(ol.asks[i])}`} style={{ opacity: ol.asks[i].opacity }}>{q}</div>
        ))}
      </div>
      <div className="gip-line gip-preview" style={row(scene.compact ? P.rows.previewCompact : P.rows.preview, 1)}>
        <div className="gip-preview-head"><span className="gip-chip gip-chip-outlook">{c.chip}</span></div>
        {c.rows.map(([k, v], i) => (
          <div key={k} className={`gip-preview-row${askClass(ol.asks[i])}`} style={{ opacity: ol.rows[i] }}>
            <span className="gip-preview-k">{k}</span><span className="gip-preview-v">{v}</span>
          </div>
        ))}
        <div className="gip-preview-rule" style={{ opacity: ol.total }} />
        <div className="gip-preview-row is-total" style={{ opacity: ol.total }}>
          <span className="gip-preview-k">{c.totalKey}</span><span className="gip-preview-v">{c.totalValue}</span>
        </div>
        <div className="gip-preview-foot" style={{ opacity: ol.button === "hidden" ? 0 : 1 }}>
          <span className={`gip-btn is-client is-${ol.button}`} ref={mark("client")}>{ol.button === "done" ? c.buttonDone : c.button}</span>
          <span className="gip-preview-confirm" style={{ opacity: ol.confirm }}>{c.confirm}</span>
        </div>
      </div>
    </>
  );
}

/**
 * The product draft, and the one decision waiting on it.
 *
 * The decision is a card, and the card is complete: what is being asked, the proposal,
 * what it says, what it gives up this round, who it came from, and the control that
 * adopts it — in that order, in ordinary flow, so the button belongs to the thing it
 * answers instead of hanging off the bottom edge of the sheet.
 */
function ProductPaper({ scene, copy, mark, strike }: Props & { mark: (m: Mark) => RefCallback<HTMLElement>; strike: string[] }) {
  const c = copy.product;
  const tx = scene.productText;
  const done = scene.button === "done";
  const ol = scene.outlook;
  const canvas = scene.workspace.opacity > 0.5;
  const original = [c.original[0], c.original[1]];
  return (
    <Paper
      pose={scene.product} w={P.w} h={sheetH(scene.compact)} src={`${ASSETS}/product-paper.webp`}
      className={canvas ? "gip-canvas" : ""} surface={scene.workspace.opacity}
    >
      <div className="gip-sheet" style={{ left: P.pad.left, right: P.pad.right }}>
        <div className="gip-line" style={row(P.rows.stageLabel, tx.stageLabel)}>
          <span className="gip-chip gip-chip-stage">{canvas ? c.canvasLabel : c.stageLabel}</span>
          {canvas && (
            <span className="gip-version">
              {scene.workspace.version}
              <span>{scene.workspace.status >= 4 ? c.versionNote[1] : c.versionNote[0]}</span>
            </span>
          )}
        </div>
        <div className="gip-line gip-product-title" style={row(P.rows.title, tx.title)}>{c.title}</div>
        {canvas && (
          <div className="gip-line gip-current-label" style={row(P.rows.currentLabel, tx.stageLabel * (1 - tx.lift))}>
            {c.currentLabel}
          </div>
        )}
        {/* The sentence written down at the start stays on this sheet; striking it out
            is the trace of a decision the creator actually made. */}
        {/* One block in ordinary flow, like the confirmed direction below it: the first
            sentence is one line in Chinese and two on a phone in English, and a second
            row pinned under it lands in the middle of that. */}
        <div className="gip-line gip-original" style={row(P.rows.original, tx.original)}>
          {original.map((line, i) => (
            <div key={line} style={{ opacity: tx.originalLines[i] }}>
              <span ref={mark(i ? "original1" : "original0")}>{line}</span>
            </div>
          ))}
        </div>
        {/* One block in ordinary flow rather than two rows at fixed heights: the first
            sentence is one line in Chinese and two in English, and a second row pinned
            below it lands in the middle of that. */}
        <div className="gip-line gip-revised" style={row(lerp(P.rows.revised, P.rows.liftTo, tx.lift), 1)}>
          <div style={{ opacity: tx.revised1 }}>{c.revised[0]}</div>
          <div style={{ opacity: tx.revised2 }}>{c.revised[1]}</div>
        </div>
        {/* The proposal keeps its own dashed edge and is put away once answered: it
            never turns into product content on its own. */}
        <div className="gip-line gip-proposal" ref={mark("proposal")} style={row(P.rows.proposalCard, tx.proposal * scene.proposalOpacity)}>
          <div className="gip-proposal-kicker">{done ? c.proposalKickerDone : c.proposalKicker}</div>
          <div className="gip-proposal-text">{c.proposal}</div>
          <div className="gip-proposal-detail" style={{ opacity: tx.proposalDetail }}>{c.proposalDetail}</div>
          <div className="gip-proposal-deferred" style={{ opacity: tx.deferred }}>{c.deferred}</div>
          <div className="gip-proposal-evidence" style={{ opacity: tx.deferred }}>{copy.workspace.evidence}</div>
          <div className="gip-proposal-actions" style={{ opacity: scene.button === "hidden" ? 0 : 1 }}>
            <span className={`gip-btn is-${scene.button}`} ref={mark("adopt")}>{done ? c.buttonDone : c.button}</span>
          </div>
        </div>
        {done && scene.sketchOpacity > 0.001 && (
          <div className="gip-line gip-accepted" style={row(P.rows.sketch, scene.sketchOpacity)}>
            <ScopeSketch progress={scene.acceptedSketch} copy={copy.sketch} accepted />
          </div>
        )}
        <div className="gip-line gip-revised-mark" style={row(P.rows.revisedMark, tx.revisedMark * scene.sketchOpacity)}>{c.revisedMark}</div>
        {ol.card > 0.001 && <div className="gip-outlook" style={{ opacity: ol.card }}><OutlookCard scene={scene} copy={copy} mark={mark} /></div>}
      </div>
      <ProductInk scene={scene} strokes={strike} />
    </Paper>
  );
}

/** The line through the first description, drawn across the words that are actually
 *  there — both of them, in whichever language the sheet is set in. */
function ProductInk({ scene, strokes }: { scene: Scene; strokes: string[] }) {
  if (scene.ink.strike <= 0 || !strokes.length) return null;
  return (
    <svg className="gip-paper-ink" viewBox={`0 0 ${P.w} ${sheetH(scene.compact)}`} style={{ opacity: scene.productText.original }} aria-hidden="true">
      <Ink strokes={strokes} progress={scene.ink.strike} className="gip-ink gip-ink-strike" />
    </svg>
  );
}

function WorkPaper({ scene, copy, role, mark, marks }: Props & { role: Role; mark: (m: Mark) => RefCallback<HTMLElement>; marks: Marks }) {
  const agent = copy.agents[role];
  const tx = scene.workText[role];
  const pose = scene.work[role];
  if (pose.opacity <= 0.001) return null;
  const compact = scene.compact;
  return (
    <div className={`gip-layer gip-work-${role}`}>
      <Paper pose={pose} w={W.w} h={W.h} src={SHEET[role]}>
        {role === "engineering" && <div className="gip-grid" aria-hidden="true" />}
        <div className="gip-sheet" style={{ left: W.pad.left, right: W.pad.right }}>
          <div className="gip-line gip-work-title" style={row(W.rows.title, tx.title)}>{agent.title}</div>
          {/* Whose sheet this is, printed on the sheet at reading size. */}
          <div className="gip-line gip-byline" style={row(W.rows.byline, tx.byline)} data-role={role}>
            <span className="gip-agent-mark" aria-hidden="true">{agent.initial}</span>
            <b>{agent.role}</b><span>{agent.name}</span>
          </div>
          <div className="gip-line gip-work-tag" style={row(W.rows.tag, tx.tag)}>{agent.tag}</div>

          {role === "research" && copy.work.researchLines.map((line, i) => (
            <div key={line} className="gip-line gip-work-note" style={row(W.rows.researchLine + i * W.rows.researchGap, tx.lines[i])}>
              {i === 1 ? <span ref={mark("researchLine")}>{line}</span> : line}
            </div>
          ))}

          {role === "experience" && (
            <>
              {/* Luca opens by quoting Mira, so the reference is readable on the sheet
                  that is in the middle of the desk when it is made. */}
              <div className="gip-line gip-quote-ref" style={row(W.rows.uxQuestion, tx.lines[0])} data-role="research">
                <span className="gip-agent-mark" aria-hidden="true">{copy.agents.research.initial}</span>
                {copy.work.uxQuestion}
              </div>
              <div className="gip-line gip-ux-sketch" style={{ top: W.rows.uxSketch }}>
                <ScopeSketch progress={scene.uxSketch} copy={copy.sketch} />
              </div>
              <div className="gip-line gip-ux-option" style={row(compact ? W.rows.uxOptionCompact : W.rows.uxOption, tx.footnote)}>
                <span ref={mark("uxOption")}>{copy.work.uxOption}</span>
              </div>
            </>
          )}

          {role === "engineering" && (
            <>
              {copy.work.engineeringLines.map((line, i) => (
                <div
                  key={line}
                  className={`gip-line gip-work-note${i >= 2 ? " is-suggestion" : ""}`}
                  style={row(i >= 2 ? W.rows.engSuggest + (i - 2) * W.rows.engGap : W.rows.engLine + i * W.rows.engGap, tx.lines[i])}
                >
                  {i === 3 ? <span ref={mark("engLine")}>{line}</span> : line}
                </div>
              ))}
              {/* Kai answers Luca's open question by name before proposing anything. */}
              <div className="gip-line gip-quote-ref" style={row(W.rows.engQuote, tx.quote)} data-role="experience">
                <span className="gip-agent-mark" aria-hidden="true">{copy.agents.experience.initial}</span>
                {copy.work.engineeringQuote}
              </div>
              <div className="gip-line gip-eng-footnote" style={row(W.rows.engFootnote, tx.footnote)}>{copy.work.engineeringFootnote}</div>
            </>
          )}
        </div>
        <svg className="gip-paper-ink" viewBox={`0 0 ${W.w} ${W.h}`} aria-hidden="true">
          {role === "research" && <Ink strokes={marks.underline} progress={scene.ink.underline} className="gip-ink gip-ink-underline" />}
          {role === "engineering" && <Ink strokes={marks.engineering} progress={scene.ink.engineering} className="gip-ink gip-ink-engineering" />}
          {/* Engineering's circle stays on UX's sheet, so it is still there when every
              sheet has been parked side by side. */}
          {role === "experience" && <Ink strokes={marks.scopeCircle} progress={scene.ink.scopeCircle} className="gip-ink gip-ink-circle" width={2.4} />}
        </svg>
      </Paper>
    </div>
  );
}

/** The identity that survives the sheet shrinking to the edge of the desk. */
function ParkedTags({ scene, copy }: Props) {
  return (
    <>
      {ROLES.map((role) => {
        const tag = scene.tags[role];
        if (tag.opacity <= 0.001) return null;
        const agent = copy.agents[role];
        return (
          <div key={role} className="gip-tag" data-role={role} style={{ left: tag.x, top: tag.y, opacity: tag.opacity }}>
            <span className="gip-agent-mark" aria-hidden="true">{agent.initial}</span>
            <b>{agent.tagRole}</b><span>{agent.name}</span>
          </div>
        );
      })}
    </>
  );
}

/** The pointer, placed by its point rather than by its box. */
function Cursor({ at, pressed }: { at: Point | null; pressed: boolean }) {
  if (!at) return null;
  return (
    <div
      className={`gip-cursor${pressed ? " is-pressed" : ""}`}
      style={{ transform: `translate(${at.x - TIP.x}px, ${at.y - TIP.y}px)` }}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path d="M4 2 L4 19 L8.6 14.8 L11.6 21.4 L14.6 20 L11.6 13.6 L17.6 13.4 Z" fill="#2b2724" stroke="#fbf7ef" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <span className="gip-cursor-ping" />
    </div>
  );
}

/** The creator's own view, kept next to them. Short decisions, not a message feed. */
function CreatorThought({ scene, copy }: Props) {
  const { thought, thoughtOpacity } = scene.designer;
  if (thoughtOpacity <= 0 || thought < 0) return null;
  return (
    <div className="gip-creator" style={{ opacity: thoughtOpacity }}>
      <span className="gip-creator-label">{copy.creator.label}</span>
      <p>{copy.creator.thoughts[thought]}</p>
    </div>
  );
}

export function PaperStage({ scene, copy }: Props) {
  const stage = scene.compact ? MOBILE_STAGE : STAGE;
  const g = geo(scene.compact);
  const [cap1, cap2] = scene.outlook.caption;
  const [b0, b1, b2] = scene.outlook.brand;
  const { ref: mark, boxes, fusionRef, fusionH } = useBoxes();
  const fallback = FALLBACK[scene.compact ? "compact" : "wide"];

  const marks: Marks = useMemo(() => ({
    strike: [boxes.original0, boxes.original1].filter((b): b is TextBox => !!b).flatMap(strikeStroke),
    underline: boxes.researchLine ? underlineStroke(boxes.researchLine) : [],
    engineering: boxes.engLine ? underlineStroke(boxes.engLine) : [],
    scopeCircle: boxes.uxOption ? circleStroke(boxes.uxOption) : [],
  }), [boxes.original0, boxes.original1, boxes.researchLine, boxes.engLine, boxes.uxOption]);

  /* One resolution, used by the pointer, the ripple and the arrow alike. */
  const box = (which: "adopt" | "client" | "proposal") => boxes[which] ?? fallback[which];
  const centre = (b: TextBox) => toStage(scene.product, { x: b.x + b.w / 2, y: b.y + b.h / 2 }, P.w, sheetH(scene.compact));

  let cursorAt: Point | null = null;
  if (scene.cursor.visible && scene.cursor.target) {
    const to = centre(box(scene.cursor.target));
    const away = CURSOR_APPROACH[scene.compact ? "compact" : "wide"][scene.cursor.target];
    cursorAt = {
      x: lerp(to.x + away.x, to.x, scene.cursor.p),
      y: lerp(to.y + away.y, to.y, scene.cursor.p),
    };
  }

  /* From the edge of what GoodIdea concluded to the edge of the card it became. Both
     ends are read off the boxes on screen, so the arrow cannot cross the draft's own
     words or land on the button underneath the card. */
  const fusionArrow = useMemo(() => {
    const card = box("proposal");
    const h = fusionH || g.fusion.h;
    if (scene.compact) {
      return arrowStrokes(
        { x: g.fusion.x + g.fusion.w * 0.4, y: g.fusion.y + h + 12 },
        toStage(scene.product, { x: card.x + card.w * 0.34, y: card.y - 14 }, P.w, P.hCompact),
        0.1,
      );
    }
    return arrowStrokes(
      { x: g.fusion.x + g.fusion.w + 12, y: g.fusion.y + h * 0.74 },
      toStage(scene.product, { x: card.x - 16, y: card.y + Math.min(card.h * 0.34, 74) }),
      -0.16,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.compact, scene.product, boxes.proposal, fusionH, g.fusion.x, g.fusion.y, g.fusion.w, g.fusion.h]);

  return (
    <div
      className={`gip-stage${scene.compact ? " is-compact" : ""}`}
      style={{ width: stage.w, height: stage.h }}
      role="img"
      aria-label={copy.ui.stageAlt}
    >
      <img className="gip-bg" src={`${ASSETS}/background.webp`} alt="" draggable={false} />
      <Desk />
      <div className="gip-scene" style={{ opacity: scene.fade }} aria-hidden="true">
        <Workspace scene={scene} copy={copy} />
        <Designer scene={scene} />
        <CreatorThought scene={scene} copy={copy} />
        <Opening scene={scene} copy={copy} />
        <QuotePaper scene={scene} copy={copy} />
        <WorkPaper scene={scene} copy={copy} role="research" mark={mark} marks={marks} />
        <WorkPaper scene={scene} copy={copy} role="experience" mark={mark} marks={marks} />
        <WorkPaper scene={scene} copy={copy} role="engineering" mark={mark} marks={marks} />
        <ParkedTags scene={scene} copy={copy} />
        <FusionPanel scene={scene} copy={copy} panelRef={fusionRef} />
        <ProductPaper scene={scene} copy={copy} mark={mark} strike={marks.strike} />
        {scene.ink.arrowOpacity > 0.001 && (
          <svg className="gip-stage-ink" viewBox={`0 0 ${stage.w} ${stage.h}`} style={{ opacity: scene.ink.arrowOpacity }} aria-hidden="true">
            {!scene.compact && INK.links.map((strokes, i) => (
              <Ink key={i} strokes={strokes} progress={scene.ink.links[i]} weights={[5, 1]} className="gip-ink gip-ink-arrow" width={2.4} />
            ))}
            <Ink
              strokes={fusionArrow}
              progress={scene.ink.fusionArrow} weights={[5, 1]}
              className="gip-ink gip-ink-arrow is-strong" width={2.8}
            />
          </svg>
        )}
        {cap1 > 0.001 && (
          <div className="gip-caption" style={{ left: g.caption.x, top: g.caption.y }}>
            <div style={{ opacity: cap1 }}>{copy.outlook.caption[0]}</div>
            <div style={{ opacity: cap2 }}>{copy.outlook.caption[1]}</div>
          </div>
        )}
        {b0 > 0.001 && (
          <div className="gip-brand" style={{ left: g.brand.x, top: g.brand.y }}>
            <div className="gip-brand-mark" style={{ opacity: b0 }}>
              <GoodIdeaMark className="gip-brand-symbol" />
              <span>{copy.brand.mark}</span>
            </div>
            <div className="gip-brand-line" style={{ opacity: b1 }}>{copy.brand.lines[0]}</div>
            <div className="gip-brand-line" style={{ opacity: b2 }}>{copy.brand.lines[1]}</div>
          </div>
        )}
        <Cursor at={cursorAt} pressed={scene.cursor.pressed} />
      </div>
    </div>
  );
}
