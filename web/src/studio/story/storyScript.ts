/* The scene list the walkthrough plays.
 *
 * Each scene carries the whole screen — the layout, the pane, the map and the
 * prototype — rather than a change to it. That is what lets a visitor jump straight
 * to a chapter and get exactly the screen that chapter earned, and what stops a
 * scene that was left behind from writing into the one now playing.
 *
 * The line a visitor speaks is stored already cut into the characters a reader sees,
 * so the playback machine can count them without knowing anything about text.
 */

import { pace, readingMs, segmentsOf, typingMs } from "../typing";
import type { AutoState, Beat, PlaybackPlan } from "../autoDemo";
import { initialMap, type MapVars } from "./storyMap";
import { emptyProto, sampleItems, type ProtoState } from "./storyProto";
import { storyCopy, type SceneId, type StoryLocale } from "./storyCopy";

export type ScriptMessage =
  | { role: "user"; text: string }
  | { role: "agent"; lines: string[] }
  /** The one visible thing this turn paid out. Part of the transcript on purpose:
   *  on a phone the map is a tab away, and the change still has to be readable. */
  | { role: "change"; text: string };

/** Which pane carries the scene. The story leaves the map behind on purpose. */
export type StageKind = "map" | "proto" | "decide" | "scope" | "handoff" | "outcome" | "open";

/** How the conversation and the pane share the room. */
export type SceneLayout = "talk" | "stage" | "wide";

export type StoryScene = {
  id: SceneId;
  chapter: number;
  layout: SceneLayout;
  stage: StageKind;
  map: MapVars;
  proto: ProtoState;
  messages: ScriptMessage[];
  /** The visitor's line, cut on visible characters. Empty when the scene opens with
   *  the agent instead. */
  typed: string[];
  timing: { tickMs: number; pendingMs: number; sentMs: number; readMs: number };
};

type Draft = Omit<StoryScene, "typed" | "timing" | "messages"> & {
  /** Extra hold on top of the reading time, for a beat worth staying on. */
  dwell?: number;
};

export function buildScenes(locale: StoryLocale): StoryScene[] {
  const copy = storyCopy[locale];
  const turn = (id: SceneId) => copy.turns[id];

  const pasted = copy.proto.raw;
  const fresh = sampleItems(copy, "new");
  const checked = sampleItems(copy, "checked").map((item) =>
    item.id === copy.proto.corrected.id ? { ...item, text: copy.proto.corrected.text } : item,
  );
  const confirmedFirst = checked.map((item) =>
    item.id === checked[0].id ? { ...item, status: "confirmed" as const } : item,
  );

  const designer: ProtoState = {
    ...emptyProto,
    view: "designer",
    raw: pasted,
    items: fresh,
  };

  const drafts: Draft[] = [
    {
      id: "idea",
      chapter: 0,
      layout: "talk",
      stage: "map",
      map: initialMap,
      proto: emptyProto,
    },
    {
      id: "experience",
      chapter: 0,
      layout: "talk",
      stage: "map",
      map: { grown: 2, flow: false },
      proto: emptyProto,
    },
    {
      id: "pain",
      chapter: 0,
      layout: "talk",
      stage: "map",
      map: { grown: 3, flow: false },
      proto: emptyProto,
    },
    {
      id: "spark",
      chapter: 1,
      layout: "talk",
      stage: "map",
      map: { grown: 4, flow: false },
      proto: emptyProto,
    },
    {
      id: "flow",
      chapter: 1,
      layout: "talk",
      stage: "map",
      map: { grown: 4, flow: true },
      proto: emptyProto,
      dwell: 800,
    },
    {
      // The story leaves the map here: from now on the prototype is the screen and
      // the conversation moves to the side.
      id: "protoOpen",
      chapter: 2,
      layout: "stage",
      stage: "proto",
      map: { grown: 4, flow: true },
      proto: designer,
      dwell: 2400,
    },
    {
      id: "protoTrace",
      chapter: 2,
      layout: "stage",
      stage: "proto",
      map: { grown: 4, flow: true },
      proto: { ...designer, openId: copy.proto.items[1].id },
      dwell: 1000,
    },
    {
      id: "protoCheck",
      chapter: 2,
      layout: "stage",
      stage: "proto",
      map: { grown: 4, flow: true },
      proto: { ...designer, items: checked, openId: copy.proto.corrected.id },
      dwell: 1400,
    },
    {
      id: "protoClient",
      chapter: 2,
      layout: "stage",
      stage: "proto",
      map: { grown: 4, flow: true },
      proto: { ...designer, items: checked, view: "client", sent: true },
      dwell: 2400,
    },
    {
      // The visitor asks for something, and the screen is different afterwards.
      id: "askScope",
      chapter: 3,
      layout: "stage",
      stage: "proto",
      map: { grown: 4, flow: true },
      proto: { ...designer, items: checked, view: "client", sent: true, clientOnly: true },
      dwell: 1600,
    },
    {
      id: "wantIt",
      chapter: 3,
      layout: "stage",
      stage: "proto",
      map: { grown: 4, flow: true },
      proto: { ...designer, items: checked, view: "client", sent: true, clientOnly: true },
    },
    {
      id: "directions",
      chapter: 4,
      layout: "stage",
      stage: "decide",
      map: { grown: 4, flow: true },
      proto: { ...designer, items: checked, view: "client", sent: true, clientOnly: true },
      dwell: 2400,
    },
    {
      id: "scope",
      chapter: 4,
      layout: "stage",
      stage: "scope",
      map: { grown: 4, flow: true },
      proto: { ...designer, items: checked, view: "client", sent: true, clientOnly: true },
      dwell: 3600,
    },
    {
      id: "handoff",
      chapter: 5,
      layout: "wide",
      stage: "handoff",
      map: { grown: 4, flow: true },
      proto: { ...designer, items: checked, view: "client", sent: true, clientOnly: true },
      dwell: 2600,
    },
    {
      id: "agentTasks",
      chapter: 5,
      layout: "wide",
      stage: "handoff",
      map: { grown: 4, flow: true },
      proto: { ...designer, items: checked, view: "client", sent: true, clientOnly: true },
      dwell: 2800,
    },
    {
      // The same confirmation list the prototype showed, this time being used.
      id: "outcome",
      chapter: 6,
      layout: "wide",
      stage: "outcome",
      map: { grown: 4, flow: true },
      proto: {
        ...designer,
        items: checked,
        view: "client",
        sent: true,
        clientOnly: true,
        phone: true,
      },
      dwell: 2200,
    },
    {
      id: "receipt",
      chapter: 6,
      layout: "wide",
      stage: "outcome",
      map: { grown: 4, flow: true },
      proto: { ...designer, items: confirmedFirst, view: "client", sent: true, clientOnly: true, phone: true },
      dwell: 1800,
    },
    {
      id: "possibilities",
      chapter: 6,
      layout: "stage",
      stage: "open",
      map: { grown: 4, flow: true },
      proto: {
        ...designer,
        items: confirmedFirst,
        view: "client",
        sent: true,
        clientOnly: true,
        phone: true,
      },
      dwell: 1600,
    },
    {
      /* The last scene hands the room back: one question, and the ways out that this
       * page can actually honour. */
      id: "closing",
      chapter: 6,
      layout: "wide",
      stage: "open",
      map: { grown: 4, flow: true },
      proto: {
        ...designer,
        items: confirmedFirst,
        view: "client",
        sent: true,
        clientOnly: true,
        phone: true,
      },
    },
  ];

  return drafts.map(({ dwell = 0, ...scene }) => {
    const said = turn(scene.id);
    const messages: ScriptMessage[] = [];
    if (said.user) messages.push({ role: "user", text: said.user });
    if (said.agent) messages.push({ role: "agent", lines: said.agent });
    if (said.change) messages.push({ role: "change", text: said.change });
    const read = said.agent?.join("").length ?? 0;
    return {
      ...scene,
      messages,
      // The opening scene is the conversation a visitor arrives on, so it is never
      // typed: they did not watch themselves say it.
      typed: scene.id === "idea" || !said.user ? [] : segmentsOf(said.user),
      timing: {
        tickMs: pace[locale].tickMs,
        pendingMs: pace[locale].pendingMs,
        sentMs: pace[locale].sentMs,
        readMs: readingMs(locale, read) + dwell,
      },
    };
  });
}

/** What the playback machine needs to know about a built script. */
export function playbackPlan(scenes: StoryScene[], locale: StoryLocale): PlaybackPlan {
  return {
    count: scenes.length,
    typed: scenes.map((scene) => scene.typed.length),
    perTick: pace[locale].perTick,
  };
}

/** How long the current beat lasts before the machine is asked to advance. */
export function beatMs(state: AutoState, scene: StoryScene): number {
  switch (state.beat) {
    case "typing":
      return scene.timing.tickMs;
    case "pending":
      return scene.timing.pendingMs;
    case "sent":
      return scene.timing.sentMs;
    default:
      return scene.timing.readMs;
  }
}

/* The thread as it stands at a beat. Scenes are cumulative and never replayed, and
 * within a scene the visitor's line only joins the thread once it has been sent —
 * which is what stops an answer from appearing to a question nobody asked yet. */
export function threadAt(scenes: StoryScene[], index: number, beat: Beat): ScriptMessage[] {
  const before = scenes.slice(0, index).flatMap((scene) => scene.messages);
  const current = scenes[index]?.messages ?? [];
  if (beat === "typing" || beat === "pending") return before;
  if (beat === "sent") return [...before, ...current.filter((message) => message.role === "user")];
  return [...before, ...current];
}

/* The pane belongs to the answer, not to the question: while a line is still being
 * typed the screen is still showing what the last answer left behind. */
export function stateAt(scenes: StoryScene[], index: number, beat: Beat): StoryScene {
  return scenes[beat === "reply" ? index : Math.max(index - 1, 0)];
}

/* The longest line the script will type. The demo field reserves room for it from
 * the start, so its height is fixed for the whole run: without that, every turn would
 * resize the dock and shunt the conversation above it up and down. */
export function longestLine(scenes: StoryScene[]): string {
  return scenes.reduce((longest, scene) => {
    const line = scene.typed.join("");
    return line.length > longest.length ? line : longest;
  }, "");
}

/** First scene of each chapter, for the chapter chips in the transport bar. */
export function chapterEntries(scenes: StoryScene[]): number[] {
  const entries: number[] = [];
  scenes.forEach((scene, index) => {
    if (entries[scene.chapter] === undefined) entries[scene.chapter] = index;
  });
  return entries;
}

/** Every beat of one scene: typing it, holding it, sending it, reading the answer. */
export function sceneMs(scene: StoryScene, locale: StoryLocale): number {
  if (scene.typed.length === 0) return scene.timing.readMs;
  return (
    typingMs(locale, scene.typed.length) +
    scene.timing.pendingMs +
    scene.timing.sentMs +
    scene.timing.readMs
  );
}

export function totalDurationMs(scenes: StoryScene[], locale: StoryLocale): number {
  // The last scene is where playback stops, so its reading hold is never waited out.
  return scenes.reduce(
    (total, scene, index) =>
      total + sceneMs(scene, locale) - (index === scenes.length - 1 ? scene.timing.readMs : 0),
    0,
  );
}

/** The length the page is allowed to advertise: the real run, rounded to five seconds. */
export function demoSeconds(locale: StoryLocale): number {
  const duration = totalDurationMs(buildScenes(locale), locale) / 1000;
  return Math.round(duration / 5) * 5;
}
