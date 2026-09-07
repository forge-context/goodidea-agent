/* The concept prototype the walkthrough builds towards: one change list, two sides.
 *
 * The same component draws the scripted screens and the one a visitor drives by
 * hand; `interactive` is the only difference. While the walkthrough is playing it is
 * a picture with no controls in the tab order, so a visitor cannot half-edit a screen
 * the script is about to replace — the way in is the explore button on top of it.
 */

import type { StoryCopy } from "./storyCopy";
import {
  clientItems,
  confirmedCount,
  splitMessages,
  type ProtoItemState,
  type ProtoState,
} from "./storyProto";

type Props = {
  copy: StoryCopy;
  state: ProtoState;
  interactive: boolean;
  onChange?: (next: ProtoState) => void;
};

export function ChangeSheet({ copy, state, interactive, onChange }: Props) {
  const proto = copy.proto;
  const set = (patch: Partial<ProtoState>) => onChange?.({ ...state, ...patch });
  const patchItem = (id: string, patch: Partial<ProtoItemState>) =>
    set({ items: state.items.map((item) => {
      if (item.id !== id) return item;
      const changed = patch.text !== undefined && patch.text !== item.text;
      return { ...item, ...patch, ...(changed ? { status: "new" as const } : {}) };
    }) });

  return (
    <div className="proto" data-view={state.view} data-live={interactive ? "true" : "false"}>
      <div className="proto-bar">
        <span className="proto-kicker">{proto.kicker}</span>
        <span className="proto-project">{proto.project}</span>
        <span className="proto-side">{state.view === "designer" ? proto.designerView : proto.clientView}</span>
      </div>

      {state.view === "designer" ? (
        <DesignerSide
          copy={copy}
          state={state}
          interactive={interactive}
          set={set}
          patchItem={patchItem}
        />
      ) : (
        <ClientSide
          copy={copy}
          state={state}
          interactive={interactive}
          set={set}
          patchItem={patchItem}
        />
      )}

      <p className="proto-note">{interactive ? proto.exploreNote : proto.note}</p>
    </div>
  );
}

function DesignerSide({
  copy,
  state,
  interactive,
  set,
  patchItem,
}: {
  copy: StoryCopy;
  state: ProtoState;
  interactive: boolean;
  set: (patch: Partial<ProtoState>) => void;
  patchItem: (id: string, patch: Partial<ProtoItemState>) => void;
}) {
  const proto = copy.proto;
  const first = copy.proto.items[0];
  return (
    <div className="proto-body">
      <section className="proto-raw" aria-label={proto.rawLabel}>
        <p className="proto-label">{proto.rawLabel}</p>
        {interactive ? (
          <textarea
            className="proto-raw-field"
            value={state.raw}
            placeholder={proto.rawPlaceholder}
            onChange={(event) => set({ raw: event.target.value })}
          />
        ) : (
          <p className="proto-raw-text">{state.raw || proto.rawPlaceholder}</p>
        )}
        <div className="proto-raw-actions">
          {interactive ? (
            <button
              type="button"
              className="proto-split"
              disabled={state.raw.trim().length === 0}
              onClick={() =>
                set({
                  items: splitMessages(state.raw, first.at),
                  openId: null,
                  sent: false,
                })
              }
            >
              {proto.splitAction}
            </button>
          ) : (
            <span className="proto-split is-still">{proto.splitAction}</span>
          )}
          <span className="proto-split-note">{proto.splitNote}</span>
        </div>
      </section>

      <section className="proto-items" aria-label={proto.itemsLabel}>
        <p className="proto-label">{proto.itemsLabel}</p>
        {state.items.length === 0 ? (
          <p className="proto-empty">{proto.empty}</p>
        ) : (
          <ul>
            {state.items.map((item) => (
              <li key={item.id} className="proto-item" data-status={item.status}>
                <div className="proto-item-head">
                  {interactive ? (
                    <input
                      className="proto-item-text"
                      aria-label={proto.itemText}
                      value={item.text}
                      onChange={(event) => patchItem(item.id, { text: event.target.value })}
                    />
                  ) : (
                    <span className="proto-item-text">{item.text}</span>
                  )}
                  <span className="proto-status" data-status={item.status}>
                    {item.status === "confirmed"
                      ? proto.confirmed
                      : item.status === "rejected"
                        ? proto.rejected
                        : item.status === "new" ? proto.needsReview : item.at}
                  </span>
                </div>

                <div className="proto-item-actions">
                  <label className="proto-check">
                    <input
                      type="checkbox"
                      checked={item.needsClient}
                      disabled={!interactive}
                      onChange={(event) => patchItem(item.id, { needsClient: event.target.checked })}
                    />
                    <span>{proto.needsClient}</span>
                  </label>
                  {interactive ? (
                    <button
                      type="button"
                      className="proto-quote-toggle"
                      aria-expanded={state.openId === item.id}
                      onClick={() => set({ openId: state.openId === item.id ? null : item.id })}
                    >
                      {proto.quoteLabel}
                    </button>
                  ) : (
                    <span className="proto-quote-toggle is-still">{proto.quoteLabel}</span>
                  )}
                </div>

                {state.openId === item.id && (
                  <div className="proto-quote">
                    <p className="proto-quote-text">{item.quote}</p>
                    <p className="proto-quote-meta">{item.at}</p>
                    {item.note && (
                      <p className="proto-quote-note">
                        <span>{proto.noteLabel}</span>
                        {item.note}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="proto-foot">
        {interactive ? (
          <button
            type="button"
            className="proto-send"
            disabled={state.items.every((item) => !item.needsClient)}
            onClick={() => set({ view: "client", sent: true, openId: null })}
          >
            {proto.send}
          </button>
        ) : (
          <span className="proto-send is-still">{proto.send}</span>
        )}
        {state.sent && <span className="proto-sent">{proto.sent}</span>}
      </div>
    </div>
  );
}

function ClientSide({
  copy,
  state,
  interactive,
  set,
  patchItem,
}: {
  copy: StoryCopy;
  state: ProtoState;
  interactive: boolean;
  set: (patch: Partial<ProtoState>) => void;
  patchItem: (id: string, patch: Partial<ProtoItemState>) => void;
}) {
  const proto = copy.proto;
  const shown = clientItems(state);
  const { done, total } = confirmedCount(state);
  const body = (
    <div className="proto-client">
      <div className="proto-client-head">
        <p className="proto-client-lead">{proto.clientLead}</p>
        <p className="proto-progress">
          {proto.progress.replace("{done}", String(done)).replace("{total}", String(total))}
        </p>
      </div>

      <ul className="proto-client-list">
        {shown.map((item) => (
          <li key={item.id} className="proto-item" data-status={item.status}>
            <p className="proto-item-text">{item.text}</p>
            {!state.clientOnly && (
              <>
                <p className="proto-quote-text">{item.quote}</p>
                <p className="proto-quote-meta">{item.at}</p>
              </>
            )}
            {item.status === "confirmed" || item.status === "rejected" ? (
              <p className="proto-decided" data-status={item.status}>
                {item.status === "confirmed" ? proto.confirmed : proto.rejected}
              </p>
            ) : (
              <div className="proto-client-actions">
                {interactive ? (
                  <>
                    <button
                      type="button"
                      className="proto-confirm"
                      onClick={() => patchItem(item.id, { status: "confirmed" })}
                    >
                      {proto.confirm}
                    </button>
                    <button
                      type="button"
                      className="proto-reject"
                      onClick={() => patchItem(item.id, { status: "rejected" })}
                    >
                      {proto.reject}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="proto-confirm is-still">{proto.confirm}</span>
                    <span className="proto-reject is-still">{proto.reject}</span>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="proto-client-note">{proto.clientNote}</p>
    </div>
  );

  return (
    <div className="proto-body proto-body-client">
      {state.phone ? <div className="proto-phone"><div className="proto-phone-screen">{body}</div></div> : body}
      <div className="proto-foot">
        {interactive ? (
          <>
            <label className="proto-check">
              <input
                type="checkbox"
                checked={state.clientOnly}
                onChange={(event) => set({ clientOnly: event.target.checked })}
              />
              <span>{proto.onlyPending}</span>
            </label>
            <button type="button" className="proto-back" onClick={() => set({ view: "designer" })}>
              {proto.backToDesigner}
            </button>
          </>
        ) : (
          <span className="proto-back is-still">{proto.backToDesigner}</span>
        )}
      </div>
    </div>
  );
}
