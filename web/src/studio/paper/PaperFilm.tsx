/* The player around the film.
 *
 * One requestAnimationFrame loop, one quantised time, and every control writes to that
 * time and nothing else — so play, pause, replay, dragging the slider, looping and
 * leaving the viewport all end up at the same picture for the same second.
 *
 * Playback suspends when the film scrolls out of view or the tab goes to the
 * background, and resumes where it left off; it never overrides a pause the visitor
 * asked for, and it never listens on `window` for keys the page might want.
 */

import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from "react";

import {
  CHAPTER_STARTS, DURATION, MOBILE_STAGE, POSTER_TIME, STAGE, STATIC_TIME,
  advanceTime, atEnd, chapterAt, chapterStill, quantize, sampleScene,
} from "./paperTimeline";
import { paperCopy, type PaperLocale } from "./paperCopy";
import { PaperStage } from "./PaperStage";
import "./paper.css";

/** Below this the film switches to its portrait composition rather than shrinking. */
const COMPACT_WIDTH = 720;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** The stage is drawn once at its own size and scaled as a picture, so text never
 *  reflows mid-shot and the window never changes height while it plays. */
function useStageScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [{ scale, compact }, setLayout] = useState({ scale: 1, compact: false });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const isCompact = el.clientWidth <= COMPACT_WIDTH;
      const width = isCompact ? MOBILE_STAGE.w : STAGE.w;
      setLayout({ compact: isCompact, scale: el.clientWidth / width });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, scale, compact };
}

/** True while the element is at least partly on screen. */
function useOnScreen<T extends Element>(ref: React.RefObject<T | null>) {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return onScreen;
}

export type PaperFilmProps = {
  locale: PaperLocale;
  /** The lab preview turns these on; the landing page ships none of them. */
  debug?: boolean;
  loop?: boolean;
  /** Lets the lab show the reduced-motion presentation without a system setting. */
  forceReduced?: boolean;
};

export function PaperFilm({ locale, debug = false, loop = false, forceReduced = false }: PaperFilmProps) {
  // A locale change is a different reading of the script, not a re-style of this one.
  return <Film key={`${locale}-${forceReduced}`} locale={locale} debug={debug} loop={loop} forceReduced={forceReduced} />;
}

function Film({ locale, debug, loop, forceReduced }: Required<PaperFilmProps>) {
  const copy = paperCopy[locale];
  const reduced = useReducedMotion() || forceReduced;
  const { ref: viewportRef, scale, compact } = useStageScale();
  const shellRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(shellRef);

  const [time, setTime] = useState(0);
  /** What the visitor asked for. Losing the viewport suspends playback; it never
   *  turns this back on by itself. */
  const [wantsToPlay, setWantsToPlay] = useState(false);
  const [started, setStarted] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [looping, setLooping] = useState(loop);
  const raw = useRef(0);
  const lastFrame = useRef<number | null>(null);

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const commit = useCallback((next: number) => {
    raw.current = next;
    const q = quantize(next);
    setTime((prev) => (prev === q ? prev : q));
  }, []);

  const playing = wantsToPlay && onScreen && pageVisible && !reduced;

  useEffect(() => {
    if (!playing) {
      lastFrame.current = null;
      return;
    }
    let alive = true;
    let handle = 0;
    const step = (now: number) => {
      if (!alive) return;
      if (lastFrame.current === null) lastFrame.current = now;
      const dt = (now - lastFrame.current) / 1000;
      lastFrame.current = now;
      const advanced = advanceTime(raw.current, dt, DURATION, looping);
      if (!advanced.playing) setWantsToPlay(false);
      commit(advanced.time);
      handle = requestAnimationFrame(step);
    };
    handle = requestAnimationFrame(step);
    return () => {
      alive = false;
      cancelAnimationFrame(handle);
      lastFrame.current = null;
    };
  }, [playing, looping, commit]);

  const seek = useCallback((next: number) => {
    lastFrame.current = null;
    setStarted(true);
    commit(Math.max(0, Math.min(next, DURATION)));
  }, [commit]);

  const replay = useCallback(() => {
    seek(0);
    setWantsToPlay(!reduced);
  }, [seek, reduced]);

  const start = useCallback(() => {
    setStarted(true);
    if (reduced) {
      seek(chapterStill(0));
      return;
    }
    if (atEnd(time)) seek(0);
    setWantsToPlay(true);
  }, [reduced, seek, time]);

  const chapter = chapterAt(time);
  /* Before the first play the poster holds a frame that says what the film is about:
   * the designer, the quote, and the three questions that started it. */
  const shown = reduced ? time || chapterStill(0) : started ? time : POSTER_TIME;
  const scene = useMemo(() => sampleScene(shown, compact, looping && started), [shown, compact, looping, started]);
  const stage = compact ? MOBILE_STAGE : STAGE;
  /* The clock runs in raw seconds and the picture is sampled from quantised ones, so
   * "finished" is a question about frames. Asking it in raw seconds is what used to
   * leave the control offering "play" at a film that had stopped, and the read-out one
   * second short of the length the page states. */
  const finished = started && atEnd(time);
  /* Once it has finished, the read-out says the length the page promised rather than
   * the last whole second before it. */
  const elapsed = !started ? 0 : finished ? Math.round(DURATION) : Math.floor(time);

  const stepScene = (delta: number) => {
    const next = chapterAt(shown) + delta;
    seek(chapterStill(Math.max(0, Math.min(next, CHAPTER_STARTS.length - 1))));
  };

  return (
    <div className="gip-film" data-locale={locale} ref={shellRef}>
      <div
        className="gip-viewport"
        ref={viewportRef}
        style={{ aspectRatio: `${stage.w} / ${stage.h}` }}
      >
        <div className="gip-viewport-inner" style={{ transform: `scale(${scale})`, width: stage.w, height: stage.h }}>
          <PaperStage scene={scene} copy={copy} />
        </div>
        {!started && !reduced && (
          <button type="button" className="gip-poster" onClick={start}>
            <span><i className="gip-icon" aria-hidden="true">▶</i>{copy.ui.poster}</span>
          </button>
        )}
      </div>

      <div className="gip-controls">
        {reduced ? (
          <>
            <button type="button" onClick={() => stepScene(-1)} disabled={chapterAt(shown) === 0}>
              <span aria-hidden="true">←</span>{copy.ui.prevScene}
            </button>
            <button type="button" className="gip-play" onClick={() => stepScene(1)} disabled={chapterAt(shown) === CHAPTER_STARTS.length - 1}>
              {copy.ui.nextScene}<span aria-hidden="true">→</span>
            </button>
            <span className="gip-time">{chapterAt(shown) + 1} / {CHAPTER_STARTS.length}</span>
          </>
        ) : (
          <>
            <button type="button" className="gip-play" onClick={() => (playing ? setWantsToPlay(false) : start())}>
              {playing ? copy.ui.pause : finished ? copy.ui.replay : copy.ui.play}
              <i className="gip-icon" aria-hidden="true">{playing ? "❙❙" : finished ? "↺" : "▶"}</i>
            </button>
            <button type="button" onClick={replay}>
              {copy.ui.replay}<i className="gip-icon" aria-hidden="true">↺</i>
            </button>
            <input
              className="gip-scrub"
              type="range"
              min={0}
              max={DURATION}
              step={0.01}
              value={started ? time : 0}
              aria-label={copy.ui.progress}
              aria-valuetext={`${Math.round(started ? time : 0)} / ${Math.round(DURATION)} · ${copy.chapters[chapter]}`}
              onChange={(event) => {
                setWantsToPlay(false);
                seek(Number(event.target.value));
              }}
            />
            <span className="gip-time">
              {String(elapsed).padStart(2, "0")} / {Math.round(DURATION)}
            </span>
            {debug && (
              <label className="gip-time" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="checkbox" checked={looping} onChange={(event) => setLooping(event.target.checked)} />
                {copy.ui.loop}
              </label>
            )}
          </>
        )}
      </div>

      <div className="gip-below">
        <p>{reduced ? copy.ui.reduced : copy.ui.concept}</p>
        {debug && <p className="gip-time">{shown.toFixed(2)} · {copy.chapters[chapterAt(shown)]}{scene.compact ? " · compact" : ""}</p>}
      </div>

      <div className="gip-transcript">
        <details>
          <summary>{copy.ui.transcript}</summary>
          <ol>
            {copy.chapters.map((label, index) => (
              <li key={label}>
                <button type="button" className="gip-chapter-link" onClick={() => { setWantsToPlay(false); seek(chapterStill(index)); }}>
                  <b>{label}</b>
                </button>
                {" "}{copy.chapterNotes[index]}
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  );
}

export { DURATION as PAPER_DURATION, STATIC_TIME };
