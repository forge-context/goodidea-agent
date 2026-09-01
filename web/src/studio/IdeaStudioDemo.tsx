import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { ProductCanvas } from "./ProductCanvas";
import { studioCopy, type StudioCopy } from "./ideaStudioCopy";
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
  | { id: string; role: "preview"; option: string; branch: BranchId; resolved?: "merged" | "kept" };

type Branch = { id: BranchId; returnStep: StepId; merged: boolean };

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function IdeaStudioDemo({ locale }: { locale: StudioLocale }) {
  const copy = studioCopy[locale];
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
          setBranch({ id: opened, returnStep: from, merged: false });
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
        merged: false,
      });
      setBranchThread([{ id: nextId(), role: "agent", lines: meta.opening }]);
      setAnnouncement(meta.opening.join(" "));
      setStep(branchEntryStep[node.branch]);
      setStage(branchStage[node.branch]);
    },
    [canvas.firstStep, copy, nextId, step],
  );

  const resolvePreview = useCallback(
    (messageId: string, option: string, branchId: BranchId, action: "merged" | "kept") => {
      setBranchThread((prev) =>
        prev.map((message) =>
          message.id === messageId && message.role === "preview" ? { ...message, resolved: action } : message,
        ),
      );
      const meta = copy.branches[branchId];
      if (action === "merged") {
        const variant = option.endsWith("a") ? "a" : "b";
        later(() => {
          setCanvas((prev) =>
            branchId === "people" ? { ...prev, people: variant } : { ...prev, help: variant },
          );
          setHint(copy.hints.updated);
        }, settle);
        setBranch((prev) => (prev ? { ...prev, merged: true } : prev));
        later(() => say(meta.merged, true), beat);
      } else {
        later(() => say(meta.kept, true), beat);
      }
      setStep(null);
    },
    [beat, copy, later, say, settle],
  );

  const leaveBranch = useCallback(() => {
    if (!branch) return;
    const meta = copy.branches[branch.id];
    say(branch.merged ? meta.back : meta.backKept, false);
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
    setAnnouncement(copy.ui.restarted);
  }, [clearTimers, copy, openingThread]);

  const view = useMemo(() => {
    const built = buildCanvas(canvas);
    return branch ? { ...built, focus: branchFocus[branch.id] } : built;
  }, [branch, canvas]);

  const options = step ? steps[step].options : [];
  const messages = branch ? branchThread : thread;
  const dim: "none" | "soft" | "strong" = branch ? "strong" : canvas.grown > 2 ? "soft" : "none";

  // The newest turn is the only one that has to be on screen, and it has to be
  // there before the next click: a smooth scroll that is still travelling reads as
  // a conversation that swallowed the answer.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const frame = window.requestAnimationFrame(() => {
      box.scrollTop = box.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, options, branch]);

  const rail = <StageRail copy={copy} stage={stage} />;
  const canvasPanel = (
    <CanvasPanel copy={copy} view={view} dim={dim} hint={hint} onOpenNode={openNode} reduceMotion={reduceMotion} />
  );
  const canvasSheet = (
    <CanvasPanel
      copy={copy}
      view={view}
      dim={dim}
      hint={hint}
      onOpenNode={openNode}
      reduceMotion={reduceMotion}
      minScale={0.92}
    />
  );
  const crumbs = branch ? copy.branches[branch.id].crumbs : [];

  return (
    <div className="studio" data-branch={branch ? "true" : "false"}>
      <div className="studio-bar">
        <span className="studio-mode">
          <span aria-hidden="true">●</span>
          {copy.ui.fixedNote}
        </span>
        <div className="studio-bar-actions">
          <button type="button" className="studio-tab" onClick={() => setSheet("rail")}>
            {copy.ui.exploreTab}
          </button>
          <button type="button" className="studio-tab" onClick={() => setSheet("map")}>
            {copy.ui.mapTab}
          </button>
          <button type="button" className="studio-restart" onClick={restart}>
            {copy.ui.restart}
          </button>
        </div>
      </div>

      <div className="studio-grid">
        {rail}

        <section className="studio-chat" aria-label={copy.ui.conversationLabel}>
          {branch && (
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

          <div className="chat-scroll" ref={scrollRef}>
            <div className="chat-inner">
              {branch && (
                <p className="branch-context">
                  <span>{copy.ui.branchLead}</span>
                  {copy.nodes[branch.id === "people" ? (canvas.people ? "whoHubMerged" : "whoHub") : "help"].text}
                </p>
              )}

              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <p className="chat-said" key={message.id}>
                      {message.text}
                    </p>
                  );
                }
                if (message.role === "agent") {
                  return (
                    <div className="chat-asked" key={message.id}>
                      {message.lines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  );
                }
                const preview = copy.previews[message.option];
                return (
                  <div className="change-preview" key={message.id}>
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
                        {message.resolved === "merged" ? copy.ui.merged : copy.ui.kept}
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
                          onClick={() => resolvePreview(message.id, message.option, message.branch, "kept")}
                        >
                          {copy.ui.keep}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {options.length > 0 && (
                <div className="chat-options" role="group" aria-label={copy.ui.optionsLabel}>
                  {options.map((option) => (
                    <button type="button" key={option.id} onClick={() => pick(option)}>
                      {copy.options[option.id]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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

function StageRail({ copy, stage }: { copy: StudioCopy; stage: number }) {
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
    </aside>
  );
}

function CanvasPanel({
  copy,
  view,
  dim,
  hint,
  onOpenNode,
  reduceMotion,
  minScale,
}: {
  copy: StudioCopy;
  view: CanvasView;
  dim: "none" | "soft" | "strong";
  hint: string | null;
  onOpenNode: (node: Placement) => void;
  reduceMotion: boolean;
  minScale?: number;
}) {
  return (
    <aside className="studio-canvas" aria-label={copy.ui.canvasLabel}>
      <p className="canvas-title">{copy.ui.canvasTitle}</p>
      <ProductCanvas
        view={view}
        copy={copy}
        dim={dim}
        onOpenNode={onOpenNode}
        reduceMotion={reduceMotion}
        minScale={minScale}
      />
      <p className="canvas-hint" data-shown={hint ? "true" : "false"}>
        {hint}
      </p>
    </aside>
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
