/* The pane beside the conversation, and for most of the story the main screen.
 *
 * The story deliberately leaves the three-column layout behind: the map carries the
 * first two chapters, then the prototype takes the room, and the last chapters are
 * the scope, the handoff and the result. Each pane is a plain function of the scene,
 * so jumping to a chapter cannot land on a pane assembled out of a scene that was
 * abandoned halfway.
 */

import { memo } from "react";

import { ProductCanvas } from "../ProductCanvas";
import { ChangeSheet } from "./ChangeSheet";
import { handoffMarkdown } from "./handoffPackage";
import { buildMap } from "./storyMap";
import { clientItems, confirmedCount, type ProtoState } from "./storyProto";
import type { DirectionId, StoryCopy } from "./storyCopy";
import type { StoryScene } from "./storyScript";
import type { Locale } from "../../siteCopy";

export type StageProps = {
  copy: StoryCopy;
  locale: Locale;
  scene: StoryScene;
  proto: ProtoState;
  /** True while the visitor is exploring rather than watching. */
  interactive: boolean;
  onExplore: () => void;
  direction: DirectionId | null;
  onDirection: (id: DirectionId | null) => void;
  onProtoChange: (next: ProtoState) => void;
  selectedNode: string | null;
  onSelectNode: (id: string | null) => void;
  reduceMotion: boolean;
  onReplay: () => void;
  onSeeOutcome: () => void;
  repoHref: string;
};

export function StoryStage(props: StageProps) {
  const { scene } = props;
  return (
    <section className="story-stage" data-stage={scene.stage} aria-label={stageLabel(props)}>
      {scene.stage === "map" && <MapPane {...props} />}
      {scene.stage === "proto" && <ProtoPane {...props} />}
      {scene.stage === "decide" && <DecidePane {...props} />}
      {scene.stage === "scope" && <ScopePane {...props} />}
      {scene.stage === "handoff" && <HandoffPane {...props} />}
      {scene.stage === "outcome" && <OutcomePane {...props} />}
      {scene.stage === "open" && <OpenPane {...props} />}
      {/* One way in while the walkthrough plays. It belongs to the frame rather than
          to the pane, which scrolls: a control that scrolls out of sight is a control
          a visitor never finds. */}
      {!props.interactive && (scene.stage === "proto" || scene.stage === "outcome") && (
        <button type="button" className="stage-explore" onClick={props.onExplore}>
          <span>{props.copy.proto.exploreCta}</span>
        </button>
      )}
    </section>
  );
}

function stageLabel({ copy, scene }: StageProps): string {
  switch (scene.stage) {
    case "map":
      return copy.ui.mapTitle;
    case "proto":
    case "outcome":
      return copy.proto.kicker;
    case "scope":
      return copy.scope.title;
    case "handoff":
      return copy.handoff.title;
    default:
      return copy.ui.mapTitle;
  }
}

/* ---------------------------------- the map -------------------------------- */

/* Wrapped in `memo` because the demo re-renders on every typing tick, and the board
 * measures its own nodes: remeasuring it two hundred times per run would be the one
 * expensive thing in an otherwise cheap animation. */
const MapBoard = memo(function MapBoard({
  copy,
  scene,
  reduceMotion,
  selectedNode,
  onSelectNode,
  interactive,
}: Pick<StageProps, "copy" | "scene" | "reduceMotion" | "selectedNode" | "onSelectNode" | "interactive">) {
  const view = buildMap(scene.map);
  return (
    <ProductCanvas
      view={view}
      copy={{ nodes: copy.nodes, ui: { selectNode: copy.ui.mapTitle } }}
      dim={scene.map.grown > 2 ? "soft" : "none"}
      selectedNodeId={interactive ? selectedNode : null}
      onSelectNode={interactive ? (node) => onSelectNode(node.id) : undefined}
      reduceMotion={reduceMotion}
    />
  );
});

function MapPane(props: StageProps) {
  const { copy, scene, selectedNode, interactive, onSelectNode } = props;
  const node = interactive && selectedNode ? copy.nodes[buildMap(scene.map).nodes.find((item) => item.id === selectedNode)?.content ?? ""] : null;
  return (
    <div className="stage-map">
      <div className="stage-head">
        <p className="stage-title">{copy.ui.mapTitle}</p>
        <p className="stage-sub">{copy.ui.mapWatch}</p>
      </div>
      <MapBoard {...props} />
      {node && (
        <div className="stage-node">
          {node.caption && <span>{node.caption}</span>}
          <p>{node.text}</p>
          {node.note && <small>{node.note}</small>}
          <button type="button" onClick={() => onSelectNode(null)}>
            {copy.ui.close}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- the prototype ----------------------------- */

function ProtoPane({ copy, proto, interactive, onProtoChange }: StageProps) {
  return (
    <div className="stage-proto">
      <ChangeSheet copy={copy} state={proto} interactive={interactive} onChange={onProtoChange} />
    </div>
  );
}

/* --------------------------------- decisions ------------------------------- */

function DecidePane({ copy, interactive, direction, onDirection, onExplore }: StageProps) {
  const chosen = direction ? copy.decide.options.find((option) => option.id === direction) : null;
  return (
    <div className="stage-decide">
      <p className="stage-title">{copy.decide.lead}</p>
      <div className="decide-grid">
        {copy.decide.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="decide-card"
            data-picked={direction === option.id}
            data-main={option.id === "commit"}
            onClick={() => {
              if (!interactive) onExplore();
              onDirection(option.id);
            }}
          >
            <strong>{option.label}</strong>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      {chosen && (
        <div className="decide-feedback">
          <p className="decide-feedback-title">{copy.decide.feedbackTitle[chosen.id]}</p>
          <ul>
            {copy.decide.feedback[chosen.id].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button type="button" className="decide-back" onClick={() => onDirection(null)}>
            {copy.decide.back}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- scope ---------------------------------- */

function ScopePane({ copy }: StageProps) {
  const scope = copy.scope;
  return (
    <div className="stage-scope">
      <div className="stage-head">
        <p className="stage-title">{scope.title}</p>
        <p className="stage-sub">{scope.lead}</p>
      </div>
      <div className="scope-grid">
        <section className="scope-block" data-tone="do">
          <h4>{scope.doing}</h4>
          <ol>
            {scope.items.map((item) => (
              <li key={item.text}>
                <span>{item.text}</span>
                <small>{item.from}</small>
              </li>
            ))}
          </ol>
        </section>
        <div className="scope-side">
          <section className="scope-block" data-tone="not">
            <h4>{scope.notDoing}</h4>
            <ul>
              {scope.notItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="scope-block" data-tone="done">
            <h4>{scope.done}</h4>
            <ul>
              {scope.doneItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="scope-block" data-tone="open">
            <h4>{scope.open}</h4>
            <ul>
              {scope.openItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- handoff --------------------------------- */

function HandoffPane({ copy, locale, scene }: StageProps) {
  const handoff = copy.handoff;
  const opened = scene.id === "agentTasks";
  return (
    <div className="stage-handoff" data-opened={opened}>
      <div className="stage-head">
        <p className="stage-title">{handoff.title}</p>
        <p className="stage-sub">{handoff.lead}</p>
      </div>
      <div className="transfer-track" aria-hidden="true">
        <span className="transfer-origin">{copy.proto.project}</span>
        <span className="transfer-path"><i /></span>
        <span className="transfer-target">{opened ? "coding agent" : handoff.title}</span>
      </div>
      {!opened && <p className="handoff-choice">“{copy.turns.handoff.user}”</p>}
      <div className="handoff-grid">
        {!opened && <div className="handoff-pack">
          {handoff.blocks.map((block) => (
            <section key={block.label}>
              <h4>{block.label}</h4>
              {block.items.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </section>
          ))}
          <DownloadPackage copy={copy} locale={locale} />
        </div>}
        {opened && <div className="handoff-agent">
          <p className="handoff-agent-title">{handoff.agentTitle}</p>
          <ol>
            {handoff.tasks.map((task) => (
              <li key={task.text}>
                <span>{task.text}</span>
                <small>{task.from}</small>
              </li>
            ))}
          </ol>
          <p className="handoff-agent-note">{handoff.agentNote}</p>
        </div>}
      </div>
    </div>
  );
}

/* The file is built from the same copy the screen is, so what lands in the visitor's
 * downloads folder cannot say something the page never showed. */
function DownloadPackage({ copy, locale }: { copy: StoryCopy; locale: Locale }) {
  const download = () => {
    const blob = new Blob([handoffMarkdown(locale)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `goodidea-handoff-${locale}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="handoff-download">
      <button type="button" onClick={download}>
        {copy.handoff.download}
      </button>
      <small>{copy.handoff.downloadNote}</small>
    </div>
  );
}

/* --------------------------------- outcome --------------------------------- */

function OutcomePane({ copy, proto, interactive, onProtoChange, scene }: StageProps) {
  const { done, total } = confirmedCount(proto);
  const first = clientItems(proto)[0];
  const received = scene.id === "receipt";
  return (
    <div className="stage-outcome" data-received={received}>
      <div className="stage-head">
        <p className="stage-title">{copy.outcome.title}</p>
        <p className="stage-sub">{copy.outcome.note}</p>
      </div>
      <div className="outcome-grid">
        <div className="outcome-phone">
          <p className="outcome-lead">{copy.outcome.phoneLead}</p>
          {interactive ? <ChangeSheet copy={copy} state={proto} interactive onChange={onProtoChange} /> : (
            <div className="result-device">
              <div className="device-speaker" aria-hidden="true" />
              <p className="result-project">{copy.proto.project}</p>
              <p className="result-request">{copy.proto.clientLead}</p>
              <div className="result-item" data-confirmed={first?.status === "confirmed"}>
                <small>01 / {String(total).padStart(2, "0")}</small>
                <strong>{first?.text}</strong>
                <span className="result-confirm">{first?.status === "confirmed" ? "✓ " + copy.proto.confirmed : copy.proto.confirm}</span>
              </div>
              <p className="result-count">{copy.proto.progress.replace("{done}", String(done)).replace("{total}", String(total))}</p>
            </div>
          )}
        </div>
        <div className="result-connection" aria-hidden="true"><i /></div>
        <aside className="outcome-back" data-received={received}>
          <p className="outcome-lead">{copy.outcome.backLead}</p>
          <p className="outcome-line">{first?.text}</p>
          <p className="result-status">{first?.status === "confirmed" ? "✓ " + copy.proto.confirmed : copy.proto.needsReview}</p>
          <p className="outcome-progress">
            {copy.proto.progress.replace("{done}", String(done)).replace("{total}", String(total))}
          </p>
          {received && <p className="outcome-note">{copy.turns.receipt.change}</p>}
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------ what is left open --------------------------- */

function OpenPane({ copy, scene, onReplay, onSeeOutcome, repoHref }: StageProps) {
  if (scene.id === "possibilities") {
    return (
      <div className="stage-open" data-phase="more">
        <p className="stage-title">{copy.open.lead}</p>
        <div className="open-grid">
          {copy.open.items.map((item) => (
            <article key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.text}</span>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="stage-open" data-phase="close">
      <p className="open-question">{copy.open.question}</p>
      <p className="open-question-note">{copy.open.questionNote}</p>
      <div className="open-actions">
        <button type="button" className="open-action primary" onClick={onReplay}>
          {copy.open.replay}
        </button>
        <button type="button" className="open-action" onClick={onSeeOutcome}>
          {copy.open.seeOutcome}
        </button>
        <a className="open-action" href="#brief">
          {copy.open.seeBrief}
        </a>
        <a className="open-action" href={repoHref}>
          {copy.open.repo}
        </a>
      </div>
    </div>
  );
}
