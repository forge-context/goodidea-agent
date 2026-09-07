/* The scene list the auto-play walks through.
 *
 * It is built out of the same storyboard the manual walkthrough uses: the options,
 * the replies and the canvas variables all come from `ideaStudioFlow` /
 * `ideaStudioCopy`, so the watched version and the clicked version tell one story.
 *
 * Each scene carries the whole canvas rather than a change to it, which is what lets
 * a visitor jump straight to a stage without replaying everything before it. It also
 * carries its line already cut into visible characters, so the playback machine can
 * count them without knowing anything about text.
 */

import { type Locale } from "../../siteCopy";
import { legacyCopy } from "./legacyCopy";
import { studioCopy } from "./ideaStudioCopy";
import { initialCanvas, type CanvasVars } from "./ideaStudioFlow";
import { pace, readingMs, segmentsOf, typingMs } from "../../studio/typing";
import type { AutoState, Beat, PlaybackPlan } from "../../studio/autoDemo";

export type ScriptMessage = { role: "user"; text: string } | { role: "agent"; lines: string[] };

export type DemoScene = {
  id: string;
  /** Index into `legacyCopy.chapters`. */
  chapter: number;
  canvas: CanvasVars;
  stage: number;
  /** Only what this scene adds; the thread is the scenes so far, concatenated. */
  messages: ScriptMessage[];
  /** The visitor's line, cut into the characters a reader sees. Empty when the
   *  scene opens with the agent instead. */
  typed: string[];
  /** How long each beat of this scene lasts. */
  timing: { tickMs: number; pendingMs: number; sentMs: number; readMs: number };
};

export function buildScenes(locale: Locale): DemoScene[] {
  const demo = studioCopy[locale];

  const said = (id: string): ScriptMessage => ({ role: "user", text: demo.options[id] });
  const replied = (id: string): ScriptMessage => ({ role: "agent", lines: demo.replies[id] });

  const draft: Omit<DemoScene, "typed" | "timing">[] = [
    {
      id: "idea",
      chapter: 0,
      stage: 0,
      canvas: initialCanvas,
      messages: [
        { role: "user", text: demo.idea },
        { role: "agent", lines: demo.opening },
      ],
    },
    {
      id: "people",
      chapter: 1,
      stage: 1,
      canvas: { ...initialCanvas, grown: 2 },
      messages: [said("s0a"), replied("s0a")],
    },
    {
      id: "narrow",
      chapter: 1,
      stage: 1,
      canvas: { ...initialCanvas, grown: 3 },
      messages: [said("s1a"), replied("s1a")],
    },
    {
      id: "problem",
      chapter: 1,
      // The rail is finer-grained than the four stages, so scenes are mapped to it in
      // a way that never leaves the two disagreeing on screen: while the walkthrough
      // is still asking who and what, the rail still says "find the user".
      stage: 1,
      canvas: { ...initialCanvas, grown: 4 },
      messages: [said("s2a"), replied("s2a")],
    },
    {
      id: "outcome",
      chapter: 2,
      stage: 2,
      canvas: { ...initialCanvas, grown: 5 },
      messages: [said("s3a"), replied("s3a")],
    },
    {
      id: "shape",
      chapter: 2,
      stage: 3,
      canvas: { ...initialCanvas, grown: 6 },
      messages: [said("s4a"), replied("s4a")],
    },
    {
      // The turn where the visitor pulls the scope back rather than agreeing: real
      // orders leave version one, and the map reorders itself around what is left.
      id: "hesitate",
      chapter: 2,
      stage: 3,
      canvas: { ...initialCanvas, grown: 6, help: "a" },
      messages: [said("sha"), replied("sha")],
    },
    {
      id: "first-step",
      chapter: 3,
      stage: 4,
      canvas: { ...initialCanvas, grown: 6, help: "a", firstStep: true },
      messages: [said("s5b"), replied("s5b")],
    },
    {
      id: "handoff",
      chapter: 3,
      stage: 4,
      canvas: { ...initialCanvas, grown: 6, help: "a", firstStep: true },
      messages: [{ role: "agent", lines: legacyCopy[locale].closingLines }],
    },
  ];

  return draft.map((scene) => {
    const spoken = scene.messages.find((message) => message.role === "user");
    const answered = scene.messages
      .filter((message) => message.role === "agent")
      .reduce((total, message) => total + message.lines.join("").length, 0);
    return {
      ...scene,
      // The opening scene is already on screen before playback starts, so it is never
      // typed; it is the sentence the visitor arrived on.
      typed: scene.id === "idea" || !spoken ? [] : segmentsOf(spoken.text),
      timing: {
        tickMs: pace[locale].tickMs,
        pendingMs: pace[locale].pendingMs,
        sentMs: pace[locale].sentMs,
        readMs: readingMs(locale, answered),
      },
    };
  });
}

/** What the playback machine needs to know about a built script. */
export function playbackPlan(scenes: DemoScene[], locale: Locale): PlaybackPlan {
  return {
    count: scenes.length,
    typed: scenes.map((scene) => scene.typed.length),
    perTick: pace[locale].perTick,
  };
}

/** How long the current beat lasts before the machine is asked to advance. */
export function beatMs(state: AutoState, scene: DemoScene): number {
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
export function threadAt(scenes: DemoScene[], index: number, beat: Beat): ScriptMessage[] {
  const before = scenes.slice(0, index).flatMap((scene) => scene.messages);
  const current = scenes[index]?.messages ?? [];
  if (beat === "typing" || beat === "pending") return before;
  if (beat === "sent") return [...before, ...current.filter((message) => message.role === "user")];
  return [...before, ...current];
}

/* The canvas and the rail belong to the answer, not to the question: while a line is
 * still being typed the map is still showing what the last answer left behind. */
export function stateAt(scenes: DemoScene[], index: number, beat: Beat): DemoScene {
  return scenes[beat === "reply" ? index : Math.max(index - 1, 0)];
}

/* The longest line the script will type. The demo field reserves room for it from
 * the start, so its height is fixed for the whole run: without that, every turn would
 * resize the dock and shunt the conversation above it up and down. */
export function longestLine(scenes: DemoScene[]): string {
  return scenes.reduce((longest, scene) => {
    const line = scene.typed.join("");
    return line.length > longest.length ? line : longest;
  }, "");
}

/** First scene of each chapter, for the stage chips in the transport bar. */
export function chapterEntries(scenes: DemoScene[]): number[] {
  const entries: number[] = [];
  scenes.forEach((scene, index) => {
    if (entries[scene.chapter] === undefined) entries[scene.chapter] = index;
  });
  return entries;
}

/** Every beat of one scene: typing it, holding it, sending it, reading the answer. */
export function sceneMs(scene: DemoScene, locale: Locale): number {
  if (scene.typed.length === 0) return scene.timing.readMs;
  return (
    typingMs(locale, scene.typed.length) +
    scene.timing.pendingMs +
    scene.timing.sentMs +
    scene.timing.readMs
  );
}

export function totalDurationMs(scenes: DemoScene[], locale: Locale): number {
  // The last scene is where playback stops, so its reading hold is never waited out.
  return scenes.reduce(
    (total, scene, index) =>
      total + sceneMs(scene, locale) - (index === scenes.length - 1 ? scene.timing.readMs : 0),
    0,
  );
}

/** The length the page is allowed to advertise: the real run, rounded to five seconds. */
export function demoSeconds(locale: Locale): number {
  const duration = totalDurationMs(buildScenes(locale), locale) / 1000;
  return Math.round(duration / 5) * 5;
}
