/* The state behind the concept prototype, and the one piece of real work it does.
 *
 * Two copies of this state exist and never touch: the one the walkthrough scripts
 * (rebuilt from the scene, so jumping to a chapter always lands on the same screen)
 * and the one a visitor builds by hand while exploring. Neither is stored anywhere
 * outside the page.
 *
 * `splitMessages` is deliberately dumb: it cuts on line breaks and sentence enders
 * and keeps the sentence it cut as the source quote. That is honest about what the
 * public page can do — understanding what "that thing from last time" refers to is
 * the part that needs a model, and this page has none.
 */

import type { ProtoItem, StoryCopy } from "./storyCopy";

export type ProtoStatus = "new" | "checked" | "confirmed" | "rejected";

export type ProtoItemState = ProtoItem & { status: ProtoStatus };

export type ProtoView = "designer" | "client";

export type ProtoState = {
  view: ProtoView;
  raw: string;
  items: ProtoItemState[];
  /** Which item has its source quote open. */
  openId: string | null;
  /** Compact presentation hides source quotes; client visibility is always enforced separately. */
  clientOnly: boolean;
  sent: boolean;
  /** The client page drawn as a phone, which is how it is actually opened. */
  phone: boolean;
};

export const emptyProto: ProtoState = {
  view: "designer",
  raw: "",
  items: [],
  openId: null,
  clientOnly: false,
  sent: false,
  phone: false,
};

/** The sample as it stands before the designer has checked anything. */
export function sampleItems(copy: StoryCopy, status: ProtoStatus = "new"): ProtoItemState[] {
  return copy.proto.items.map((item) => ({ ...item, status }));
}

const SENTENCE_END = /[。．.！!？?\n]/;

/* Cuts pasted chat into one change item per sentence, keeping the sentence as the
 * quote. Anything too short to be a request is dropped rather than turned into an
 * item nobody can act on. */
export function splitMessages(raw: string, at: string): ProtoItemState[] {
  const parts: string[] = [];
  let current = "";
  for (const character of raw) {
    if (SENTENCE_END.test(character)) {
      if (character !== "\n") current += character;
      parts.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  parts.push(current);

  return parts
    .map((part) => part.trim())
    .filter((part) => part.length >= 4)
    .map((part, index) => ({
      id: `p${index + 1}`,
      text: part,
      quote: part,
      at,
      needsClient: true,
      status: "new" as ProtoStatus,
    }));
}

/** What the client is shown, once the scope decision has been made. */
export function clientItems(state: ProtoState): ProtoItemState[] {
  return state.items.filter((item) => item.needsClient);
}

export function confirmedCount(state: ProtoState): { done: number; total: number } {
  const shown = clientItems(state);
  return {
    done: shown.filter((item) => item.status === "confirmed").length,
    total: shown.length,
  };
}
