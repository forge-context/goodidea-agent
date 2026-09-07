/* The walkthrough on the landing page: one story, watched or explored.
 *
 * Watching is a scene index plus a beat inside it, and every scene carries its whole
 * screen, so jumping to a chapter gives the same result as having watched to it.
 * Exploring is a second state that the script never writes into and that the script
 * never clears: pausing to poke at the prototype, replaying, or jumping chapters all
 * leave what the visitor typed exactly where it was.
 *
 * Exactly one timeout exists at a time. The effect below owns it and clears it on
 * every state change, which is what makes pause actually stop the typing, the
 * conversation and the pane instead of only the visible one — and what stops an
 * abandoned scene from finishing its line into the scene that replaced it.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  autoInitial,
  autoReducer,
  shouldAdvance,
  type AutoAction,
  type Beat,
} from "../autoDemo";
import { StoryStage } from "./StoryStage";
import { storyCopy, type DirectionId, type StoryCopy } from "./storyCopy";
import { emptyProto, type ProtoState } from "./storyProto";
import {
  beatMs,
  buildScenes,
  chapterEntries,
  demoSeconds,
  longestLine,
  playbackPlan,
  stateAt,
  threadAt,
  type ScriptMessage,
} from "./storyScript";
import { siteCopy, withSeconds, type Locale } from "../../siteCopy";

const REPO = "https://github.com/forge-context/goodidea-agent";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function StoryDemo({ locale }: { locale: Locale }) {
  const copy = storyCopy[locale];
  const site = siteCopy[locale];
  const reduceMotion = useRef(prefersReducedMotion()).current;

  const scenes = useMemo(() => buildScenes(locale), [locale]);
  const plan = useMemo(() => playbackPlan(scenes, locale), [locale, scenes]);
  const chapters = useMemo(() => chapterEntries(scenes), [scenes]);
  const seconds = useMemo(() => demoSeconds(locale), [locale]);
  const sceneIndex = useCallback(
    (id: string) => Math.max(scenes.findIndex((scene) => scene.id === id), 0),
    [scenes],
  );

  const [started, setStarted] = useState(false);
  const [auto, setAuto] = useState(autoInitial);
  const [visible, setVisible] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [sheet, setSheet] = useState<null | "map" | "thread">(null);

  /* The visitor's own state. It is seeded once from whatever was on screen when they
   * stepped in, and from then on it is theirs: replaying or jumping never clears it. */
  const [exploring, setExploring] = useState(false);
  const [ownProto, setOwnProto] = useState<ProtoState | null>(null);
  const [direction, setDirection] = useState<DirectionId | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const dispatchAuto = useCallback(
    (action: AutoAction) => setAuto((state) => autoReducer(state, action, plan)),
    [plan],
  );

  // A visitor who leaves the tab comes back to the scene they left, not to a
  // walkthrough that finished without them.
  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const playing = started && !exploring;

  useEffect(() => {
    if (!shouldAdvance(auto, { mode: playing ? "auto" : "manual", visible, reduceMotion })) return;
    const timer = window.setTimeout(
      () => dispatchAuto({ type: "advance" }),
      beatMs(auto, scenes[auto.index]),
    );
    return () => window.clearTimeout(timer);
  }, [auto, dispatchAuto, playing, reduceMotion, scenes, visible]);

  const playIndex = started ? auto.index : 0;
  const playBeat: Beat = started ? auto.beat : "reply";
  // What the pane shows belongs to the last answer, not to the line being typed
  // against it.
  const scene = stateAt(scenes, playIndex, playBeat);
  const chapterNow = scenes[playIndex].chapter;

  useEffect(() => {
    if (!started) return;
    const entry = copy.chapters[chapterNow];
    setAnnouncement(`${entry.label} — ${entry.point}`);
  }, [chapterNow, copy, started]);

  const messages = useMemo(
    () => threadAt(scenes, playIndex, playBeat),
    [playBeat, playIndex, scenes],
  );

  /* The line the demo is typing, cut on visible characters so a Chinese glyph or an
   * emoji is never split in half. Only the visitor's turns are typed; answers land
   * whole, because a walkthrough that types both halves of a conversation is a
   * walkthrough nobody finishes. */
  const typedLine = useMemo(() => {
    if (!started || (auto.beat !== "typing" && auto.beat !== "pending")) return "";
    return scenes[auto.index].typed.slice(0, auto.typed).join("");
  }, [auto.beat, auto.index, auto.typed, scenes, started]);
  // Not this scene's line but the longest in the script: the field is as tall as it
  // will ever need to be from the first frame, so playback moves nothing but text.
  const reserved = useMemo(() => longestLine(scenes), [scenes]);

  const seedProto = useCallback((): ProtoState => {
    if (scene.proto.items.length > 0) return scene.proto;
    // Before the prototype exists in the story, exploring starts on an empty desk:
    // the visitor pastes and sorts it themselves, which is the path being claimed.
    return { ...emptyProto, view: "designer", raw: copy.proto.raw, items: [] };
  }, [copy, scene]);

  /* Touching the prototype stops the story rather than letting it move on under the
   * visitor. Leaving exploring therefore lands back on a paused scene, and the play
   * control — not the way out of exploring — is what starts it again. */
  const enterExplore = useCallback(() => {
    setSheet(null);
    setOwnProto((current) => current ?? seedProto());
    setExploring(true);
    dispatchAuto({ type: "pause" });
    setAnnouncement(copy.proto.exploreHint);
  }, [copy, dispatchAuto, seedProto]);

  const leaveExplore = useCallback(() => {
    setExploring(false);
    setDirection(null);
    setSelectedNode(null);
  }, []);

  const startWatching = useCallback(() => {
    setSheet(null);
    leaveExplore();
    setStarted(true);
    // With reduced motion nothing advances on a timer, so playback opens on the first
    // scene with the step controls instead of a play state that never moves.
    dispatchAuto(reduceMotion ? { type: "seek", index: 0, whole: true } : { type: "play" });
  }, [dispatchAuto, leaveExplore, reduceMotion]);

  const replay = useCallback(() => {
    setSheet(null);
    leaveExplore();
    setStarted(true);
    dispatchAuto(reduceMotion ? { type: "seek", index: 0, whole: true } : { type: "replay" });
  }, [dispatchAuto, leaveExplore, reduceMotion]);

  const seek = useCallback(
    (index: number, andExplore = false) => {
      setSheet(null);
      setSelectedNode(null);
      setDirection(null);
      setStarted(true);
      dispatchAuto({ type: "seek", index, whole: true });
      if (andExplore) {
        setOwnProto((current) => current ?? scenes[index].proto);
        setExploring(true);
      } else {
        setExploring(false);
      }
    },
    [dispatchAuto, reduceMotion, scenes],
  );

  /* The play control is the one place playback and exploring meet: pressing it while
   * exploring puts the visitor back in the story rather than leaving two ideas of
   * "now" on screen at once. */
  const togglePlay = useCallback(() => {
    if (!started) {
      startWatching();
      return;
    }
    if (exploring) {
      leaveExplore();
      dispatchAuto({ type: "resume" });
      return;
    }
    dispatchAuto({ type: "toggle" });
  }, [dispatchAuto, exploring, leaveExplore, started, startWatching]);

  const protoState = exploring && ownProto ? ownProto : scene.proto;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  // The newest turn has to be on screen before the next one arrives. This moves the
  // demo's own box, never the page, so a visitor reading further down is not dragged.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const frame = window.requestAnimationFrame(() => {
      box.scrollTop = box.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages]);

  const status = auto.finished
    ? site.demo.finished
    : exploring
      ? copy.ui.exploring
      : auto.playing && !reduceMotion
        ? site.demo.playing
        : site.demo.paused;

  const stage = (
    <StoryStage
      copy={copy}
      locale={locale}
      scene={scene}
      proto={protoState}
      interactive={exploring}
      onExplore={enterExplore}
      direction={direction}
      onDirection={setDirection}
      onProtoChange={setOwnProto}
      selectedNode={selectedNode}
      onSelectNode={setSelectedNode}
      reduceMotion={reduceMotion}
      onReplay={replay}
      onSeeOutcome={() => seek(sceneIndex("outcome"))}
      repoHref={REPO}
    />
  );

  return (
    <div className="studio story" data-layout={scene.layout} data-exploring={exploring} data-playing={auto.playing && playing && visible && !reduceMotion} data-beat={playBeat}>
      <div className="studio-bar">
        <span className="studio-mode">
          <span aria-hidden="true">●</span>
          {copy.ui.fixedNote}
        </span>
        <div className="studio-bar-actions">
          <button
            type="button"
            className="studio-explore"
            data-active={exploring}
            aria-pressed={exploring}
            onClick={exploring ? leaveExplore : enterExplore}
          >
            {exploring ? copy.ui.exploreLeave : copy.ui.exploreEnter}
          </button>
          {scene.layout === "talk" && (
            <button type="button" className="studio-tab" onClick={() => setSheet("map")}>
              {copy.ui.mapTab}
            </button>
          )}
          {scene.layout !== "talk" && (
            <button type="button" className="studio-tab" onClick={() => setSheet("thread")}>
              {copy.ui.threadTab}
            </button>
          )}
        </div>
      </div>

      {/* The transport keeps one position across every state, so pausing never moves
          the button out from under the pointer. */}
      <div className="demo-transport">
        <div className="transport-controls">
          {reduceMotion ? (
            <>
              {started && (
                <button
                  type="button"
                  className="transport-step"
                  onClick={() => dispatchAuto({ type: "step", by: -1 })}
                  disabled={auto.index === 0}
                >
                  {site.demo.prevStep}
                </button>
              )}
              <button
                type="button"
                className="transport-play"
                onClick={
                  !started ? startWatching : auto.finished ? replay : () => dispatchAuto({ type: "step", by: 1 })
                }
              >
                {/* Nothing plays under reduced motion, so the control never offers
                    to play: it is the same steps from the first press. */}
                {!started || !auto.finished ? site.demo.nextStep : site.demo.restartSteps}
              </button>
            </>
          ) : (
            <button type="button" className="transport-play" onClick={togglePlay}>
              <PlayIcon paused={!auto.playing || !playing} />
              {!started
                ? site.demo.play
                : auto.finished
                  ? site.demo.replay
                  : exploring
                    ? site.demo.resume
                    : auto.playing
                      ? site.demo.pause
                      : site.demo.resume}
            </button>
          )}
          {started && !auto.finished && (
            <button type="button" className="transport-step" onClick={replay}>
              {reduceMotion ? site.demo.restartSteps : site.demo.replay}
            </button>
          )}
          <span
            className="transport-status"
            data-state={!started ? "idle" : exploring ? "exploring" : statusState(auto.finished, auto.playing, reduceMotion)}
          >
            {started
              ? `${status} · ${site.demo.stepOf
                  .replace("{current}", String(auto.index + 1))
                  .replace("{total}", String(scenes.length))}`
              : withSeconds(site.demo.lengthNote, seconds)}
          </span>
        </div>
        <ol className="transport-chapters" aria-label={site.demo.stageLabel}>
          {copy.chapters.map((chapter, index) => (
            <li key={chapter.label}>
              <button
                type="button"
                data-state={
                  !started ? "ahead" : chapterNow === index ? "now" : chapterNow > index ? "past" : "ahead"
                }
                aria-current={started && chapterNow === index ? "step" : undefined}
                // The one timeout is re-armed from the state this produces, so nothing
                // from the scene being left can still land afterwards.
                onClick={() => seek(chapters[index])}
              >
                <b>{String(index + 1).padStart(2, "0")}</b>
                {chapter.label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="story-grid">
        <section className="studio-chat" aria-label={copy.ui.conversationLabel}>
          {started && (
            <p className="scene-point">
              <span>{copy.chapters[chapterNow].label}</span>
              {copy.chapters[chapterNow].point}
            </p>
          )}

          <div className="chat-scroll" ref={scrollRef}>
            <Thread copy={copy} messages={messages} />
          </div>

          <div className="chat-dock">
            {!started && (
              <div className="demo-start">
                <h3>{site.demo.startTitle}</h3>
                <p>{withSeconds(site.demo.startText, seconds)}</p>
                <div className="demo-start-actions">
                  <button type="button" className="demo-cta" onClick={startWatching}>
                    {reduceMotion ? site.demo.nextStep : site.demo.watch}
                  </button>
                  <button
                    type="button"
                    className="demo-cta quiet"
                    onClick={() => seek(sceneIndex("protoOpen"), true)}
                  >
                    {site.demo.tryIt}
                  </button>
                </div>
              </div>
            )}

            {exploring ? (
              <p className="explore-bar">
                <span>{copy.ui.exploring}</span>
                {copy.ui.exploreKept}
              </p>
            ) : (
              started &&
              !auto.finished && scenes[auto.index].typed.length > 0 && (
                <DemoCompose
                  copy={copy}
                  beat={auto.beat}
                  text={typedLine}
                  full={reserved}
                  reduceMotion={reduceMotion}
                />
              )
            )}
          </div>
        </section>

        {stage}
      </div>

      {sheet && (
        <StudioSheet
          title={sheet === "map" ? copy.ui.mapTitle : copy.ui.threadTab}
          close={copy.ui.close}
          onClose={() => setSheet(null)}
        >
          {sheet === "map" ? stage : <Thread copy={copy} messages={messages} />}
        </StudioSheet>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

function statusState(finished: boolean, playing: boolean, reduceMotion: boolean) {
  if (finished) return "finished";
  return playing && !reduceMotion ? "playing" : "paused";
}

/* The conversation, including the one line per turn that says what visibly changed:
 * on a phone the pane is a tab away, and the change still has to be readable. */
function Thread({ copy, messages }: { copy: StoryCopy; messages: ScriptMessage[] }) {
  const archived = messages.length > 7 ? messages.slice(0, -7) : [];
  const active = archived.length > 0 ? messages.slice(archived.length) : messages;
  return (
    <div className="chat-inner">
      {archived.length > 0 && (
        <details className="chat-history">
          <summary>{copy.ui.earlierTurns.replace("{count}", String(archived.length))}</summary>
          <div className="chat-history-list">
            {archived.map((message, index) => (
              <Turn key={`a${index}`} copy={copy} message={message} />
            ))}
          </div>
        </details>
      )}
      {active.map((message, index) => (
        <Turn key={`t${archived.length + index}`} copy={copy} message={message} />
      ))}
    </div>
  );
}

function Turn({ copy, message }: { copy: StoryCopy; message: ScriptMessage }) {
  if (message.role === "user") return <p className="chat-said">{message.text}</p>;
  if (message.role === "change") {
    return (
      <p className="chat-change">
        <span>{copy.ui.changeLead}</span>
        {message.text}
      </p>
    );
  }
  return (
    <div className="chat-asked">
      {message.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function PlayIcon({ paused }: { paused: boolean }) {
  return (
    <svg className="transport-icon" viewBox="0 0 16 16" aria-hidden="true">
      {paused ? <path d="M4 2.6 13 8l-9 5.4z" /> : <path d="M4.6 2.8h2.6v10.4H4.6zm4.2 0h2.6v10.4H8.8z" />}
    </svg>
  );
}

/* The composer while the walkthrough is watched.
 *
 * It is not a disabled textarea: a disabled textarea reads as "you could type here,
 * but not yet", and a visitor who clicks it learns nothing. It is a labelled panel
 * that says the typing is part of the demo, and it holds the height of the longest
 * line in the script from the first character on, so the conversation above it does
 * not shuffle upward as a line grows.
 */
function DemoCompose({
  copy,
  beat,
  text,
  full,
  reduceMotion,
}: {
  copy: StoryCopy;
  beat: Beat;
  text: string;
  full: string;
  reduceMotion: boolean;
}) {
  const typing = beat === "typing";
  const pending = beat === "pending";
  return (
    <div className="chat-compose chat-compose-demo" data-beat={beat}>
      <p className="compose-demo">
        <span className="compose-demo-tag">
          {typing ? copy.ui.composeTyping : pending ? copy.ui.composeSending : copy.ui.composeWatch}
        </span>
        <span className="compose-demo-line">
          <span className="compose-demo-ghost" aria-hidden="true">
            {full}
          </span>
          <span className="compose-demo-text">
            {text}
            {(typing || pending) && (
              <i className="compose-caret" data-still={reduceMotion || pending} aria-hidden="true" />
            )}
          </span>
        </span>
      </p>
      <span className="compose-demo-send" data-armed={pending} aria-hidden="true">
        <svg viewBox="0 0 20 20">
          <path d="M10 16.5V4.2m0 0-4.6 4.6M10 4.2l4.6 4.6" />
        </svg>
      </span>
    </div>
  );
}

function StudioSheet({
  title,
  close,
  onClose,
  children,
}: {
  title: string;
  close: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="studio-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-bar">
        <p>{title}</p>
        <button type="button" ref={closeRef} onClick={onClose}>
          {close}
        </button>
      </div>
      <div className="sheet-body">{children}</div>
    </div>
  );
}
