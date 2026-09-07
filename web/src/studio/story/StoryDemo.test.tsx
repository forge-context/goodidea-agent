// @vitest-environment jsdom
/* Behaviour of the walkthrough as a visitor meets it: what is readable before any
 * click, what playback does to the conversation and the pane, whether the prototype
 * really works, and the promise that watching and exploring never overwrite each
 * other.
 *
 * Timers are faked, so "one timeout at a time" is checked rather than assumed: a
 * second timer would show up as playback skipping a beat per tick, or as a line from
 * the scene that was left still typing itself after a jump.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { StoryDemo } from "./StoryDemo";
import { buildScenes } from "./storyScript";
import { storyCopy } from "./storyCopy";
import { siteCopy } from "../../siteCopy";

const copy = storyCopy["zh-CN"];
const site = siteCopy["zh-CN"].demo;
const scenes = buildScenes("zh-CN");
/** The first scene the visitor speaks; scene 0 is the sentence they arrived on. */
const spokenIndex = scenes.findIndex((scene) => scene.typed.length > 0);
const spoken = scenes[spokenIndex];
const chapterOf = (id: string) => scenes.find((scene) => scene.id === id)!.chapter;

let motion = "no-preference";
let hidden = false;

beforeEach(() => {
  motion = "no-preference";
  hidden = false;
  // jsdom has no layout, so the canvas measures nothing and lays its nodes out at
  // the declared coordinates. That is enough: these tests are about what is on the
  // screen, not where.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: query.includes("reduce") && motion === "reduce",
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList,
  );
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/* One act() per beat: the effect that arms the next timeout only runs once React has
 * committed, so jumping the clock in a single call fires one timer and stops. That is
 * exactly the property being relied on — it is also how a second timer would show. */
const beat = (times = 1) => {
  for (let i = 0; i < times; i += 1) act(() => { vi.advanceTimersByTime(120_000); });
};
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const settle = (steps = 12, ms = 20_000) => {
  for (let i = 0; i < steps; i += 1) advance(ms);
};
const flush = () => act(() => { vi.advanceTimersByTime(0); });

const turns = () => document.querySelectorAll(".chat-scroll .chat-said, .chat-scroll .chat-asked").length;
const said = () => [...document.querySelectorAll(".chat-said")].map((el) => el.textContent);
const changes = () => [...document.querySelectorAll(".chat-change")].map((el) => el.textContent);
const status = () => document.querySelector(".transport-status")!.textContent ?? "";
const transport = () => document.querySelector(".transport-play") as HTMLButtonElement;
const stageKind = () => document.querySelector(".story-stage")!.getAttribute("data-stage");
const layout = () => document.querySelector(".studio.story")!.getAttribute("data-layout");
const field = () => document.querySelector(".compose-demo-text") as HTMLElement | null;
const fieldText = () => field()?.textContent ?? "";
const fieldTag = () => document.querySelector(".compose-demo-tag")?.textContent ?? "";
const stepButton = () =>
  ([...document.querySelectorAll(".transport-step")][0] ?? transport()) as HTMLButtonElement;
const chapter = (index: number) =>
  document.querySelectorAll(".transport-chapters button")[index] as HTMLButtonElement;
const exploreToggle = () => document.querySelector(".studio-explore") as HTMLButtonElement;
const protoItems = () => [...document.querySelectorAll(".proto-item")];
const itemText = () =>
  [...document.querySelectorAll(".proto-item-text")].map((el) =>
    el instanceof HTMLInputElement ? el.value : el.textContent,
  );

const play = () => {
  fireEvent.click(screen.getByText(site.watch));
  flush();
};
const playToTyping = () => {
  play();
  beat(spokenIndex);
};
/** Jump to a chapter and step into it as a watching visitor would. */
const goTo = (id: string) => {
  fireEvent.click(chapter(chapterOf(id)));
  flush();
};

describe("before anything is clicked", () => {
  it("already reads as a conversation, with both ways in", () => {
    render(<StoryDemo locale="zh-CN" />);
    expect(turns()).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(site.startTitle)).toBeTruthy();
    expect(screen.getByText(site.watch)).toBeTruthy();
    expect(screen.getByText(site.tryIt)).toBeTruthy();
  });

  it("starts nothing on its own", () => {
    render(<StoryDemo locale="zh-CN" />);
    const before = turns();
    settle();
    expect(turns()).toBe(before);
  });

  it("shows the field as a read-only part of the demo, never as somewhere to type", () => {
    render(<StoryDemo locale="zh-CN" />);
    playToTyping();
    expect(document.querySelector(".chat-compose-demo")).toBeTruthy();
    expect(document.querySelector(".chat-compose textarea")).toBeNull();
    expect(document.querySelector(".chat-compose-demo")!.querySelectorAll("textarea, input, button").length).toBe(0);
  });
});

describe("watching", () => {
  it("types the visitor's line, sends it, and only then answers and moves the pane", () => {
    render(<StoryDemo locale="zh-CN" />);
    playToTyping();
    const before = turns();
    expect(fieldTag()).toBe(copy.ui.composeTyping);

    beat(3);
    expect(fieldText()).toBe(spoken.typed.slice(0, 3).join(""));
    expect(turns()).toBe(before);

    beat(spoken.typed.length - 3);
    expect(fieldText()).toBe(spoken.typed.join(""));
    expect(fieldTag()).toBe(copy.ui.composeSending);

    beat(1);
    expect(fieldText()).toBe("");
    expect(said()).toContain(spoken.typed.join(""));
    expect(turns()).toBe(before + 1);

    beat(1);
    expect(turns()).toBe(before + 2);
    // The turn paid out a change, and the change is in the transcript.
    expect(changes().join(" ")).toContain(copy.turns.experience.change);
  });

  it("advances one beat per tick, never two", () => {
    render(<StoryDemo locale="zh-CN" />);
    playToTyping();
    beat(1);
    expect(fieldText()).toHaveLength(1);
    beat(1);
    expect(fieldText()).toHaveLength(2);
  });

  it("holds the half-typed line on pause and continues from the same character", () => {
    render(<StoryDemo locale="zh-CN" />);
    playToTyping();
    beat(4);
    fireEvent.click(transport());

    const held = { text: fieldText(), turns: turns() };
    expect(held.text).toHaveLength(4);
    expect(status()).toContain(site.paused);
    settle();
    expect(fieldText()).toBe(held.text);
    expect(turns()).toBe(held.turns);

    fireEvent.click(transport());
    beat(1);
    expect(fieldText()).toBe(spoken.typed.slice(0, 5).join(""));
  });

  it("stops while the tab is in the background and carries on when it comes back", () => {
    render(<StoryDemo locale="zh-CN" />);
    playToTyping();
    beat(3);
    const held = fieldText();

    act(() => {
      hidden = true;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    settle();
    expect(fieldText()).toBe(held);

    act(() => {
      hidden = false;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    beat(1);
    expect(fieldText()).toHaveLength(held.length + 1);
  });

  it("keeps the whole run inside its own box rather than scrolling the page", () => {
    render(<StoryDemo locale="zh-CN" />);
    const before = window.scrollY;
    play();
    settle();
    expect(window.scrollY).toBe(before);
  });

  it("changes the pane as the story leaves the map behind", () => {
    render(<StoryDemo locale="zh-CN" />);
    expect(stageKind()).toBe("map");
    expect(layout()).toBe("talk");

    goTo("protoOpen");
    expect(stageKind()).toBe("proto");
    expect(layout()).toBe("stage");

    goTo("outcome");
    expect(stageKind()).toBe("outcome");

    goTo("outcome");
    fireEvent.click(transport());
    flush();
    settle(40, 20_000);
    expect(layout()).toBe("wide");
    expect(screen.getByText(copy.open.question)).toBeTruthy();
  });

  it("jumps to a chapter with everything before it, and without the old line finishing itself", () => {
    render(<StoryDemo locale="zh-CN" />);
    playToTyping();
    beat(5);
    const abandoned = fieldText();
    expect(abandoned).toHaveLength(5);

    goTo("protoOpen");
    expect(document.querySelector(".scene-point")!.textContent).toContain(
      copy.chapters[chapterOf("protoOpen")].label,
    );
    expect(fieldText()).toBe("");
    beat(2);
    expect(fieldText().startsWith(abandoned)).toBe(false);
    // Every earlier turn is present exactly once, and nothing was sent twice.
    const lines = said();
    expect(new Set(lines).size).toBe(lines.length);
    expect(lines).not.toContain(abandoned);
    // The turns that came before are all there, collapsed history included.
    expect(said()).toContain(copy.turns.spark.user);
  });

  it("replays from the first scene with an empty field", () => {
    render(<StoryDemo locale="zh-CN" />);
    playToTyping();
    beat(6);
    fireEvent.click(stepButton());
    flush();
    expect(status()).toContain("第 1 / ");
    expect(fieldText()).toBe("");
    expect(turns()).toBe(2);
  });

  it("ends on the closing question and offers ways out that this page can honour", () => {
    render(<StoryDemo locale="zh-CN" />);
    play();
    settle(400, 2_000);
    expect(status()).toContain(site.finished);
    expect(screen.getByText(copy.open.question)).toBeTruthy();
    // No sign-up, no waitlist, no "generating": replay, the result, the output page,
    // and the source.
    const actions = [...document.querySelectorAll(".open-action")].map((el) => el.textContent);
    expect(actions).toEqual([copy.open.replay, copy.open.seeOutcome, copy.open.seeBrief, copy.open.repo]);

    fireEvent.click(screen.getByText(copy.open.seeOutcome));
    flush();
    expect(stageKind()).toBe("outcome");
  });
});

describe("the prototype is a real thing to use", () => {
  it("walks paste, sort, check, send, confirm and back, keeping the source of every item", () => {
    render(<StoryDemo locale="zh-CN" />);
    goTo("protoOpen");
    // While the walkthrough plays it is a picture: nothing to half-edit.
    expect(document.querySelector(".proto-raw-field")).toBeNull();
    fireEvent.click(document.querySelector(".stage-explore")!);
    flush();

    const raw = document.querySelector(".proto-raw-field") as HTMLTextAreaElement;
    expect(raw.value).toBe(copy.proto.raw);
    fireEvent.change(raw, { target: { value: "首页那个图换一张。\n价格表先不动。" } });
    fireEvent.click(document.querySelector(".proto-split")!);
    expect(protoItems()).toHaveLength(2);
    expect(itemText()).toContain("首页那个图换一张。");

    // Each item can be opened back to what the client actually wrote.
    fireEvent.click(document.querySelectorAll(".proto-quote-toggle")[0]);
    expect(document.querySelector(".proto-quote-text")!.textContent).toBe("首页那个图换一张。");

    // The designer corrects the wording, and leaves one item out of the client's page.
    const first = document.querySelectorAll(".proto-item-text")[0] as HTMLInputElement;
    fireEvent.change(first, { target: { value: "首页主图换一张更亮的" } });
    const checkboxes = document.querySelectorAll(".proto-item .proto-check input");
    fireEvent.click(checkboxes[1]);

    fireEvent.click(document.querySelector(".proto-send")!);
    expect(document.querySelector(".proto")!.getAttribute("data-view")).toBe("client");
    expect(document.querySelectorAll(".proto-client-list .proto-item")).toHaveLength(1);

    // Compact presentation never changes which items the client can see.
    fireEvent.click(document.querySelector(".proto-foot .proto-check input")!);
    expect(document.querySelectorAll(".proto-client-list .proto-item")).toHaveLength(1);
    expect(document.querySelector(".proto-progress")!.textContent).toContain("0");

    fireEvent.click(document.querySelector(".proto-confirm")!);
    expect(document.querySelector(".proto-decided")!.textContent).toBe(copy.proto.confirmed);
    expect(document.querySelector(".proto-progress")!.textContent).toContain("1");

    // And the designer sees the state when they come back.
    fireEvent.click(document.querySelector(".proto-back")!);
    expect(document.querySelector(".proto")!.getAttribute("data-view")).toBe("designer");
    expect(document.querySelector('.proto-item[data-status="confirmed"]')).toBeTruthy();
  });

  it("pauses playback the moment the visitor touches it", () => {
    render(<StoryDemo locale="zh-CN" />);
    play();
    goTo("protoOpen");
    const before = document.querySelectorAll(".chat-asked").length;
    fireEvent.click(document.querySelector(".stage-explore")!);
    flush();
    expect(status()).toContain(copy.ui.exploring);
    settle();
    expect(document.querySelectorAll(".chat-asked").length).toBe(before);
  });
});

describe("client confirmation boundaries", () => {
  it("excludes private notes and unchecked items even before the compact-view scene", () => {
    render(<StoryDemo locale="zh-CN" />);
    goTo("protoOpen");
    fireEvent.click(document.querySelector(".stage-explore")!);
    fireEvent.click(document.querySelector(".proto-send")!);
    expect(document.querySelectorAll(".proto-client-list .proto-item")).toHaveLength(3);
    expect(document.querySelector(".proto-client-list")!.textContent).not.toContain(copy.proto.items[3].text);
    for (const item of copy.proto.items.filter(item => item.note)) {
      expect(document.querySelector(".proto-client-list")!.textContent).not.toContain(item.note);
    }
    expect(document.querySelectorAll(".proto-client-list .proto-quote-text")).toHaveLength(3);
    fireEvent.click(document.querySelector(".proto-foot .proto-check input")!);
    expect(document.querySelectorAll(".proto-client-list .proto-item")).toHaveLength(3);
    expect(document.querySelector(".proto-client-list .proto-quote-text")).toBeNull();
  });

  it("requires fresh confirmation after editing, while preserving other confirmations and the original quote", () => {
    render(<StoryDemo locale="zh-CN" />);
    goTo("protoOpen");
    fireEvent.click(document.querySelector(".stage-explore")!);
    fireEvent.click(document.querySelector(".proto-send")!);
    fireEvent.click(document.querySelectorAll(".proto-confirm")[0]);
    fireEvent.click(document.querySelectorAll(".proto-confirm")[0]);
    fireEvent.click(document.querySelector(".proto-back")!);
    fireEvent.change(document.querySelector("input.proto-item-text")!, {target:{value:"A new request, not yet agreed"}});
    fireEvent.click(document.querySelector(".proto-send")!);
    const items = document.querySelectorAll(".proto-client-list .proto-item");
    expect(items[0].getAttribute("data-status")).toBe("new");
    expect(items[0].textContent).toContain(copy.proto.items[0].quote);
    expect(items[0].querySelector(".proto-confirm")).toBeTruthy();
    expect(items[1].getAttribute("data-status")).toBe("confirmed");
    fireEvent.click(items[0].querySelector(".proto-confirm")!);
    expect(document.querySelectorAll('.proto-client-list [data-status="confirmed"].proto-item')).toHaveLength(2);
  });
});

describe("the three directions", () => {
  it("answers each one with something meaningful and comes back without losing the screen", () => {
    render(<StoryDemo locale="zh-CN" />);
    goTo("directions");
    expect(stageKind()).toBe("decide");

    for (const option of copy.decide.options) {
      fireEvent.click(screen.getByText(option.label));
      flush();
      expect(screen.getByText(copy.decide.feedbackTitle[option.id])).toBeTruthy();
      for (const line of copy.decide.feedback[option.id]) expect(screen.getByText(line)).toBeTruthy();
      fireEvent.click(screen.getByText(copy.decide.back));
      flush();
      // Back to the same screen, still on the same scene.
      expect(document.querySelector(".decide-feedback")).toBeNull();
      expect(stageKind()).toBe("decide");
    }
  });

  it("stops playback rather than moving on under the visitor", () => {
    render(<StoryDemo locale="zh-CN" />);
    play();
    goTo("directions");
    fireEvent.click(screen.getByText(copy.decide.options[0].label));
    flush();
    const shown = stageKind();
    settle();
    expect(stageKind()).toBe(shown);
    expect(status()).toContain(copy.ui.exploring);
  });
});

describe("watching and exploring stay separate", () => {
  it("keeps what the visitor typed across a replay and a chapter jump", () => {
    render(<StoryDemo locale="zh-CN" />);
    goTo("protoOpen");
    fireEvent.click(document.querySelector(".stage-explore")!);
    flush();
    fireEvent.change(document.querySelector(".proto-raw-field")!, {
      target: { value: "我自己粘的一段留言。" },
    });
    fireEvent.click(document.querySelector(".proto-split")!);
    expect(itemText()).toContain("我自己粘的一段留言。");

    // Replaying resets the walkthrough, never the visitor's own work.
    fireEvent.click(exploreToggle());
    flush();
    fireEvent.click(stepButton());
    flush();
    expect(status()).toContain("第 1 / ");
    expect(itemText()).not.toContain("我自己粘的一段留言。");

    goTo("protoOpen");
    fireEvent.click(exploreToggle());
    flush();
    expect(itemText()).toContain("我自己粘的一段留言。");
  });

  it("never lets the visitor's own screen turn up in the fixed walkthrough", () => {
    render(<StoryDemo locale="zh-CN" />);
    goTo("protoOpen");
    fireEvent.click(document.querySelector(".stage-explore")!);
    flush();
    fireEvent.change(document.querySelector(".proto-item-text")!, {
      target: { value: "我改写过的修改项" },
    });
    expect(itemText()).toContain("我改写过的修改项");

    fireEvent.click(exploreToggle());
    flush();
    expect(itemText()).not.toContain("我改写过的修改项");
    fireEvent.click(transport());
    beat(4);
    expect(itemText()).not.toContain("我改写过的修改项");
  });

  it("comes back to the scene it was left on, stopped rather than running", () => {
    render(<StoryDemo locale="zh-CN" />);
    playToTyping();
    beat(4);
    const held = fieldText();

    fireEvent.click(exploreToggle());
    flush();
    settle();

    fireEvent.click(exploreToggle());
    flush();
    expect(status()).toContain(site.paused);
    expect(fieldText()).toBe(held);
    fireEvent.click(transport());
    beat(1);
    expect(fieldText()).toHaveLength(held.length + 1);
  });
});

describe("reduced motion", () => {
  it("replaces typing and autoplay with whole steps that never advance on their own", () => {
    motion = "reduce";
    render(<StoryDemo locale="zh-CN" />);
    fireEvent.click(document.querySelector(".demo-cta")!);
    flush();
    expect(transport().textContent).toContain(site.nextStep);

    const before = turns();
    settle();
    expect(turns()).toBe(before);

    fireEvent.click(transport());
    flush();
    // The whole turn arrives at once: the question, the answer, nothing half-typed.
    expect(turns()).toBeGreaterThan(before);
    expect(fieldText()).toBe("");
    expect(said()).toContain(spoken.typed.join(""));
    expect(status()).toContain(`第 2 / ${scenes.length} 步`);
  });

  it("shows the whole story and offers a way back to step one at the end", () => {
    motion = "reduce";
    render(<StoryDemo locale="zh-CN" />);
    fireEvent.click(document.querySelector(".demo-cta")!);
    flush();
    for (let i = 0; i < scenes.length + 2; i += 1) {
      if (transport().textContent?.includes(site.nextStep)) fireEvent.click(transport());
      flush();
    }
    expect(status()).toContain(site.finished);
    // Nothing was skipped: the closing question is on screen, reachable without motion.
    expect(screen.getByText(copy.open.question)).toBeTruthy();
    expect(transport().textContent).toContain(site.restartSteps);

    fireEvent.click(transport());
    flush();
    expect(status()).toContain(`第 1 / ${scenes.length} 步`);
    settle();
    expect(status()).toContain(`第 1 / ${scenes.length} 步`);
  });
});
