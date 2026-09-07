// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FilmDemo } from "./FilmDemo";
import { CHAPTER_STARTS, chapterStill, filmFrame } from "./filmTimeline";
import { filmCopy } from "./filmCopy";
import { storyCopy } from "../story/storyCopy";

const copy = filmCopy["zh-CN"];
let requests: Map<number, FrameRequestCallback>;
let sequence: number;
let now: number;
let hidden: boolean;
let reduced: boolean;
let motion: () => void;

beforeEach(() => {
  requests = new Map(); sequence = 0; now = 0; hidden = false; reduced = false;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { const id = ++sequence; requests.set(id, callback); return id; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => requests.delete(id));
  vi.stubGlobal("matchMedia", () => ({ get matches() { return reduced; }, addEventListener: (_: string, listener: () => void) => { motion = listener; }, removeEventListener() {} }));
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function tick(ms = 1000) {
  now += ms;
  act(() => { const frame = [...requests.values()]; requests.clear(); frame.forEach((callback) => callback(now)); });
}
const slider = () => screen.getByRole("slider") as HTMLInputElement;
const seek = (seconds: number) => fireEvent.change(slider(), { target: { value: seconds } });
const player = () => document.querySelector(".film") as HTMLElement;

describe("the public concept film", () => {
  it("holds a useful opening, plays to the ending, and freezes every visual when paused", () => {
    render(<FilmDemo locale="zh-CN" />);
    expect(requests.size).toBe(0);
    expect(screen.getByText(storyCopy["zh-CN"].proto.items[0].quote)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^播放/ }));
    tick(); tick(2200);
    expect(Number(slider().value)).toBe(2.2);
    fireEvent.click(screen.getByRole("button", { name: /^暂停/ }));
    const before = player().innerHTML;
    tick(5000);
    expect(player().innerHTML).toBe(before);
    expect(requests.size).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: /^播放/ }));
    tick(); tick(58000);
    expect(slider().value).toBe("60");
    expect(player().dataset.chapter).toBe("7");
    expect(requests.size).toBe(0);
    expect(screen.getByText(copy.question)).toBeTruthy();
  });

  it("excludes time spent in a hidden tab and maintains one frame request", () => {
    render(<FilmDemo locale="zh-CN" />);
    fireEvent.click(screen.getByRole("button", { name: /^播放/ }));
    tick(); tick(4000);
    expect(requests.size).toBe(1);
    act(() => { hidden = true; document.dispatchEvent(new Event("visibilitychange")); });
    expect(requests.size).toBe(0);
    tick(30000);
    expect(slider().value).toBe("4");
    act(() => { hidden = false; document.dispatchEvent(new Event("visibilitychange")); });
    tick(); tick(2000);
    expect(slider().value).toBe("6");
    expect(requests.size).toBe(1);
  });

  it("seeks without playing and rebuilds confirmation before its project receipt", () => {
    render(<FilmDemo locale="zh-CN" />);
    seek(55);
    expect(document.querySelectorAll('[data-done="true"]').length).toBe(0);
    seek(56.5);
    expect(document.querySelectorAll('[data-done="true"]').length).toBe(1);
    expect((document.querySelector('.film-receipt') as HTMLElement).style.opacity).toBe("0");
    seek(59);
    expect((document.querySelector('.film-receipt') as HTMLElement).style.opacity).toBe("1");
    seek(18);
    expect(document.querySelector('.film-receipt')).toBeNull();
    expect(requests.size).toBe(0);
  });

  it("preserves prototype edits across close, replay and chapter navigation", () => {
    render(<FilmDemo locale="zh-CN" />);
    fireEvent.click(screen.getByRole("button", { name: /亲手试试原型/ })); tick();
    fireEvent.change(screen.getAllByRole("textbox", { name: storyCopy["zh-CN"].proto.itemText })[0], { target: { value: "MY LOCAL EDIT" } });
    fireEvent.click(screen.getByRole("button", { name: /收起原型/ }));
    fireEvent.click(screen.getByRole("button", { name: copy.replay })); tick();
    seek(20);
    expect(player().textContent).not.toContain("MY LOCAL EDIT");
    fireEvent.click(screen.getByRole("button", { name: /亲手试试原型/ })); tick();
    expect((screen.getAllByRole("textbox", { name: storyCopy["zh-CN"].proto.itemText })[0] as HTMLInputElement).value).toBe("MY LOCAL EDIT");
    expect(player().dataset.playing).toBe("false");
  });

  it("supports reduced motion at load and when the setting changes during playback", () => {
    reduced = true;
    const { unmount } = render(<FilmDemo locale="zh-CN" />);
    expect(slider().value).toBe(String(chapterStill(0)));
    for(let chapter = 1; chapter <= 7; chapter++) {
      fireEvent.click(screen.getByRole("button", { name: /^下一幕/ }));
      expect(player().dataset.chapter).toBe(String(chapter));
      expect(requests.size).toBe(0);
    }
    fireEvent.click(screen.getByRole("button", { name: /^重播/ }));
    expect(player().dataset.chapter).toBe("0");
    unmount(); reduced = false;
    render(<FilmDemo locale="zh-CN" />);
    fireEvent.click(screen.getByRole("button", { name: /^播放/ })); tick(); tick(19500);
    act(() => { reduced = true; motion(); });
    expect(slider().value).toBe(String(chapterStill(2)));
    expect(requests.size).toBe(0);
    expect(screen.getByText(copy.reduced)).toBeTruthy();
  });

  it("keeps the translated stories on the same 60-second timeline", () => {
    for(const locale of ["zh-CN", "en", "ja"] as const) {
      expect(filmCopy[locale].chapters).toHaveLength(CHAPTER_STARTS.length);
      for(let chapter=0;chapter<8;chapter++) expect(filmFrame(chapterStill(chapter)).chapter).toBe(chapter);
    }
    expect(filmFrame(-10).chapter).toBe(0);
    expect(filmFrame(100).time).toBe(60);
  });
});
