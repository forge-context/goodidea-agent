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

const BRAND_MARK = `<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36"><path class="brand-loop" d="M26.4 10.8A10.5 10.5 0 1 0 27.7 24" /><path class="brand-turn" d="M18.8 18.2h8.7v7.5" /><circle class="brand-spark" cx="28.3" cy="7.6" r="2.5" /></svg></span>`;
const ARROW_DOWN = `<svg class="action-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5v12.2m0 0-4-4m4 4 4-4" /></svg>`;
const ARROW_UP = `<svg class="action-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16.5V4.3m0 0-4 4m4-4 4 4" /></svg>`;
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
          <a href="#brief">${escape(t.nav.brief)}</a>
          <a href="#demo">${escape(t.nav.demo)}</a>
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
        <section class="map-hero section-shell" id="top">
          <div class="map-copy">
            <p class="eyebrow">${escape(t.heroEyebrow)}</p>
            <h1>${escape(t.heroTitle)}</h1>
            <p class="hero-intro">${escape(t.heroIntro)}</p>
            <div class="hero-actions">
              <div>
                <a class="button button-primary" href="#demo">${seconded(t.heroPrimary)}${ARROW_DOWN}</a>
                <small>${escape(t.heroPrimaryNote)}</small>
              </div>
              <div>
                <a class="button button-quiet" href="#brief">${escape(t.heroSecondary)}${ARROW_DOWN}</a>
                <small>${escape(t.heroSecondaryNote)}</small>
              </div>
            </div>
          </div>
          <div class="map-stage" aria-hidden="true"></div>
        </section>
        <section class="brief-section" id="brief">
          <div class="section-shell">
            <div class="section-heading">
              <div>
                <p class="eyebrow">${escape(t.briefEyebrow)}</p>
                <h2>${escape(t.briefTitle)}</h2>
              </div>
              <p>${escape(t.briefIntro)}</p>
            </div>
          </div>
        </section>
        <section class="demo-section" id="demo">
          <div class="section-shell">
            <div class="section-heading">
              <div>
                <p class="eyebrow">${escape(t.demoEyebrow)}</p>
                <h2>${escape(t.demoTitle)}</h2>
              </div>
              <p>${seconded(t.demoIntro)}</p>
            </div>
          </div>
        </section>
        <section class="how-section section-shell" id="how">
          <div class="section-heading compact">
            <div><p class="eyebrow">${escape(t.howEyebrow)}</p><h2>${escape(t.howTitle)}</h2></div>
          </div>
          <div class="how-grid">
            ${t.howItems
              .map(
                (item) =>
                  `<article><span>${escape(item.number)}</span><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></article>`,
              )
              .join("\n            ")}
          </div>
        </section>
        <section class="trust-section section-shell" id="trust">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">${escape(t.trustEyebrow)}</p>
              <h2>${escape(t.trustTitle)}</h2>
              <p class="trust-intro">${escape(t.trustIntro)}</p>
            </div>
          </div>
          <dl class="trust-list">
            ${t.trustItems
              .map((item) => `<div><dt>${escape(item.term)}</dt><dd>${escape(item.text)}</dd></div>`)
              .join("\n            ")}
          </dl>
          <p class="trust-scope">${escape(t.trustScope)}</p>
          <a class="button button-quiet" href="${escape(t.trustLinkHref)}">${escape(t.trustLink)}${ARROW_UP_RIGHT}</a>
        </section>
        <section class="closing-section" id="start">
          <div class="section-shell closing-panel">
            <p class="eyebrow">${escape(t.closingEyebrow)}</p>
            <h2>${escape(t.closingTitle)}</h2>
            <p>${seconded(t.closingText)}</p>
            <div class="closing-actions">
              <a class="button button-primary" href="#demo">${seconded(t.closingPrimary)}${ARROW_UP}</a>
              <a class="button button-quiet" href="#brief">${escape(t.closingSecondary)}${ARROW_UP}</a>
            </div>
            <p class="closing-scope">${escape(t.trustScope)}</p>
          </div>
        </section>
      </main>
      <footer>
        <a class="brand" href="#top">${BRAND_MARK}<span>GoodIdea</span></a>
        <p>${escape(t.footer)}</p>
        <a href="${REPO}">github.com/forge-context/goodidea-agent ↗</a>
      </footer>`;
}
