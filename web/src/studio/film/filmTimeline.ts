export const FILM_SECONDS = 60;
export const CHAPTER_STARTS = [0, 8, 17, 28, 37, 46, 54, 60] as const;
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function filmFrame(seconds: number) {
  const time = clamp(seconds, 0, FILM_SECONDS);
  const chapter = CHAPTER_STARTS.filter((start) => time >= start).length - 1;
  const start = CHAPTER_STARTS[chapter];
  const duration = chapter === 7 ? 0 : CHAPTER_STARTS[chapter + 1] - start;
  return { time, chapter, local: time - start, progress: duration ? (time - start) / duration : 1 };
}

/** Manual chapter navigation opens a readable, settled frame. */
export function chapterStill(chapter: number) {
  const index = clamp(chapter, 0, 7);
  return index === 7 ? FILM_SECONDS : CHAPTER_STARTS[index + 1] - 1;
}
