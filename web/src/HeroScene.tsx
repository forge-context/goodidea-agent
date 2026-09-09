/* The hero's right half: one drawing, and the three lines written on it.
 *
 * The film below already shows the mechanism — an agent proposes, the visitor adopts,
 * the draft changes. The hero used to show a small version of the same thing, which
 * meant a visitor read the argument twice and watched it once. This says the other
 * half instead, the half the film never states outright: there is a team at this, and
 * a vague idea is being worked into something you could start building.
 *
 * The picture is a single supplied illustration on its own cream ground (#faf8f2,
 * which is the page's own paper colour), not a composite: the two people, the sheets,
 * the note, the plant, the wireframes and the green marks are all inside it. Nothing
 * here re-draws any of that in CSS or SVG, and nothing tries to move one part of it
 * against another — it has no layers to move.
 *
 * What the file deliberately leaves out is words, because the same picture serves
 * three languages. Three short phrases are laid over it as ordinary DOM text, each
 * positioned as a percentage of the image and turned to the angle of the paper under
 * it: the title above the long green rule, the promise inside the ring, and where
 * version one stops above the short rule. They are decoration — every one of them is
 * also said in plain text elsewhere on the page.
 */

import { useEffect, useRef, type RefObject } from "react";

import type { SiteCopy } from "./siteCopy";

/** The supplied artwork, at its own pixel size, so the box is reserved before it
 *  loads and the page never jumps. */
const ART = {
  src: "/hero/goodidea-hero-illustration.webp",
  w: 1374,
  h: 1145,
} as const;

/**
 * How far the hero has travelled out of the window, written to the scene as `--hero-p`
 * (0 at rest, 1 once the hero has scrolled a full height past the top).
 *
 * One listener, coalesced into one frame, and it stops entirely when the scene leaves
 * the viewport or when the visitor asked for less movement. The value is quantised so
 * a scroll of a few pixels does not repaint for a change nobody can see, and the
 * transform itself lives in CSS, so no React state is touched while scrolling.
 */
function useSceneParallax(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* A phone gets the composition, not the movement: the picture is small there, the
       hero is short, and a parallax over 200px of scroll is only jitter. */
    const still = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 720px)");

    let frame = 0;
    let onScreen = true;
    let last = -1;

    const write = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
      const q = Math.round(p * 100) / 100;
      if (q === last) return;
      last = q;
      el.style.setProperty("--hero-p", String(q));
    };
    const schedule = () => {
      if (!frame && onScreen && !still.matches) frame = requestAnimationFrame(write);
    };

    const observer = typeof IntersectionObserver === "undefined" ? null
      : new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) schedule();
      }, { threshold: 0 });
    observer?.observe(el);

    const apply = () => {
      if (still.matches) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
        el.style.setProperty("--hero-p", "0");
        return;
      }
      last = -1;
      schedule();
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", apply);
    still.addEventListener("change", apply);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", apply);
      still.removeEventListener("change", apply);
    };
  }, [ref]);
}

export function HeroScene({ copy: t }: { copy: SiteCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  useSceneParallax(ref);
  const scene = t.scene;

  return (
    /* One picture with one description. Every word inside it is also said in the
       heading and the intro beside it, so a screen reader is not asked to read a
       drawing twice. The outer box is measured for the scroll offset; the inner one
       is what moves, so the two never chase each other. */
    <div className="hero-scene" ref={ref} role="img" aria-label={scene.alt}>
      <div className="hero-art">
        <img
          className="hero-art-image"
          src={ART.src}
          width={ART.w}
          height={ART.h}
          alt=""
          draggable={false}
          fetchPriority="high"
          decoding="async"
        />

        {/* Above the long green rule near the top of the sheet, which runs at +7°. */}
        <p className="hero-ink hero-ink-title" aria-hidden="true">{scene.title}</p>

        {/* Inside the ring. The paper is close to flat here, so this barely turns. */}
        <p className="hero-ink hero-ink-circled" aria-hidden="true">{scene.circled}</p>

        {/* Above the short rule at the foot of the sheet, which runs at -3°. */}
        <p className="hero-ink hero-ink-first" aria-hidden="true">{scene.first}</p>
      </div>
    </div>
  );
}
