/* The physical layer of the film: ink, paper, the desk it sits on, and the person at
 * it. None of these keep a clock — each one is handed the frame the timeline sampled
 * and draws exactly that. */

import { useId, type CSSProperties, type ReactNode } from "react";

import type { Pose, Scene } from "./paperTimeline";
import type { PaperCopyShape } from "./paperCopy";

export const ASSETS = "/paper-film";

/** The site's own mark, at the size the film needs it.
 *
 * The same path the page header and the footer draw, so the workspace inside the film,
 * the closing card and the page around them are one identity rather than three. It
 * takes its colour from whatever it is placed in. */
export function GoodIdeaMark({ className = "" }: { className?: string }) {
  return (
    <span className={`gip-mark ${className}`} aria-hidden="true">
      <svg viewBox="0 0 36 36">
        <path className="gip-mark-loop" d="M26.4 10.8A10.5 10.5 0 1 0 27.7 24" />
        <path className="gip-mark-turn" d="M18.8 18.2h8.7v7.5" />
        <circle className="gip-mark-spark" cx="28.3" cy="7.6" r="2.5" />
      </svg>
    </span>
  );
}

type InkProps = {
  /** Fixed paths. Only how far the pen has got changes with time. */
  strokes: readonly string[];
  /** 0–1 overall progress. */
  progress: number;
  /** Relative weight of each stroke; equal by default. */
  weights?: readonly number[];
  className?: string;
  width?: number;
};

/** A hand-drawn line revealed stroke by stroke with dashoffset. */
export function Ink({ strokes, progress, weights, className, width = 3 }: InkProps) {
  const w = weights ?? strokes.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  return (
    <>
      {strokes.map((d, i) => {
        const from = acc / total;
        acc += w[i];
        const to = acc / total;
        const p = to <= from ? 1 : Math.max(0, Math.min(1, (progress - from) / (to - from)));
        if (p <= 0) return null;
        return (
          <path
            key={i}
            d={d}
            className={className}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - p}
            strokeWidth={width}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

type PaperProps = {
  pose: Pose;
  w: number;
  h: number;
  src: string;
  /** The sheet and everything written on it share one parent, so they move together. */
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** How far the sheet has become a product canvas inside the project space. */
  surface?: number;
};

export function Paper({ pose, w, h, src, children, style, className = "", surface = 0 }: PaperProps) {
  return (
    <div
      className={`gip-paper ${className}`}
      style={{
        width: w,
        height: h,
        opacity: pose.opacity,
        transform:
          `translate(${pose.x - w / 2}px, ${pose.y - h / 2}px) `
          + `rotate(${pose.rot}deg) scale(${pose.scale})`,
        ...style,
      }}
    >
      <img className="gip-sheet-img" src={src} alt="" draggable={false} loading="lazy" decoding="async"
        style={surface > 0 ? { opacity: 1 - surface } : undefined} />
      {surface > 0 && <div className="gip-product-surface" style={{ opacity: surface }} />}
      {children}
    </div>
  );
}

/** Two edge objects only: a half-visible notebook and a strip of tape. Both are fixed,
 *  so a loop never makes them flicker. */
export function Desk() {
  return (
    <div className="gip-desk" aria-hidden="true">
      <div className="gip-notebook">
        <div className="gip-notebook-pages">
          <svg viewBox="0 0 220 320">
            <path d="M 28 42 Q 81 37 164 41 M 28 76 L 179 79 M 28 111 L 163 108 M 28 146 L 175 148 M 28 183 L 149 180 M 28 218 L 171 220" />
            <path d="M 195 11 L 193 305" className="gip-binding" />
          </svg>
        </div>
      </div>
      <div className="gip-tape" />
    </div>
  );
}

const POSES = { work: 0, think: 1, idea: 2 } as const;

/**
 * The original character sheet plus a separate SVG working environment.
 *
 * The generated sprite has no real alpha — a neutral checkerboard is baked into it —
 * so transparency is derived at composite time by two merged colour matrices: warm
 * pixels (skin, clothing) and graphite pixels (pencil lines) are kept, neutral light
 * pixels are dropped. See `public/paper-film/designer-source.md` before touching it.
 * The filter id is per-instance, because more than one film can be on a page.
 */
export function Designer({ scene }: { scene: Scene }) {
  const { pose, gesture, equipment } = scene.designer;
  const cutout = useId();
  if (pose.opacity <= 0.001) return null;
  return (
    <div
      className="gip-designer"
      data-gesture={gesture}
      aria-hidden="true"
      style={{
        opacity: pose.opacity,
        transform: `translate(${pose.x}px, ${pose.y}px) scale(${pose.scale})`,
      }}
    >
      <svg className="gip-designer-env" viewBox="0 0 560 650" style={{ opacity: equipment }}>
        <g fill="none" stroke="#847c6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 54 434 Q 13 432 17 487 L 30 591 M 21 591 L 119 590" stroke="#a9a18d" />
          <path d="M 13 594 Q 245 590 548 594 M 42 602 L 42 640 M 520 602 L 520 639" />
        </g>
      </svg>
      {/* One shared texture, the pose chosen by moving the viewBox: no image swap, so
          dragging the timeline never flashes white. */}
      <svg className="gip-designer-figure" viewBox={`${POSES[gesture] * 512} 112 512 770`}>
        <defs>
          <filter id={cutout} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feColorMatrix in="SourceGraphic" result="warm" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  24 0 -24 0 -0.18" />
            <feColorMatrix in="SourceGraphic" result="graphite" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -10 0 0 0 6" />
            <feMerge><feMergeNode in="graphite" /><feMergeNode in="warm" /></feMerge>
          </filter>
        </defs>
        <image href={`${ASSETS}/designer-poses.webp`} width="1536" height="1024" filter={`url(#${cutout})`} />
      </svg>
      <svg className="gip-designer-kit" viewBox="0 0 560 650" style={{ opacity: equipment }}>
        <g stroke="#827b69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <g data-part="laptop">
            <path d="M 354 373 L 506 366 L 493 557 L 342 559 Z" fill="#e6e3d5" />
            <path d="M 365 385 L 493 381 L 481 542 L 355 543 Z" fill="#f5f1e6" />
            <path d="M 342 559 L 493 557 L 533 587 L 323 590 Z" fill="#dedcce" />
            <path d="M 359 566 L 483 565 M 354 573 L 491 572 M 393 582 L 438 581" fill="none" opacity=".5" />
            <path d="M 408 421 L 385 457 L 428 455 Z M 423 421 L 447 453 L 428 455" fill="#a8b396" stroke="#71816a" />
            <path d="M 374 484 L 472 481 M 374 499 L 447 497 M 374 513 L 461 511" fill="none" opacity=".45" />
          </g>
          <g data-part="tablet">
            <path d="M 233 557 L 331 550 L 372 591 L 270 597 Z" fill="#d4d5c5" />
            <path d="M 251 561 L 326 557 L 352 583 L 278 589 Z" fill="#ecebdd" strokeWidth="1.2" />
            <path d="M 291 566 L 283 581 L 316 579 L 307 565" fill="none" stroke="#71816a" />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** One drawing language, two states. The exploration and the confirmed result are
 *  drawn separately: an option nobody adopted never appears on the product draft. */
export function ScopeSketch({
  progress, copy, accepted = false,
}: { progress: number[]; copy: PaperCopyShape["sketch"]; accepted?: boolean }) {
  const visible = (i: number) => (progress[i] >= 0.75 ? 1 : 0);
  if (accepted) {
    const rows = copy.accepted.rows;
    return (
      <svg className="gip-sketch gip-sketch-done" viewBox="0 0 352 224" role="img" aria-label={copy.accepted.alt}>
        <g opacity={visible(0)}>
          <text x="8" y="24" className="gip-sketch-caption">{copy.accepted.caption}</text>
          <text x="18" y="66">{rows[0][0]}</text>
        </g>
        <Ink strokes={["M 5 39 L 344 41 L 346 180 L 7 182 Z", "M 10 82 L 342 83"]}
          progress={progress[0]} className="gip-ink gip-ink-sketch" width={1.8} />
        <g opacity={visible(1)}><text x="18" y="116">{rows[1][0]}</text><text x="240" y="116">{rows[1][1]}</text></g>
        <Ink strokes={["M 10 134 L 341 132"]} progress={progress[1]} className="gip-ink gip-ink-sketch" width={1.6} />
        <g opacity={visible(2)}><text x="18" y="166">{rows[2][0]}</text><text x="240" y="166">{rows[2][1]}</text></g>
        <Ink strokes={["M 11 204 L 19 211 L 32 195"]} progress={progress[3]} className="gip-ink gip-ink-arrow" width={2.6} />
        <text x="45" y="214" opacity={visible(3)}>{copy.accepted.foot}</text>
      </svg>
    );
  }
  const rows = copy.explore.rows;
  return (
    <svg className="gip-sketch" viewBox="0 0 352 292" role="img" aria-label={copy.explore.alt}>
      <Ink strokes={["M 4 6 L 346 9 L 343 280 L 7 283 Z", "M 7 91 L 346 89"]}
        progress={progress[0]} className="gip-ink gip-ink-sketch" width={2} />
      <g opacity={visible(0)}>
        <text x="18" y="39">{rows[0][0]}</text>
        <text x="18" y="72" className="gip-sketch-small">{rows[0][1]}</text>
      </g>
      <Ink strokes={["M 7 154 L 343 156", "M 196 108 L 323 109 L 325 139 L 195 138 Z"]}
        progress={progress[1]} className="gip-ink gip-ink-sketch" width={1.7} />
      <g opacity={visible(1)}>
        <text x="18" y="131">{rows[1][0]}</text>
        <text x="203" y="131" className="gip-sketch-small">{rows[1][1]}</text>
      </g>
      <Ink strokes={["M 8 216 L 342 214", "M 18 176 L 24 183 L 36 168"]}
        progress={progress[2]} className="gip-ink gip-ink-sketch" width={1.7} />
      <g opacity={visible(2)}><text x="47" y="195">{rows[2][0]}</text><text x="202" y="195">{rows[2][1]}</text></g>
      <Ink strokes={["M 17 246 L 36 247", "M 202 267 L 316 264"]}
        progress={progress[3]} className="gip-ink gip-ink-sketch" width={1.7} />
      <g opacity={visible(3)}><text x="47" y="259">{rows[3][0]}</text><text x="202" y="259">{rows[3][1]}</text></g>
    </svg>
  );
}
