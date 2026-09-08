// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PaperFilm } from "./PaperFilm";
import { paperCopy } from "./paperCopy";
import { CHAPTER_STARTS, DURATION, LAST_FRAME, chapterAt, chapterStill, quantize } from "./paperTimeline";

const copy = paperCopy["zh-CN"];
let requests: Map<number, FrameRequestCallback>;
let sequence: number;
let now: number;
let hidden: boolean;
let reduced: boolean;
let motion: (() => void) | undefined;
let intersect: ((entries: { isIntersecting: boolean }[]) => void) | undefined;

beforeEach(() => {
  requests = new Map(); sequence = 0; now = 0; hidden = false; reduced = false;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = ++sequence; requests.set(id, callback); return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => requests.delete(id));
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reduced; },
    addEventListener: (_: string, listener: () => void) => { motion = listener; },
    removeEventListener() {},
  }));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: (entries: { isIntersecting: boolean }[]) => void) { intersect = callback; }
    observe() {} disconnect() {}
  });
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); intersect = undefined; motion = undefined; });

function tick(ms = 1000) {
  now += ms;
  act(() => {
    const frame = [...requests.values()];
    requests.clear();
    frame.forEach((callback) => callback(now));
  });
}
/* One animation frame may carry at most one twelfth of a second, so a stalled tab
 * cannot make the film jump. Playing for N seconds therefore means N × 12 frames. */
function run(seconds: number) {
  const step = 1000 / 12;
  for (let frame = 0; frame < Math.ceil(seconds * 12); frame++) tick(step);
}
const slider = () => screen.getByRole("slider") as HTMLInputElement;
const seek = (seconds: number) => fireEvent.change(slider(), { target: { value: String(seconds) } });
const stage = () => document.querySelector(".gip-stage") as HTMLElement;
const play = () => fireEvent.click(screen.getAllByRole("button", { name: new RegExp(`^${copy.ui.play}`) })[0]);
const pause = () => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${copy.ui.pause}`) }));
const setViewport = (visible: boolean) => act(() => intersect?.([{ isIntersecting: visible }]));

describe("the landing page's film", () => {
  it("opens on a readable frame rather than an empty desk, and only plays when asked", () => {
    render(<PaperFilm locale="zh-CN" />);
    expect(requests.size).toBe(0);
    // The poster holds the moment the story is actually about.
    expect(screen.getByText(copy.opening.questions[0])).toBeTruthy();
    expect(screen.getByText(copy.opening.thought)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(copy.ui.poster) }));
    tick(); run(2);
    expect(Number(slider().value)).toBeCloseTo(2, 1);
  });

  it("freezes every part of the picture while paused", () => {
    render(<PaperFilm locale="zh-CN" />);
    play();
    tick(); run(20);
    pause();
    const frozen = stage().innerHTML;
    tick(6000);
    expect(stage().innerHTML).toBe(frozen);
    expect(requests.size).toBe(0);
  });

  it("suspends while off screen or in a background tab, and resumes where it stopped", () => {
    render(<PaperFilm locale="zh-CN" />);
    play();
    tick(); run(4);
    const left = Number(slider().value);

    setViewport(false);
    expect(requests.size).toBe(0);
    run(9);
    expect(Number(slider().value)).toBe(left);
    setViewport(true);
    tick(); run(1);
    expect(Number(slider().value)).toBeCloseTo(left + 1, 1);

    act(() => { hidden = true; document.dispatchEvent(new Event("visibilitychange")); });
    expect(requests.size).toBe(0);
    act(() => { hidden = false; document.dispatchEvent(new Event("visibilitychange")); });
    tick(); run(0.5);
    expect(Number(slider().value)).toBeGreaterThan(left + 1);
  });

  it("never restarts playback the visitor stopped", () => {
    render(<PaperFilm locale="zh-CN" />);
    play();
    tick(); run(3);
    pause();
    const stopped = Number(slider().value);
    // Scrolling away and back must not undo an explicit pause.
    setViewport(false);
    setViewport(true);
    run(4);
    expect(requests.size).toBe(0);
    expect(Number(slider().value)).toBe(stopped);
  });

  it("pauses when the visitor drags, and lands on exactly the frame they chose", () => {
    render(<PaperFilm locale="zh-CN" />);
    play();
    tick(); run(2);
    seek(48);
    expect(requests.size).toBe(0);
    expect(Number(slider().value)).toBeCloseTo(48, 1);
    // The confirmed draft is on screen at that second, and stays there.
    expect(screen.getByText(copy.product.revised[0])).toBeTruthy();
    const frame = stage().innerHTML;
    seek(0); seek(48);
    expect(stage().innerHTML).toBe(frame);
  });

  it("replays from the beginning and reaches the end once", () => {
    render(<PaperFilm locale="zh-CN" />);
    play();
    tick(); run(30);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${copy.ui.replay}`) }));
    expect(Number(slider().value)).toBe(0);
    tick(); run(DURATION + 1);
    // The last frame is the last quantised step, not a fractional second past it.
    expect(Number(slider().value)).toBe(quantize(DURATION));
    // Without looping it stops at the end and offers to play again.
    expect(requests.size).toBe(0);
    expect(screen.getByText(copy.brand.lines[1])).toBeTruthy();
  });

  it("says it has finished, and the main control replays from the start", () => {
    render(<PaperFilm locale="zh-CN" />);
    play();
    tick(); run(DURATION + 1);
    expect(requests.size).toBe(0);
    expect(Number(slider().value)).toBe(LAST_FRAME);

    /* The read-out states the length the page promises, not the last whole second
     * before it: the clock is raw and the picture is quantised, and the two disagree
     * by less than a frame at the end. */
    const readout = document.querySelector(".gip-time") as HTMLElement;
    expect(readout.textContent).toBe(`${Math.round(DURATION)} / ${Math.round(DURATION)}`);

    // And the main control offers to replay rather than to play a film that has ended.
    const main = document.querySelector(".gip-play") as HTMLButtonElement;
    expect(main.textContent).toContain(copy.ui.replay);
    fireEvent.click(main);
    expect(Number(slider().value)).toBe(0);
    tick(); run(2);
    expect(Number(slider().value)).toBeCloseTo(2, 1);
  });

  it("leaves the page's own keyboard alone", () => {
    const listeners: string[] = [];
    const add = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation((type: string, ...rest: unknown[]) => {
      listeners.push(type);
      return add(type as keyof WindowEventMap, ...(rest as [EventListenerOrEventListenerObject]));
    });
    render(<PaperFilm locale="zh-CN" />);
    expect(listeners).not.toContain("keydown");
    expect(listeners).not.toContain("keyup");
  });

  it("reads as static scenes when the visitor asked for less motion", () => {
    reduced = true;
    render(<PaperFilm locale="zh-CN" />);
    expect(requests.size).toBe(0);
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.getByText(copy.ui.reduced)).toBeTruthy();
    // The opening still is readable, not a blank first frame.
    expect(screen.getByText(copy.opening.corner)).toBeTruthy();

    const next = screen.getByRole("button", { name: new RegExp(copy.ui.nextScene) });
    for (let step = 1; step < CHAPTER_STARTS.length; step++) fireEvent.click(next);
    expect(screen.getByText(copy.brand.lines[0])).toBeTruthy();
    expect(requests.size).toBe(0);
    expect(chapterAt(chapterStill(CHAPTER_STARTS.length - 1))).toBe(CHAPTER_STARTS.length - 1);
  });

  it("switches to reduced motion mid-playback without jumping past the story", () => {
    render(<PaperFilm locale="zh-CN" />);
    play();
    tick(); run(5);
    act(() => { reduced = true; motion?.(); });
    expect(requests.size).toBe(0);
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("gives the whole picture one description and a text version of every scene", () => {
    render(<PaperFilm locale="zh-CN" />);
    expect(stage().getAttribute("aria-label")).toBe(copy.ui.stageAlt);
    expect(document.querySelector(".gip-scene")?.getAttribute("aria-hidden")).toBe("true");
    copy.chapters.forEach((label) => expect(screen.getAllByText(label).length).toBeGreaterThan(0));
    copy.chapterNotes.forEach((note) => expect(screen.getByText(note, { exact: false })).toBeTruthy());
  });

  it("tells the same story in every language it ships", () => {
    for (const locale of ["en", "ja"] as const) {
      cleanup();
      render(<PaperFilm locale={locale} />);
      const t = paperCopy[locale];
      expect(screen.getByText(t.opening.thought)).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: new RegExp(t.ui.poster) }));
      /* jsdom reports a zero-width container, so this is the phone composition, which
         shows one block at a time: GoodIdea's card carries the three signed
         contributions while it is open... */
      seek(41);
      expect(screen.getByText(t.fusion.shared)).toBeTruthy();
      expect(screen.getByText(t.fusion.result)).toBeTruthy();
      expect(screen.getByText(t.fusion.chips[0])).toBeTruthy();
      // ...and once it has closed the decision has the screen to itself, naming where
      // it came from on the card rather than repeating it in a strip above.
      seek(45);
      expect(screen.queryByText(t.rail.summary[4])).toBeNull();
      expect(screen.getByText(t.product.proposal)).toBeTruthy();
      expect(screen.getByText(t.product.button)).toBeTruthy();
      expect(screen.getByText(t.workspace.evidence)).toBeTruthy();
    }
  });
});
