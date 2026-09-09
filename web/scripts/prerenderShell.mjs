// Google indexes what the first response body contains, and a bare `<div id="root">`
// contains nothing: no heading, no prose, no internal links. Everything below is the
// same copy React renders, written into the container at build time so a crawler that
// stops before running the bundle still reads a whole page.
//
// This is markup only — no state, no handlers, no interaction. React replaces the
// container on mount, so the shell never has to stay in sync beyond the text itself,
// which is read from the one source both sides share.
import { transform } from "esbuild";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "src");

// Neither module imports anything, so transpiling in place is enough to read them
// from Node without pulling a bundler into the build.
async function loadModule(...segments) {
  const source = await readFile(join(src, ...segments), "utf8");
  const { code } = await transform(source, { loader: "ts", format: "esm" });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}

export async function loadCopy() {
  const [{ siteCopy, withSeconds }, { PAPER_SECONDS }] = await Promise.all([
    loadModule("siteCopy.ts"),
    loadModule("studio", "paper", "paperTimeline.ts"),
  ]);
  return { siteCopy, withSeconds, seconds: PAPER_SECONDS };
}

const escape = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const REPO = "https://github.com/forge-context/goodidea-agent";

// The same underline React draws under the words that carry the promise. The shell is
// what a visitor sees before the bundle runs, so the headline has to arrive already
// marked rather than gaining its accent a moment later. `App.tsx` holds the reasoning.
const markPromise = (line, mark) => {
  const at = mark ? line.indexOf(mark) : -1;
  if (at < 0) return escape(line);
  return `${escape(line.slice(0, at))}<b class="hero-mark">${escape(mark)}</b>${escape(line.slice(at + mark.length))}`;
};

const BRAND_MARK = `<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36"><path class="brand-loop" d="M26.4 10.8A10.5 10.5 0 1 0 27.7 24" /><path class="brand-turn" d="M18.8 18.2h8.7v7.5" /><circle class="brand-spark" cx="28.3" cy="7.6" r="2.5" /></svg></span>`;
const ARROW_DOWN = `<svg class="action-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5v12.2m0 0-4-4m4 4 4-4" /></svg>`;
const ARROW_UP = `<svg class="action-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16.5V4.3m0 0-4 4m4-4 4 4" /></svg>`;
const SCROLL_HINT = `<svg class="hero-scroll-arrow" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 2v23m0 0-7-7.4m7 7.4 7-7.4" /></svg>`;
const ARROW_UP_RIGHT = `<svg class="action-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5.2 14.8 14.8 5.2M7.2 5.2h7.6v7.6" /></svg>`;

/**
 * @param t         the locale's copy, from `siteCopy`
 * @param locale    which locale this page serves
 * @param homePath  where English lives, so the shell links at the canonical page
 *                  rather than at a URL that only points elsewhere
 */
export function renderShell(t, { locale, homePath, seconds, withSeconds }) {
  const localePath = { en: homePath, ja: "/ja/", "zh-CN": "/zh-cn/" };
  const active = (code) => (locale === code ? ' class="active"' : "");
  const seconded = (text) => escape(withSeconds(text, seconds));

  return `<a class="skip-link" href="#main">${escape(t.skip)}</a>
      <header class="site-header">
        <a class="brand" href="${localePath[locale]}">${BRAND_MARK}<span>GoodIdea</span></a>
        <nav aria-label="${escape(t.primaryNavigationLabel)}">
          <a href="#demo">${escape(t.nav.demo)}</a>
          <a href="#brief">${escape(t.nav.brief)}</a>
          <a href="#how">${escape(t.nav.how)}</a>
          <a href="${REPO}">${escape(t.nav.github)}</a>
        </nav>
        <div class="locale-switch" aria-label="${escape(t.languageLabel)}">
          <a${active("en")} href="${homePath}" hreflang="en" lang="en">EN</a>
          <a${active("ja")} href="/ja/" hreflang="ja" lang="ja">JA</a>
          <a${active("zh-CN")} href="/zh-cn/" hreflang="zh-CN" lang="zh-CN">中文</a>
        </div>
      </header>
      <main id="main">
        <section class="hero section-shell" id="top">
          <div class="hero-lead">
          <div class="hero-copy">
            <p class="eyebrow">${escape(t.heroEyebrow)}</p>
            <h1>${t.heroTitle.map((line) => `<span>${markPromise(line, t.heroTitleMark)}</span>`).join("")}</h1>
            <p class="hero-intro">${t.heroIntro.map((line) => `<span>${escape(line)}</span>`).join("")}</p>
            <div class="hero-actions">
              <a class="button button-primary" href="#demo">${escape(t.heroPrimary)}${ARROW_DOWN}</a>
              <a class="hero-aside-link" href="#brief">${escape(t.heroSecondary)}${ARROW_UP_RIGHT}</a>
            </div>
            <p class="hero-length">${seconded(t.heroPrimaryNote)}</p>
          </div>
          <!-- One picture with one description. The image itself is in the shell so
               the browser starts fetching the hero artwork from the first response
               rather than after the bundle runs; React replaces the container on
               mount and the file is already in cache. -->
          <div class="hero-scene" role="img" aria-label="${escape(t.scene.alt)}">
            <div class="hero-art">
              <img class="hero-art-image" src="/hero/goodidea-hero-illustration.webp" width="1374" height="1145" alt="" fetchpriority="high" decoding="async" />
            </div>
          </div>
          </div>
          <a class="hero-scroll" href="#demo" data-onscreen="true">${escape(t.heroScrollCue)}${SCROLL_HINT}</a>
        </section>
        <section class="demo-section" id="demo">
          <div class="section-shell">
            <div class="section-heading">
              <p class="eyebrow">${escape(t.demoEyebrow)}</p>
              <h2>${escape(t.demoTitle)}</h2>
              <p class="section-lead">${seconded(t.demoIntro)}</p>
            </div>
          </div>
        </section>
        <section class="brief-section" id="brief">
          <div class="section-shell">
            <div class="section-heading">
              <p class="eyebrow">${escape(t.briefEyebrow)}</p>
              <h2>${escape(t.briefTitle)}</h2>
              <p class="section-lead">${escape(t.briefIntro)}</p>
            </div>
            <p class="brief-scenario">${escape(t.briefScenarioNote)}</p>
          </div>
        </section>
        <section class="work-section section-shell" id="how">
          <div class="section-heading">
            <p class="eyebrow">${escape(t.workEyebrow)}</p>
            <h2>${escape(t.workTitle)}</h2>
            <p class="section-lead">${escape(t.workIntro)}</p>
          </div>
          <ol class="work-steps">
            ${t.workSteps
              .map(
                (item) =>
                  `<li><span>${escape(item.number)}</span><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></li>`,
              )
              .join("\n            ")}
          </ol>
          <dl class="work-principles">
            ${t.workPrinciples
              .map((item) => `<div><dt>${escape(item.term)}</dt><dd>${escape(item.text)}</dd></div>`)
              .join("\n            ")}
          </dl>
          <p class="work-vision">${escape(t.workVision)}</p>
        </section>
        <section class="closing-section" id="start">
          <div class="section-shell closing-panel">
            <p class="eyebrow">${escape(t.closingEyebrow)}</p>
            <h2>${escape(t.closingTitle)}</h2>
            <p class="closing-lead">${seconded(t.closingText)}</p>
            <div class="closing-actions">
              <a class="button button-primary" href="#demo">${escape(t.closingPrimary)}${ARROW_UP}</a>
              <a class="button button-quiet" href="#brief">${escape(t.closingSecondary)}${ARROW_UP}</a>
            </div>
            <p class="closing-scope">${escape(t.trustScope)}</p>
            <a class="closing-source" href="${escape(t.trustLinkHref)}">${escape(t.trustLink)}${ARROW_UP_RIGHT}</a>
          </div>
        </section>
      </main>
      <footer>
        <a class="brand" href="#top">${BRAND_MARK}<span>GoodIdea</span></a>
        <p>${escape(t.footer)}</p>
        <a href="${REPO}">github.com/forge-context/goodidea-agent ↗</a>
      </footer>`;
}
