/* The one place that says which modules can put a character on the screen.
 *
 * `build-fonts.mjs` bundles this file and walks whatever it returns, so a subset is
 * cut from the copy itself rather than from a character list somebody maintained by
 * hand. If a new source of visible text is added to the page, add it here too — a
 * character missing from the subset falls back to a system face, which is exactly the
 * mixed setting the type system exists to stop.
 */

import { siteCopy, type Locale } from "../src/siteCopy";
import { paperCopy } from "../src/studio/paper/paperCopy";
import { buildPaperBrief } from "../src/studio/paper/paperBrief";

const LOCALES: Locale[] = ["en", "ja", "zh-CN"];

export function copyByLocale(): Record<Locale, unknown> {
  const out = {} as Record<Locale, unknown>;
  for (const locale of LOCALES) {
    out[locale] = [siteCopy[locale], paperCopy[locale], buildPaperBrief(locale)];
  }
  return out;
}
