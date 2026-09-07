import { describe, expect, it } from "vitest";

import { autoInitial, autoReducer, shouldAdvance, type AutoState } from "../autoDemo";
import { segmentsOf } from "../typing";
import { buildHandoffBrief, handoffMarkdown } from "./handoffPackage";
import { buildMap } from "./storyMap";
import { splitMessages, sampleItems, clientItems, confirmedCount, emptyProto } from "./storyProto";
import {
  buildScenes,
  chapterEntries,
  demoSeconds,
  playbackPlan,
  stateAt,
  threadAt,
  totalDurationMs,
} from "./storyScript";
import { storyCopy } from "./storyCopy";
import { siteCopy, withSeconds, type Locale } from "../../siteCopy";

const LOCALES: Locale[] = ["zh-CN", "en", "ja"];
const scenes = buildScenes("zh-CN");
const plan = playbackPlan(scenes, "zh-CN");
const total = scenes.length;
const run = (state: AutoState, ...actions: Parameters<typeof autoReducer>[1][]) =>
  actions.reduce((current, action) => autoReducer(current, action, plan), state);
/** The first scene the visitor speaks; scene 0 is the sentence they arrived on. */
const typedScene = scenes.findIndex((scene) => scene.typed.length > 0);

describe("the story", () => {
  it("covers all seven chapters in every language", () => {
    for (const locale of LOCALES) {
      const built = buildScenes(locale);
      expect(new Set(built.map((scene) => scene.chapter))).toEqual(
        new Set(storyCopy[locale].chapters.map((_, index) => index)),
      );
      expect(built.every((scene) => scene.messages.length > 0)).toBe(true);
    }
  });

  it("leaves the conversation-and-map layout behind once the prototype exists", () => {
    for (const locale of LOCALES) {
      const built = buildScenes(locale);
      const layouts = built.map((scene) => scene.layout);
      expect(new Set(layouts)).toEqual(new Set(["talk", "stage", "wide"]));
      // The prototype, the scope, the handoff and the result are not drawn on the map.
      const panes = new Set(built.map((scene) => scene.stage));
      for (const pane of ["map", "proto", "decide", "scope", "handoff", "outcome", "open"]) {
        expect(panes).toContain(pane);
      }
      // The last screen hands the room back rather than staying in a two-column demo.
      expect(built[built.length - 1].layout).toBe("wide");
    }
  });

  it("pays out a visible change on the turns that earn one", () => {
    for (const locale of LOCALES) {
      const built = buildScenes(locale);
      const changes = built.filter((scene) =>
        scene.messages.some((message) => message.role === "change"),
      );
      // Every turn where the visitor asks for something has to show what moved.
      expect(changes.length).toBeGreaterThanOrEqual(6);
      for (const id of ["experience", "pain", "spark", "flow", "askScope"]) {
        expect(changes.map((scene) => scene.id)).toContain(id);
      }
    }
  });

  it("keeps the same recognisable prototype from the first sight of it to the result", () => {
    for (const locale of LOCALES) {
      const built = buildScenes(locale);
      const first = built.find((scene) => scene.id === "protoOpen")!;
      const result = built.find((scene) => scene.id === "receipt")!;
      const ids = (scene: typeof first) => scene.proto.items.map((item) => item.id);
      expect(ids(result)).toEqual(ids(first));
      // The result is the same list, now being used: one item confirmed by the client.
      expect(result.proto.view).toBe("client");
      expect(result.proto.phone).toBe(true);
      expect(result.proto.items.filter((item) => item.status === "confirmed")).toHaveLength(1);
      // And the designer's own notes never travel with it once the scope was fixed.
      expect(result.proto.clientOnly).toBe(true);
    }
  });

  it("only asks the client to confirm what the designer marked", () => {
    for (const locale of LOCALES) {
      const copy = storyCopy[locale];
      const state = { ...emptyProto, items: sampleItems(copy), clientOnly: true };
      const shown = clientItems(state);
      expect(shown.length).toBeLessThan(state.items.length);
      expect(shown.every((item) => item.needsClient)).toBe(true);
      expect(confirmedCount(state)).toEqual({ done: 0, total: shown.length });
    }
  });

  it("runs between 90 and 120 seconds in every language, and says so honestly", () => {
    for (const locale of LOCALES) {
      const duration = totalDurationMs(buildScenes(locale), locale) / 1000;
      expect(duration).toBeGreaterThanOrEqual(90);
      expect(duration).toBeLessThanOrEqual(120);
      // The page never carries a hand-written length: it is filled in from the run.
      const advertised = demoSeconds(locale);
      expect(Math.abs(advertised - duration)).toBeLessThanOrEqual(2.5);
      for (const line of [
        siteCopy[locale].heroPrimary,
        siteCopy[locale].closingPrimary,
        siteCopy[locale].closingText,
        siteCopy[locale].demoIntro,
        siteCopy[locale].demo.startText,
        siteCopy[locale].demo.lengthNote,
      ]) {
        expect(line).toContain("{seconds}");
      }
      expect(withSeconds(siteCopy[locale].demo.lengthNote, advertised)).toContain(
        String(advertised),
      );
    }
  });

  it("holds longer on the beats that have something to read", () => {
    const built = buildScenes("zh-CN");
    const hold = (id: string) => built.find((scene) => scene.id === id)!.timing.readMs;
    // The scope sheet and the prototype are the two screens a visitor has to read.
    expect(hold("scope")).toBeGreaterThan(hold("wantIt"));
    expect(hold("protoTrace")).toBeGreaterThan(hold("wantIt"));
  });

  it("earns the handoff with an explicit user decision and shows confirmation as a separate state", () => {
    for (const locale of LOCALES) {
      const built = buildScenes(locale);
      for (const id of ["scope", "handoff"]) {
        expect(built.find(scene => scene.id === id)!.typed.length).toBeGreaterThan(0);
      }
      const before = built.find(scene => scene.id === "outcome")!;
      const after = built.find(scene => scene.id === "receipt")!;
      expect(confirmedCount(before.proto).done).toBe(0);
      expect(confirmedCount(after.proto).done).toBe(1);
      expect(after.proto.items[0].id).toBe(before.proto.items[0].id);
      expect(after.proto.items[0].text).toBe(before.proto.items[0].text);
      for (const scene of built.filter(scene => scene.proto.view === "client")) {
        expect(clientItems(scene.proto)).toHaveLength(3);
      }
    }
  });

  it("types the visitor's turns and nothing else", () => {
    for (const locale of LOCALES) {
      const built = buildScenes(locale);
      for (const scene of built) {
        const spoken = scene.messages.find((message) => message.role === "user");
        if (scene.id === "idea" || !spoken) expect(scene.typed).toEqual([]);
        else expect(scene.typed.join("")).toBe(spoken.text);
      }
      // Playback settles on the last scene, so the last scene must have nothing left
      // to type — otherwise "finished" would arrive before the line did.
      expect(built[built.length - 1].typed).toEqual([]);
    }
  });

  it("cuts a line on the characters a reader sees, not on code units", () => {
    expect(segmentsOf("原话")).toEqual(["原", "话"]);
    expect(segmentsOf("a👍b")).toEqual(["a", "👍", "b"]);
    expect(segmentsOf("👩‍👩‍👦")).toHaveLength(1);
  });

  it("only ever adds to the thread, so a scene is never replayed twice", () => {
    for (let index = 1; index < total; index += 1) {
      const before = threadAt(scenes, index - 1, "reply");
      const after = threadAt(scenes, index, "reply");
      expect(after.slice(0, before.length)).toEqual(before);
      expect(after.length).toBeGreaterThan(before.length);
    }
  });

  it("holds the answer back until the line has been sent", () => {
    const index = typedScene;
    const before = threadAt(scenes, index - 1, "reply");
    expect(threadAt(scenes, index, "typing")).toEqual(before);
    expect(threadAt(scenes, index, "pending")).toEqual(before);

    const sent = threadAt(scenes, index, "sent");
    expect(sent).toHaveLength(before.length + 1);
    expect(sent[sent.length - 1]).toEqual({ role: "user", text: scenes[index].typed.join("") });
    expect(threadAt(scenes, index, "reply")).toEqual([...sent, ...scenes[index].messages.slice(1)]);
  });

  it("leaves the pane on the last answer while the next line is being typed", () => {
    const index = typedScene;
    for (const beat of ["typing", "pending", "sent"] as const) {
      expect(stateAt(scenes, index, beat).map).toEqual(scenes[index - 1].map);
      expect(stateAt(scenes, index, beat).stage).toBe(scenes[index - 1].stage);
    }
    expect(stateAt(scenes, index, "reply").map).toEqual(scenes[index].map);
  });

  it("gives every chapter chip a scene to jump to, in order", () => {
    const entries = chapterEntries(scenes);
    expect(entries).toHaveLength(storyCopy["zh-CN"].chapters.length);
    expect(entries.every((index) => Number.isInteger(index))).toBe(true);
    expect([...entries]).toEqual([...entries].sort((a, b) => a - b));
  });

  it("draws a map for every state the script asks for, and a flow at the end of it", () => {
    for (const locale of LOCALES) {
      const copy = storyCopy[locale];
      for (const scene of buildScenes(locale)) {
        const view = buildMap(scene.map);
        expect(view.nodes.length).toBeGreaterThan(0);
        for (const node of view.nodes) expect(copy.nodes[node.content]).toBeTruthy();
        // Every edge joins two nodes that are actually on the board.
        for (const edge of view.edges) {
          expect(view.nodes.some((node) => node.id === edge.from)).toBe(true);
          expect(view.nodes.some((node) => node.id === edge.to)).toBe(true);
        }
      }
      const flow = buildMap({ grown: 4, flow: true });
      expect(flow.nodes.map((node) => node.id)).toEqual([
        "shape",
        "flow1",
        "flow2",
        "flow3",
        "flow4",
        "parked",
      ]);
    }
  });
});

describe("the prototype's own work", () => {
  it("cuts pasted chat into one change item per sentence, keeping the sentence", () => {
    const items = splitMessages("首页那个图换一张。\n价格表先不动。", "周二 10:12");
    expect(items).toHaveLength(2);
    expect(items[0].text).toBe("首页那个图换一张。");
    // The source is what makes the item traceable, so it is never thrown away.
    expect(items[0].quote).toBe(items[0].text);
    expect(items[0].at).toBe("周二 10:12");
    expect(items.every((item) => item.needsClient)).toBe(true);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  });

  it("drops fragments too short to be a request", () => {
    expect(splitMessages("好。\n嗯\n首页那个图换一张。", "t")).toHaveLength(1);
    expect(splitMessages("   \n\n", "t")).toEqual([]);
  });
});

describe("the handoff package", () => {
  it("says the same thing on the page, in the demo and in the file", () => {
    for (const locale of LOCALES) {
      const story = storyCopy[locale];
      const brief = buildHandoffBrief(locale);
      const labels = siteCopy[locale].briefLabels;
      const block = (label: string) => brief.blocks.find((entry) => entry.label === label)!;

      expect(brief.input).toBe(story.turns.idea.user);
      expect(block(labels.scope).items).toEqual(story.scope.items.map((item) => item.text));
      expect(block(labels.nonGoals).items).toEqual(story.scope.notItems);
      expect(block(labels.done).items).toEqual(story.scope.doneItems);
      expect(block(labels.open).items).toEqual(story.scope.openItems);
      expect(block(labels.handoff).items).toEqual(story.handoff.tasks.map((task) => task.text));

      // The downloaded file is the screen, not a marketing sheet: scope, non-goals,
      // acceptance, open questions and the work, each with where it came from.
      const file = handoffMarkdown(locale);
      for (const item of story.scope.items) {
        expect(file).toContain(item.text);
        expect(file).toContain(item.from);
      }
      for (const line of [...story.scope.notItems, ...story.scope.doneItems, ...story.scope.openItems]) {
        expect(file).toContain(line);
      }
      for (const task of story.handoff.tasks) {
        expect(file).toContain(task.text);
        expect(file).toContain(task.from);
      }
      // And it says what it is not.
      expect(file).toContain(story.handoff.downloadNote);
      expect(file).toContain(siteCopy[locale].trustScope);
      expect(file.length).toBeGreaterThan(400);
    }
  });

  it("traces every line of version one back to something that was said", () => {
    for (const locale of LOCALES) {
      const story = storyCopy[locale];
      expect(story.scope.items.every((item) => item.from.trim().length > 0)).toBe(true);
      expect(story.handoff.tasks.every((task) => task.from.trim().length > 0)).toBe(true);
    }
  });
});

describe("playback", () => {
  it("starts paused on the first scene, with nothing typed", () => {
    expect(autoInitial).toEqual({ index: 0, beat: "reply", typed: 0, playing: false, finished: false });
    expect(shouldAdvance(autoInitial, { mode: "auto", visible: true, reduceMotion: false })).toBe(false);
  });

  it("walks one turn as type, hold, send, answer", () => {
    let state = run(autoInitial, { type: "play" }, { type: "advance" });
    expect(state).toMatchObject({ index: typedScene, beat: "typing", typed: 0 });
    const characters = plan.typed[typedScene];
    for (let i = 0; i < characters; i += 1) state = run(state, { type: "advance" });
    expect(state).toMatchObject({ beat: "pending", typed: characters });
    state = run(state, { type: "advance" });
    expect(state.beat).toBe("sent");
    state = run(state, { type: "advance" });
    expect(state.beat).toBe("reply");
  });

  it("freezes the half-typed line on pause and picks it up from the same character", () => {
    let state = run(autoInitial, { type: "play" }, { type: "advance" }, { type: "advance" }, { type: "advance" });
    expect(state).toMatchObject({ beat: "typing", typed: 2 });
    const paused = run(state, { type: "pause" });
    expect(run(paused, { type: "advance" })).toEqual(paused);
    expect(run(paused, { type: "resume" }, { type: "advance" })).toMatchObject({ typed: 3 });
  });

  it("settles on the last scene instead of running past it", () => {
    let state = run(autoInitial, { type: "play" });
    for (let tick = 0; tick < 600; tick += 1) state = run(state, { type: "advance" });
    expect(state).toMatchObject({ index: total - 1, playing: false, finished: true });
  });

  it("holds the timer while the tab is hidden and while the visitor is exploring", () => {
    const playing = run(autoInitial, { type: "play" });
    expect(shouldAdvance(playing, { mode: "auto", visible: true, reduceMotion: false })).toBe(true);
    expect(shouldAdvance(playing, { mode: "auto", visible: false, reduceMotion: false })).toBe(false);
    expect(shouldAdvance(playing, { mode: "auto", visible: true, reduceMotion: true })).toBe(false);
    expect(shouldAdvance(playing, { mode: "manual", visible: true, reduceMotion: false })).toBe(false);
  });
});
