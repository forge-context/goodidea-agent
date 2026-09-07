/* The static output preview, and the file behind the download.
 *
 * A visitor who never presses play still has to be able to read what the walkthrough
 * produces, and the page, the demo and the downloaded file must not be able to
 * disagree. So all three are assembled here out of the same story copy: the product
 * direction, the concept prototype, the first-version scope and the handoff package.
 */

import { siteCopy, type Locale } from "../../siteCopy";
import { storyCopy } from "./storyCopy";

export type BriefBlock = {
  label: string;
  items: string[];
  note?: string;
  /** Boundary blocks read as a limit, not as a feature list. */
  tone?: "limit" | "open";
};

export type HandoffBrief = {
  input: string;
  blocks: BriefBlock[];
};

export function buildHandoffBrief(locale: Locale): HandoffBrief {
  const site = siteCopy[locale];
  const story = storyCopy[locale];
  const label = site.briefLabels;
  const node = (id: string) => story.nodes[id].text;

  return {
    input: story.turns.idea.user ?? "",
    blocks: [
      {
        label: label.direction,
        items: [node("who"), node("problem"), node("outcome")],
      },
      {
        label: label.prototype,
        items: [node("shape"), story.handoff.blocks[1].items[0]],
        note: story.proto.note,
      },
      {
        // What version one guarantees is exactly the list the walkthrough settles on.
        label: label.scope,
        items: story.scope.items.map((item) => item.text),
      },
      {
        label: label.nonGoals,
        items: story.scope.notItems,
        tone: "limit",
      },
      {
        label: label.done,
        items: story.scope.doneItems,
      },
      {
        label: label.open,
        items: story.scope.openItems,
        tone: "open",
      },
      {
        label: label.handoff,
        items: story.handoff.tasks.map((task) => task.text),
        note: story.handoff.agentNote,
      },
    ],
  };
}

/* The downloadable package. Same content as the screen, written as the note a
 * coding agent is actually handed: what it is for, what it must do, what it must
 * not do, and how anyone can tell it came out right. */
export function handoffMarkdown(locale: Locale): string {
  const site = siteCopy[locale];
  const story = storyCopy[locale];
  const label = site.briefLabels;
  const list = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

  return [
    `# ${story.handoff.title} — ${story.scope.title}`,
    "",
    `> ${story.turns.idea.user ?? ""}`,
    "",
    `## ${label.direction}`,
    list([story.nodes.who.text, story.nodes.problem.text, story.nodes.outcome.text]),
    "",
    `## ${label.prototype}`,
    list([
      story.nodes.shape.text,
      story.nodes.flow1.text,
      story.nodes.flow2.text,
      story.nodes.flow3.text,
      story.nodes.flow4.text,
    ]),
    "",
    `## ${story.scope.doing}`,
    list(story.scope.items.map((item) => `${item.text} （${item.from}）`)),
    "",
    `## ${story.scope.notDoing}`,
    list(story.scope.notItems),
    "",
    `## ${story.scope.done}`,
    list(story.scope.doneItems),
    "",
    `## ${story.scope.open}`,
    list(story.scope.openItems),
    "",
    `## ${story.handoff.agentTitle}`,
    list(story.handoff.tasks.map((task) => `${task.text} （${task.from}）`)),
    "",
    "---",
    "",
    story.handoff.downloadNote,
    site.trustScope,
    "",
  ].join("\n");
}
