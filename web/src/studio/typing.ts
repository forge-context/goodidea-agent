/* How the watched walkthrough types.
 *
 * Two things live here and nowhere else: how a line is cut into the characters a
 * reader actually sees, and how long every beat of a turn lasts. Both are plain
 * data so the playback machine stays testable and the pacing stays debuggable —
 * one number to change, one place to change it.
 */

import type { Locale } from "../siteCopy";

/* A "character" is what the reader sees, not what the string stores. `Intl.Segmenter`
 * keeps a family emoji, a flag, or a combining mark whole; `Array.from` already keeps
 * surrogate pairs whole and is the fallback where the API is missing. Neither ever
 * splits Chinese or Japanese, which are one code point per glyph. */
const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

export function segmentsOf(text: string): string[] {
  if (!segmenter) return Array.from(text);
  return Array.from(segmenter.segment(text), (part) => part.segment);
}

export type Pace = {
  /** Milliseconds between two typing ticks. */
  tickMs: number;
  /** Characters revealed per tick. English needs more per tick to read as one speed. */
  perTick: number;
  /** The finished line sits in the field before it is sent. */
  pendingMs: number;
  /** The sent turn lands on its own before the answer starts. */
  sentMs: number;
  /** The reading hold after an answer: a floor, a per-character weight, and a ceiling. */
  readBaseMs: number;
  readCharMs: number;
  readMinMs: number;
  readMaxMs: number;
};

/* Tuned per language rather than per string: the same turn is 30 characters of
 * Chinese and 100 of English, so a single characters-per-second would type one of
 * them at a crawl and the other faster than it can be read. */
export const pace: Record<Locale, Pace> = {
  "zh-CN": {
    tickMs: 82,
    perTick: 1,
    pendingMs: 460,
    sentMs: 320,
    readBaseMs: 620,
    readCharMs: 104,
    readMinMs: 2000,
    readMaxMs: 4900,
  },
  ja: {
    tickMs: 68,
    perTick: 1,
    pendingMs: 460,
    sentMs: 320,
    readBaseMs: 620,
    readCharMs: 74,
    readMinMs: 2000,
    readMaxMs: 4900,
  },
  en: {
    tickMs: 60,
    perTick: 2,
    pendingMs: 460,
    sentMs: 320,
    readBaseMs: 620,
    readCharMs: 34,
    readMinMs: 2000,
    readMaxMs: 4900,
  },
};

/** How long the line takes to appear, once it is cut into visible characters. */
export function typingMs(locale: Locale, characters: number): number {
  const { tickMs, perTick } = pace[locale];
  return Math.ceil(characters / perTick) * tickMs;
}

/** How long an answer stays on screen before the next turn starts. */
export function readingMs(locale: Locale, characters: number): number {
  const { readBaseMs, readCharMs, readMinMs, readMaxMs } = pace[locale];
  return Math.min(readMaxMs, Math.max(readMinMs, readBaseMs + characters * readCharMs));
}
