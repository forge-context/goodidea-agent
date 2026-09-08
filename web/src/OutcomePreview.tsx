/* What the hero shows beside the headline: how GoodIdea works, and what comes out.
 *
 * Not a case. The one case this site tells — a freelance designer's quote — belongs to
 * the demo below and to the outcome section under it; putting its title, its price and
 * its line items up here made the page read as the website of a quoting tool. So this
 * panel carries the shape instead, and it carries it as a short scene rather than a
 * diagram: three specialists hand something in, GoodIdea gathers it, one decision is
 * put to the visitor, and a draft fills in behind it.
 *
 * It is staged the way the film below is staged — discrete beats with a hold on each,
 * paper that settles rather than glides, and a dot that runs the path a contribution
 * takes. It runs once, when the hero is first drawn, and then rests: nothing floats,
 * nothing loops, and when it has finished every word it revealed is simply on the
 * page, which is also what a reduced-motion visitor and a crawler get immediately.
 */

import { useEffect, useRef, useState } from "react";

import { paperCopy } from "./studio/paper/paperCopy";
import type { Locale, SiteCopy } from "./siteCopy";

const ROLES = ["research", "experience", "engineering"] as const;

/* The arcs are drawn in this space and stretched to whatever width the card gets, so
 * the three paths keep their shape at every size. Each starts under the mark it
 * belongs to — the marks sit in three equal columns, so the line always leaves the
 * right one whatever width a language's word for the discipline takes. */
const FLOW = { w: 300, h: 60 };
const SOURCES = [{ x: 50, y: 6 }, { x: 150, y: 2 }, { x: 250, y: 6 }];
const HUB = { x: 150, y: 58 };
const curve = (from: { x: number; y: number }) =>
  `M ${from.x} ${from.y} Q ${from.x + (HUB.x - from.x) * 0.55} ${HUB.y - 10} ${HUB.x} ${HUB.y}`;

/**
 * The scene, beat by beat. Each entry is when that beat starts, in milliseconds.
 *
 * The gaps are the point: a mark lands, then it holds; a slip settles, then it holds.
 * Evenly spaced beats read as a progress bar, which is the one thing this is not.
 */
const BEATS = [
  0,     // 1  research marks itself present
  200,   // 2  ...and its contribution lands on the desk
  520,   // 3  UX
  720,   // 4
  1040,  // 5  engineering
  1240,  // 6
  1620,  // 7  all three travel down into GoodIdea
  2160,  // 8  GoodIdea has them
  2460,  // 9  one decision, waiting
  3020,  // 10 the creator adopts it
  3380,  // 11 the draft fills in, a line at a time
  3560,  // 12
  3740,  // 13
  3920,  // 14
  4180,  // 15 and holds
] as const;
const SLIP = (index: number) => 2 + index * 2;
const GATHER = 7;
const HELD = 8;
const DECISION = 9;
const ADOPTED = 10;
const DRAFT = 11;

function useScene(): [number, () => void] {
  const [stage, setStage] = useState(0);
  const [run, setRun] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setStage(BEATS.length);
      return;
    }
    setStage(0);
    timers.current = BEATS.map((at, index) => window.setTimeout(() => setStage(index + 1), at));
    return () => timers.current.forEach(window.clearTimeout);
  }, [run]);

  return [stage, () => setRun((value) => value + 1)];
}

/** A contribution, as the slip of paper it is written on. Ruled, signed with the one
 *  mark colour its author uses, and tilted the way something set down by hand is. */
function Slip({ role, label, state }: { role: string; label: string; state: string }) {
  return (
    <div className={`outcome-slip outcome-slip-${role}`} data-role={role} data-state={state}>
      <span className="outcome-slip-rule" />
      <span className="outcome-slip-rule" />
      <b>{label}</b>
    </div>
  );
}

export function OutcomePreview({ locale, copy: t }: { locale: Locale; copy: SiteCopy }) {
  const agents = paperCopy[locale].agents;
  const [stage, replay] = useScene();
  const arrived = stage >= BEATS.length;
  const adopted = stage >= ADOPTED;
  const gathering = stage >= GATHER;

  return (
    <aside className="outcome" aria-label={t.previewLabel} data-arrived={arrived}>
      <p className="outcome-kicker">{t.previewLabel}</p>

      {/* The scene. Decorative throughout: the three disciplines, the decision and the
          four things that come out of it are all written as ordinary text below and
          beside it, whether it has run or not. */}
      <div className="outcome-stage" role="group" aria-label={t.previewContribLabel}>
        <ul className="outcome-credits">
          {ROLES.map((role, index) => (
            <li key={role} data-role={role} data-in={stage >= SLIP(index) - 1}>
              <span className="outcome-mark" aria-hidden="true">{agents[role].initial}</span>
              {agents[role].tagRole}
            </li>
          ))}
        </ul>

        <div className="outcome-slips" aria-hidden="true">
          {ROLES.map((role, index) => (
            <Slip
              key={role}
              role={role}
              label={t.previewContributions[index]}
              state={gathering ? "gone" : stage >= SLIP(index) ? "down" : "waiting"}
            />
          ))}
        </div>

        <svg className="outcome-tracks" viewBox={`0 0 ${FLOW.w} ${FLOW.h}`} preserveAspectRatio="none" aria-hidden="true">
          {SOURCES.map((from, index) => (
            <path key={index} className="outcome-track" d={curve(from)} pathLength={1} data-role={ROLES[index]} data-drawn={gathering} />
          ))}
          {SOURCES.map((from, index) => (
            <circle
              key={index}
              className="outcome-dot"
              /* Placed entirely by `offset-path`, so it starts at the origin and is
                 only ever drawn where that is supported; the slip falling and the arc
                 drawing carry the movement either way. */
              cx="0"
              cy="0"
              r="3.2"
              data-role={ROLES[index]}
              data-moving={gathering}
              style={{ offsetPath: `path("${curve(from)}")`, transitionDelay: `${index * 90}ms` }}
            />
          ))}
        </svg>

        <span className="outcome-hub" data-lit={stage >= HELD} aria-hidden="true">
          <svg viewBox="0 0 36 36">
            <path className="brand-loop" d="M26.4 10.8A10.5 10.5 0 1 0 27.7 24" />
            <path className="brand-turn" d="M18.8 18.2h8.7v7.5" />
            <circle className="brand-spark" cx="28.3" cy="7.6" r="2.5" />
          </svg>
        </span>
      </div>

      {/* What GoodIdea hands back is not an answer. It is one decision, and it waits. */}
      <p className="outcome-decision" data-shown={stage >= DECISION} data-adopted={adopted}>
        <span className="outcome-decision-mark" aria-hidden="true" />
        {adopted ? t.previewDecisionDone : t.previewDecision}
      </p>

      <div className="outcome-sheet" data-written={adopted}>
        <div className="outcome-sheet-head">
          <span className="outcome-chip">{t.previewDraftLabel}</span>
          <span className="outcome-version">{adopted ? "v0.2" : "v0.1"}</span>
        </div>
        <p className="outcome-sheet-label">{t.previewFormingLabel}</p>
        <ul className="outcome-deliverables">
          {t.previewDeliverables.map((item, index) => (
            <li key={item} data-shown={stage >= DRAFT + index}>{item}</li>
          ))}
        </ul>
      </div>

      {/* It runs once. Everything it shows is already on the page when it has finished,
          so this is for a second look rather than for catching up. */}
      {arrived && (
        <button type="button" className="outcome-replay" onClick={replay}>{t.previewReplay}</button>
      )}
    </aside>
  );
}
