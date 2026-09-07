import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { ProductCanvas } from "../../studio/ProductCanvas";
import {
  autoInitial,
  autoReducer,
  shouldAdvance,
  type AutoAction,
  type Beat,
  type PlayMode,
} from "../../studio/autoDemo";
import {
  beatMs,
  buildScenes,
  chapterEntries,
  demoSeconds,
  longestLine,
  playbackPlan,
  stateAt,
  threadAt,
} from "./legacyScript";
import { studioCopy, type StudioCopy } from "./ideaStudioCopy";
import { siteCopy, withSeconds } from "../../siteCopy";
import { legacyCopy } from "./legacyCopy";
import {
  branchEntryStep,
  branchFocus,
  branchStage,
  buildCanvas,
  initialCanvas,
  steps,
  type BranchId,
  type CanvasVars,
  type CanvasView,
  type OptionDef,
  type Placement,
  type StepId,
  type StudioLocale,
} from "./ideaStudioFlow";

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "agent"; lines: string[] }
  | {
      id: string;
      role: "preview";
      option: string;
      branch: BranchId;
      resolved?: "merged" | "candidate" | "discarded";
    };

type Branch = {
  id: BranchId;
  returnStep: StepId;
  outcome: null | "merged" | "candidate" | "discarded";
};

type PreviewAction = "merged" | "candidate" | "discarded";
type ResolvePreview = (
  messageId: string,
  option: string,
  branchId: BranchId,
  action: PreviewAction,
) => void;

/** A stable empty override map, so the memoised canvas is not redrawn per keystroke. */
const NO_EDITS: Record<string, string> = Object.freeze({});

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function LegacyWalkthrough({ locale }: { locale: StudioLocale }) {
  const copy = studioCopy[locale];
  const site = siteCopy[locale];
  const chapterCopy = legacyCopy[locale].chapters;
  const reduceMotion = useRef(prefersReducedMotion()).current;
  const beat = reduceMotion ? 0 : 240;
  // The canvas moves a beat after the answer lands, so a turn reads as one change
  // rather than two. With reduced motion there is nothing to stagger.
  const settle = reduceMotion ? 0 : beat + 140;

  const seq = useRef(0);
  const nextId = useCallback(() => {
    seq.current += 1;
    return `m${seq.current}`;
  }, []);

  const openingThread = useCallback(
    (): Message[] => [
      { id: nextId(), role: "user", text: copy.idea },
      { id: nextId(), role: "agent", lines: copy.opening },
    ],
    [copy, nextId],
  );

  const [thread, setThread] = useState<Message[]>(openingThread);
  const [branchThread, setBranchThread] = useState<Message[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [step, setStep] = useState<StepId | null>("s0");
  const [stage, setStage] = useState(0);
  const [canvas, setCanvas] = useState<CanvasVars>(initialCanvas);
  const [hint, setHint] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [draft, setDraft] = useState("");
  const [sheet, setSheet] = useState<null | "rail" | "map">(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeEdits, setNodeEdits] = useState<Record<string, string>>({});

  const timers = useRef<number[]>([]);
  const later = useCallback((run: () => void, delay: number) => {
    if (delay === 0) {
      run();
      return;
    }
    timers.current.push(window.setTimeout(run, delay));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(null), 4600);
    return () => window.clearTimeout(timer);
  }, [hint]);

  const say = useCallback(
    (lines: string[], intoBranch: boolean) => {
      const message: Message = { id: nextId(), role: "agent", lines };
      if (intoBranch) setBranchThread((prev) => [...prev, message]);
      else setThread((prev) => [...prev, message]);
      setAnnouncement(lines.join(" "));
    },
    [nextId],
  );

  const pick = useCallback(
    (option: OptionDef, spoken?: string) => {
      const inBranch = branch !== null;
      const said: Message = { id: nextId(), role: "user", text: spoken ?? copy.options[option.id] };
      if (inBranch) setBranchThread((prev) => [...prev, said]);
      else setThread((prev) => [...prev, said]);

      if (option.preview && branch) {
        const previewBranch = branch.id;
        later(
          () =>
            setBranchThread((prev) => [
              ...prev,
              { id: nextId(), role: "preview", option: option.id, branch: previewBranch },
            ]),
          beat + 60,
        );
      } else if (option.branch) {
        const opened = option.branch;
        const meta = copy.branches[opened];
        const from = step ?? "s5";
        later(() => {
          setBranch({ id: opened, returnStep: from, outcome: null });
          setBranchThread([{ id: nextId(), role: "agent", lines: meta.opening }]);
          setAnnouncement(meta.opening.join(" "));
        }, beat);
      } else {
        const reply = copy.replies[option.id];
        if (reply) later(() => say(reply, inBranch), beat);
      }

      if (option.canvas) {
        const change = option.canvas;
        const shown = option.hint ? copy.hints[option.hint] : null;
        later(() => {
          setCanvas((prev) => ({ ...prev, ...change }));
          if (shown) {
            setHint(shown);
            setAnnouncement(shown);
          }
        }, settle);
      }

      if (typeof option.stage === "number") setStage(option.stage);
      setStep(option.next);
    },
    [beat, branch, copy, later, nextId, say, settle, step],
  );

  const openNode = useCallback(
    (node: Placement) => {
      if (!node.branch) return;
      const meta = copy.branches[node.branch];
      setSheet(null);
      setBranch({
        id: node.branch,
        returnStep: step && step !== "bp0" && step !== "bh0" ? step : canvas.firstStep ? "s6" : "s5",
        outcome: null,
      });
      setBranchThread([{ id: nextId(), role: "agent", lines: meta.opening }]);
      setAnnouncement(meta.opening.join(" "));
      setStep(branchEntryStep[node.branch]);
      setStage(branchStage[node.branch]);
    },
    [canvas.firstStep, copy, nextId, step],
  );

  const resolvePreview = useCallback(
    (
      messageId: string,
      option: string,
      branchId: BranchId,
      action: PreviewAction,
    ) => {
      setBranchThread((prev) =>
        prev.map((message) =>
          message.id === messageId && message.role === "preview" ? { ...message, resolved: action } : message,
        ),
      );
      const meta = copy.branches[branchId];
      const variant = option.endsWith("a") ? "a" : "b";
      if (action === "merged") {
        later(() => {
          setCanvas((prev) =>
            branchId === "people"
              ? { ...prev, people: variant, peopleCandidate: null }
              : { ...prev, help: variant, helpCandidate: null },
          );
          setHint(copy.hints.updated);
        }, settle);
        setBranch((prev) => (prev ? { ...prev, outcome: "merged" } : prev));
        later(() => say(meta.merged, true), beat);
      } else if (action === "candidate") {
        later(() => {
          setCanvas((prev) =>
            branchId === "people"
              ? { ...prev, peopleCandidate: variant }
              : { ...prev, helpCandidate: variant },
          );
          setHint(copy.hints.candidate);
        }, settle);
        setBranch((prev) => (prev ? { ...prev, outcome: "candidate" } : prev));
        later(() => say(meta.candidate, true), beat);
      } else {
        setBranch((prev) => (prev ? { ...prev, outcome: "discarded" } : prev));
        later(() => say(meta.discarded, true), beat);
      }
      setStep(null);
    },
    [beat, copy, later, say, settle],
  );

  const leaveBranch = useCallback(() => {
    if (!branch) return;
    const meta = copy.branches[branch.id];
    say(
      branch.outcome === "merged"
        ? meta.back
        : branch.outcome === "candidate"
          ? meta.backCandidate
          : meta.backKept,
      false,
    );
    setBranch(null);
    setBranchThread([]);
    setStep(branch.returnStep);
    setStage(steps[branch.returnStep].stage);
  }, [branch, copy, say]);

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    const current = step ? steps[step] : null;
    if (current && current.options.length > 0) {
      pick(current.options[0], text);
      return;
    }
    const said: Message = { id: nextId(), role: "user", text };
    const closing = branch ? copy.branches[branch.id].more : copy.closing;
    if (branch) setBranchThread((prev) => [...prev, said]);
    else setThread((prev) => [...prev, said]);
    later(() => say(closing, branch !== null), beat);
  }, [beat, branch, copy, draft, later, nextId, pick, say, step]);

  const restart = useCallback(() => {
    clearTimers();
    setThread(openingThread());
    setBranchThread([]);
    setBranch(null);
    setStep("s0");
    setStage(0);
    setCanvas(initialCanvas);
    setHint(null);
    setDraft("");
    setSheet(null);
    setSelectedNodeId(null);
    setNodeEdits({});
    setAnnouncement(copy.ui.restarted);
  }, [clearTimers, copy, openingThread]);

  const selectNode = useCallback((node: Placement) => {
    setSelectedNodeId((current) => (current === node.id ? null : node.id));
  }, []);

  const discussNode = useCallback(
    (node: Placement) => {
      const text = nodeEdits[node.id] ?? copy.nodes[node.content].text;
      const said: Message = {
        id: nextId(),
        role: "user",
        text: copy.ui.discussUser.replace("{node}", text),
      };
      const response = copy.ui.discussReply.map((line) => line.replace("{node}", text));
      if (branch) setBranchThread((prev) => [...prev, said]);
      else setThread((prev) => [...prev, said]);
      later(() => say(response, branch !== null), beat);
      setSelectedNodeId(null);
      setSheet(null);
    },
    [beat, branch, copy, later, nextId, nodeEdits, say],
  );

  const saveNodeEdit = useCallback(
    (node: Placement, text: string) => {
      const cleaned = text.trim();
      if (!cleaned) return;
      setNodeEdits((prev) => ({ ...prev, [node.id]: cleaned }));
      setHint(copy.hints.edited);
      setAnnouncement(copy.hints.edited);
    },
    [copy],
  );

  /* ------------------------------- watch mode ------------------------------ */

  const scenes = useMemo(() => buildScenes(locale), [locale]);
  const plan = useMemo(() => playbackPlan(scenes, locale), [locale, scenes]);
  const chapters = useMemo(() => chapterEntries(scenes), [scenes]);
  const seconds = useMemo(() => demoSeconds(locale), [locale]);
  const [mode, setMode] = useState<PlayMode>("intro");
  const [auto, setAuto] = useState(autoInitial);
  const [visible, setVisible] = useState(true);
  const watching = mode !== "manual";

  const dispatchAuto = useCallback(
    (action: AutoAction) => setAuto((state) => autoReducer(state, action, plan)),
    [plan],
  );

  // A visitor who leaves the tab should come back to the scene they left, not to a
  // walkthrough that finished without them. `playing` is untouched, so returning
  // resumes on its own.
  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // Exactly one timeout exists at a time: the effect owns it and clears it on every
  // change, so pausing, seeking, switching mode or unmounting can never leave a
  // second one running against the same scene.
  useEffect(() => {
    if (!shouldAdvance(auto, { mode, visible, reduceMotion })) return;
    const timer = window.setTimeout(
      () => dispatchAuto({ type: "advance" }),
      beatMs(auto, scenes[auto.index]),
    );
    return () => window.clearTimeout(timer);
  }, [auto, dispatchAuto, mode, reduceMotion, scenes, visible]);

  /* Watching is driven entirely by the scene index and the beat inside it, so it
   * never writes into the hand-driven state below it, and the simulated draft never
   * reaches the field the visitor types into. Switching back returns them to their
   * own turns. Before playback starts, scene 0 is shown whole: that is the
   * conversation a visitor arrives on. */
  const playIndex = mode === "auto" ? auto.index : 0;
  const playBeat: Beat = mode === "auto" ? auto.beat : "reply";
  const chapterNow = scenes[playIndex].chapter;
  // What the map and the rail show belongs to the last answer, not to the line being
  // typed against it.
  const scene = stateAt(scenes, playIndex, playBeat);
  const watchMessages = useMemo(
    (): Message[] =>
      threadAt(scenes, playIndex, playBeat).map((message, index) =>
        message.role === "user"
          ? { id: `w${index}`, role: "user", text: message.text }
          : { id: `w${index}`, role: "agent", lines: message.lines },
      ),
    [playBeat, playIndex, scenes],
  );
  /* The line the demo is typing, cut on visible characters so a Chinese glyph or an
   * emoji is never split in half. Only the visitor's turns are typed; answers land
   * whole, because a walkthrough that types both halves of a conversation is a
   * walkthrough nobody finishes. */
  const typedLine = useMemo(() => {
    if (mode !== "auto" || (auto.beat !== "typing" && auto.beat !== "pending")) return "";
    return scenes[auto.index].typed.slice(0, auto.typed).join("");
  }, [auto.beat, auto.index, auto.typed, mode, scenes]);
  // Not this scene's line but the longest one in the script: the field is as tall as
  // it will ever need to be from the first frame, so playback moves nothing but text.
  const reserved = useMemo(() => longestLine(scenes), [scenes]);

  useEffect(() => {
    if (mode !== "auto") return;
    const entry = chapterCopy[chapterNow];
    setAnnouncement(`${entry.label} — ${entry.point}`);
  }, [chapterNow, mode, site]);

  /* Coming back from the hand-driven walkthrough resumes the scene playback was left
   * on. Only the play control starts it over, so the switch is never a hidden reset. */
  const started = auto.index > 0 || auto.playing || auto.finished;
  const backToWatching = useCallback(() => {
    setSheet(null);
    setSelectedNodeId(null);
    setMode(started ? "auto" : "intro");
  }, [started]);

  const startWatching = useCallback(() => {
    setSheet(null);
    setSelectedNodeId(null);
    setMode("auto");
    // With reduced motion nothing advances on a timer, so playback opens on the first
    // scene with the step controls instead of a play state that never moves.
    dispatchAuto(reduceMotion ? { type: "seek", index: 0, whole: true } : { type: "play" });
  }, [dispatchAuto, reduceMotion]);

  const replayWatching = useCallback(() => {
    setSheet(null);
    setSelectedNodeId(null);
    setMode("auto");
    dispatchAuto(reduceMotion ? { type: "seek", index: 0, whole: true } : { type: "replay" });
  }, [dispatchAuto, reduceMotion]);

  /* Replaying resets the walkthrough only. The hand-driven walkthrough is restarted
   * by its own button, because a visitor's own choices are not ours to clear. */
  const startManual = useCallback(() => {
    setSheet(null);
    setSelectedNodeId(null);
    dispatchAuto({ type: "pause" });
    setMode("manual");
  }, [dispatchAuto]);

  /* --------------------------------- view ---------------------------------- */

  const shownCanvas = watching ? scene.canvas : canvas;
  const shownStage = watching ? scene.stage : stage;
  const view = useMemo(() => {
    const built = buildCanvas(shownCanvas);
    return !watching && branch ? { ...built, focus: branchFocus[branch.id] } : built;
  }, [branch, shownCanvas, watching]);

  const options = !watching && step ? steps[step].options : [];
  const messages = watching ? watchMessages : branch ? branchThread : thread;
  const archivedMessages =
    !branch && messages.length > 6 ? messages.slice(0, watching ? -6 : -4) : [];
  const activeMessages = archivedMessages.length > 0 ? messages.slice(archivedMessages.length) : messages;
  const dim: "none" | "soft" | "strong" =
    !watching && branch ? "strong" : shownCanvas.grown > 2 ? "soft" : "none";

  // The newest turn is the only one that has to be on screen, and it has to be
  // there before the next click: a smooth scroll that is still travelling reads as
  // a conversation that swallowed the answer. This moves the demo's own box, never
  // the page, so a visitor reading further down is not dragged along.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const frame = window.requestAnimationFrame(() => {
      box.scrollTop = box.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, options, branch]);

  const openLoops = view.nodes.filter(
    (node) => node.status === "candidate" || node.status === "unverified",
  ).length;
  const rail = <StageRail copy={copy} stage={shownStage} openLoops={openLoops} />;
  const canvasProps = {
    copy,
    view,
    dim,
    hint: watching ? null : hint,
    selectedNodeId: watching ? null : selectedNodeId,
    // The walkthrough shows its own script. A card the visitor rewrote by hand is
    // theirs and stays in their walkthrough; it must not turn up in the fixed one.
    nodeEdits: watching ? NO_EDITS : nodeEdits,
    onSelectNode: selectNode,
    onDiscussNode: discussNode,
    onEditNode: saveNodeEdit,
    onOpenNode: branch ? undefined : openNode,
    reduceMotion,
    // While watching, the map is something to read rather than something to poke:
    // acting on a card would write into the walkthrough the visitor has not started.
    interactive: !watching,
  };
  const canvasPanel = <CanvasPanel {...canvasProps} />;
  const canvasSheet = <CanvasPanel {...canvasProps} minScale={0.92} />;
  const crumbs = !watching && branch ? copy.branches[branch.id].crumbs : [];
  const status = auto.finished
    ? site.demo.finished
    : auto.playing && !reduceMotion
      ? site.demo.playing
      : site.demo.paused;

  return (
    <div className="studio" data-branch={!watching && branch ? "true" : "false"} data-mode={mode}>
      <div className="studio-bar">
        <span className="studio-mode">
          <span aria-hidden="true">●</span>
          {copy.ui.fixedNote}
        </span>
        <div className="studio-bar-actions">
          <div className="demo-modes" role="group" aria-label={site.demo.modeLabel}>
            <button
              type="button"
              data-active={watching}
              aria-pressed={watching}
              onClick={backToWatching}
            >
              {site.demo.modeWatch}
            </button>
            <button
              type="button"
              data-active={mode === "manual"}
              aria-pressed={mode === "manual"}
              onClick={startManual}
            >
              {site.demo.modeTry}
            </button>
          </div>
          <button type="button" className="studio-tab" onClick={() => setSheet("rail")}>
            {copy.ui.exploreTab}
          </button>
          <button type="button" className="studio-tab" onClick={() => setSheet("map")}>
            {copy.ui.mapTab}
          </button>
        </div>
      </div>

      {/* The transport keeps one position across every playback state, so pausing
          never moves the button out from under the pointer. */}
      <div className="demo-transport">
        {watching ? (
          <>
            <div className="transport-controls">
              {reduceMotion ? (
                <>
                  {/* Nothing advances on a timer here, so the walkthrough becomes a set
                      of steps the visitor moves through — same scenes, same order. */}
                  {mode === "auto" && (
                    <button
                      type="button"
                      className="transport-step"
                      onClick={() => dispatchAuto({ type: "step", by: -1 })}
                      disabled={auto.index === 0}
                    >
                      {site.demo.prevStep}
                    </button>
                  )}
                  {/* At the end there is no next step, so the same button becomes the
                      way back to step one rather than a dead control with no replay
                      beside it. */}
                  <button
                    type="button"
                    className="transport-play"
                    onClick={
                      mode !== "auto"
                        ? startWatching
                        : auto.finished
                          ? replayWatching
                          : () => dispatchAuto({ type: "step", by: 1 })
                    }
                  >
                    {mode !== "auto"
                      ? site.demo.watch
                      : auto.finished
                        ? site.demo.restartSteps
                        : site.demo.nextStep}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="transport-play"
                  onClick={mode === "auto" ? () => dispatchAuto({ type: "toggle" }) : startWatching}
                >
                  <PlayIcon paused={!auto.playing || mode !== "auto"} />
                  {mode !== "auto"
                    ? site.demo.play
                    : auto.finished
                      ? site.demo.replay
                      : auto.playing
                        ? site.demo.pause
                        : site.demo.resume}
                </button>
              )}
              {/* Replay only exists once there is something to replay, and disappears
                  again at the end, where the play button is already the replay. */}
              {mode === "auto" && !auto.finished && (
                <button
                  type="button"
                  className="transport-step"
                  onClick={replayWatching}
                  disabled={auto.index === 0 && !auto.playing}
                >
                  {reduceMotion ? site.demo.restartSteps : site.demo.replay}
                </button>
              )}
              <span className="transport-status" data-state={mode === "auto" ? status : "idle"}>
                {mode === "auto"
                  ? `${status} · ${site.demo.stepOf
                      .replace("{current}", String(auto.index + 1))
                      .replace("{total}", String(scenes.length))}`
                  : withSeconds(site.demo.lengthNote, seconds)}
              </span>
            </div>
            <ol className="transport-chapters" aria-label={site.demo.stageLabel}>
              {chapterCopy.map((chapter, index) => (
                <li key={chapter.label}>
                  <button
                    type="button"
                    data-state={
                      mode !== "auto"
                        ? "ahead"
                        : chapterNow === index
                          ? "now"
                          : chapterNow > index
                            ? "past"
                            : "ahead"
                    }
                    aria-current={mode === "auto" && chapterNow === index ? "step" : undefined}
                    onClick={() => {
                      setSheet(null);
                      setSelectedNodeId(null);
                      setMode("auto");
                      // The one timeout is re-armed from the state this produces, so
                      // nothing from the scene being left can still land afterwards.
                      dispatchAuto({ type: "seek", index: chapters[index], whole: reduceMotion });
                    }}
                  >
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {chapter.label}
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="transport-controls">
            <button type="button" className="transport-step" onClick={restart}>
              {copy.ui.restart}
            </button>
            <span className="transport-status" data-state="idle">
              {copy.ui.replyGuide} · {copy.stages[shownStage].label}
            </span>
          </div>
        )}
      </div>

      <div className="studio-grid">
        {rail}

        <section className="studio-chat" aria-label={copy.ui.conversationLabel}>
          {!watching && branch && (
            <div className="branch-bar">
              <p className="branch-crumbs">
                {crumbs.map((crumb, index) => (
                  <span key={crumb} className={index === crumbs.length - 1 ? "now" : ""}>
                    {index > 0 && <span aria-hidden="true"> / </span>}
                    {crumb}
                  </span>
                ))}
              </p>
              <button type="button" className="branch-back" onClick={leaveBranch}>
                {copy.ui.back}
              </button>
            </div>
          )}

          {mode === "auto" && (
            <p className="scene-point">
              <span>{chapterCopy[chapterNow].label}</span>
              {chapterCopy[chapterNow].point}
            </p>
          )}

          <div className="chat-scroll" ref={scrollRef}>
            <div className="chat-inner">
              {!watching && branch && (
                <p className="branch-context">
                  <span>{copy.ui.branchLead}</span>
                  {copy.nodes[branch.id === "people" ? (canvas.people ? "whoHubMerged" : "whoHub") : "help"].text}
                </p>
              )}

              {archivedMessages.length > 0 && (
                <details className="chat-history">
                  <summary>
                    {copy.ui.earlierTurns.replace("{count}", String(archivedMessages.length))}
                  </summary>
                  <div className="chat-history-list">
                    {archivedMessages.map((message) => (
                      <ConversationMessage
                        key={message.id}
                        message={message}
                        copy={copy}
                        resolvePreview={resolvePreview}
                      />
                    ))}
                  </div>
                </details>
              )}

              {activeMessages.map((message) => (
                <ConversationMessage
                  key={message.id}
                  message={message}
                  copy={copy}
                  resolvePreview={resolvePreview}
                />
              ))}
            </div>
          </div>

          <div className="chat-dock">
            {mode === "intro" && (
              <div className="demo-start">
                <h3>{site.demo.startTitle}</h3>
                <p>{withSeconds(site.demo.startText, seconds)}</p>
                <div className="demo-start-actions">
                  <button type="button" className="demo-cta" onClick={startWatching}>
                    {reduceMotion ? site.demo.nextStep : site.demo.watch}
                  </button>
                  <button type="button" className="demo-cta quiet" onClick={startManual}>
                    {site.demo.tryIt}
                  </button>
                </div>
              </div>
            )}

            {mode === "auto" && auto.finished && (
              <div className="demo-start demo-done">
                <h3>{site.demo.finishedTitle}</h3>
                <p>{site.demo.finishedText}</p>
                <div className="demo-start-actions">
                  <button type="button" className="demo-cta" onClick={startManual}>
                    {site.demo.finishedTry}
                  </button>
                  <a className="demo-cta quiet" href="#brief">
                    {site.demo.finishedBrief}
                  </a>
                </div>
              </div>
            )}

            {!watching && options.length > 0 && (
              <div className="prompt-tray">
                <p>{copy.ui.replyGuide}</p>
                <div className="chat-options" role="group" aria-label={copy.ui.optionsLabel}>
                  {options.map((option) => (
                    <button type="button" key={option.id} onClick={() => pick(option)}>
                      {copy.options[option.id]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Watching gets the same dock in the same place, but as a screen the
                demo types into: a field nobody can put a cursor in, saying so. */}
            {watching && (
              <DemoCompose
                copy={copy}
                beat={mode === "auto" ? auto.beat : "reply"}
                text={typedLine}
                full={reserved}
                reduceMotion={reduceMotion}
              />
            )}
            {!watching && (
              <form
                className="chat-compose"
                onSubmit={(event) => {
                  event.preventDefault();
                  send();
                }}
              >
                <textarea
                  value={draft}
                  rows={1}
                  placeholder={copy.ui.placeholder}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                />
                <button type="submit" disabled={draft.trim().length === 0} aria-label={copy.ui.send}>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M10 16.5V4.2m0 0-4.6 4.6M10 4.2l4.6 4.6" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </section>

        {canvasPanel}
      </div>

      {sheet && (
        <StudioSheet
          title={sheet === "rail" ? copy.ui.railTitle : copy.ui.canvasTitle}
          close={copy.ui.close}
          onClose={() => setSheet(null)}
        >
          {sheet === "rail" ? rail : canvasSheet}
        </StudioSheet>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
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
 * that says the typing is part of the demo, and it holds the height of the finished
 * line from the first character on, so the conversation above it does not shuffle
 * upward as the line grows.
 */
function DemoCompose({
  copy,
  beat,
  text,
  full,
  reduceMotion,
}: {
  copy: StudioCopy;
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
          {/* Reserves the height the finished line will need, so the box changes size
              once per turn — while it is empty — instead of on every character. */}
          <span className="compose-demo-ghost" aria-hidden="true">
            {full || copy.ui.placeholder}
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

function ConversationMessage({
  message,
  copy,
  resolvePreview,
}: {
  message: Message;
  copy: StudioCopy;
  resolvePreview: ResolvePreview;
}) {
  if (message.role === "user") {
    return <p className="chat-said">{message.text}</p>;
  }
  if (message.role === "agent") {
    return (
      <div className="chat-asked">
        {message.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    );
  }

  const preview = copy.previews[message.option];
  return (
    <div className="change-preview">
      <p className="change-lead">{copy.ui.previewLead}</p>
      <dl>
        <div>
          <dt>{copy.ui.previewChanged}</dt>
          <dd>{preview.changed}</dd>
        </div>
        <div>
          <dt>{copy.ui.previewAdded}</dt>
          <dd>{preview.added}</dd>
        </div>
        <div className="open">
          <dt>{copy.ui.previewOpen}</dt>
          <dd>{preview.open}</dd>
        </div>
      </dl>
      {message.resolved ? (
        <p className="change-done">
          {message.resolved === "merged"
            ? copy.ui.merged
            : message.resolved === "candidate"
              ? copy.ui.candidateKept
              : copy.ui.discarded}
        </p>
      ) : (
        <div className="change-actions">
          <button
            type="button"
            className="primary"
            onClick={() => resolvePreview(message.id, message.option, message.branch, "merged")}
          >
            {copy.ui.merge}
          </button>
          <button
            type="button"
            onClick={() => resolvePreview(message.id, message.option, message.branch, "candidate")}
          >
            {copy.ui.keepCandidate}
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() => resolvePreview(message.id, message.option, message.branch, "discarded")}
          >
            {copy.ui.discard}
          </button>
        </div>
      )}
    </div>
  );
}

function StageRail({ copy, stage, openLoops }: { copy: StudioCopy; stage: number; openLoops: number }) {
  return (
    <aside className="studio-rail" aria-label={copy.ui.statusLabel}>
      <p className="rail-title">{copy.ui.railTitle}</p>
      <ol>
        {copy.stages.map((item, index) => (
          <li key={item.id} className={index === stage ? "now" : index < stage ? "past" : ""}>
            <span className="rail-index">{item.id}</span>
            <span className="rail-label">{item.label}</span>
            {index === stage && <span className="rail-hint">{item.hint}</span>}
          </li>
        ))}
      </ol>
      <div className="rail-summary">
        <p>{copy.ui.currentFocus}</p>
        <strong>{copy.stages[stage].label}</strong>
        <span>{copy.stages[stage].hint}</span>
        <div>
          <span>{copy.ui.openLoops}</span>
          <b>{openLoops}</b>
        </div>
      </div>
    </aside>
  );
}

/* Wrapped in `memo` because the demo re-renders on every typing tick: the board
 * measures its own nodes, and remeasuring it 200 times per run would be the one
 * expensive thing in an otherwise cheap animation. */
const CanvasPanel = memo(function CanvasPanel({
  copy,
  view,
  dim,
  hint,
  selectedNodeId,
  nodeEdits,
  onSelectNode,
  onDiscussNode,
  onEditNode,
  onOpenNode,
  reduceMotion,
  minScale,
  interactive = true,
}: {
  copy: StudioCopy;
  view: CanvasView;
  dim: "none" | "soft" | "strong";
  hint: string | null;
  selectedNodeId: string | null;
  nodeEdits: Record<string, string>;
  onSelectNode: (node: Placement) => void;
  onDiscussNode: (node: Placement) => void;
  onEditNode: (node: Placement, text: string) => void;
  onOpenNode?: (node: Placement) => void;
  reduceMotion: boolean;
  minScale?: number;
  /** While the walkthrough is being watched the map is read-only. */
  interactive?: boolean;
}) {
  const selectedNode = interactive ? view.nodes.find((node) => node.id === selectedNodeId) ?? null : null;

  return (
    <aside className="studio-canvas" aria-label={copy.ui.canvasLabel}>
      <div className="canvas-heading">
        <p className="canvas-title">{copy.ui.canvasTitle}</p>
        <p>{interactive ? copy.ui.canvasGuide : copy.ui.canvasWatch}</p>
      </div>
      <ProductCanvas
        view={view}
        copy={copy}
        dim={dim}
        selectedNodeId={interactive ? selectedNodeId : null}
        onSelectNode={interactive ? onSelectNode : undefined}
        textOverrides={nodeEdits}
        reduceMotion={reduceMotion}
        minScale={minScale}
      />
      {selectedNode && (
        <NodeInspector
          key={selectedNode.id}
          node={selectedNode}
          text={nodeEdits[selectedNode.id] ?? copy.nodes[selectedNode.content].text}
          copy={copy}
          onClose={() => onSelectNode(selectedNode)}
          onDiscuss={() => onDiscussNode(selectedNode)}
          onSave={(text) => onEditNode(selectedNode, text)}
          onOpen={selectedNode.branch && onOpenNode ? () => onOpenNode(selectedNode) : undefined}
        />
      )}
      <p className="canvas-hint" data-shown={hint ? "true" : "false"}>
        {hint}
      </p>
    </aside>
  );
});

function NodeInspector({
  node,
  text,
  copy,
  onClose,
  onDiscuss,
  onSave,
  onOpen,
}: {
  node: Placement;
  text: string;
  copy: StudioCopy;
  onClose: () => void;
  onDiscuss: () => void;
  onSave: (text: string) => void;
  onOpen?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);

  return (
    <section className="node-inspector" aria-label={copy.ui.selectedNode}>
      <div className="node-inspector-title">
        <span>{copy.ui.status[node.status]}</span>
        <button type="button" onClick={onClose} aria-label={copy.ui.close}>
          ×
        </button>
      </div>
      {editing ? (
        <form
          className="node-edit"
          onSubmit={(event) => {
            event.preventDefault();
            if (!value.trim()) return;
            onSave(value);
            setEditing(false);
          }}
        >
          <input value={value} onChange={(event) => setValue(event.target.value)} autoFocus />
          <button type="submit">{copy.ui.saveEdit}</button>
          <button type="button" onClick={() => setEditing(false)}>
            {copy.ui.cancelEdit}
          </button>
        </form>
      ) : (
        <>
          <p>{text}</p>
          <div className="node-actions">
            <button type="button" onClick={onDiscuss}>
              {copy.ui.continueDiscuss}
            </button>
            <button type="button" onClick={() => setEditing(true)}>
              {copy.ui.editNode}
            </button>
            {onOpen && (
              <button type="button" className="deep" onClick={onOpen}>
                {copy.ui.openNode} <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>
        </>
      )}
    </section>
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
