import { useEffect, useRef, useState } from "react";

import { HeroScene } from "./HeroScene";
import { siteCopy, withSeconds, type Locale, type SiteCopy } from "./siteCopy";
import { buildPaperBrief, paperHandoffMarkdown } from "./studio/paper/paperBrief";
import { PaperFilm } from "./studio/paper/PaperFilm";
import { PAPER_SECONDS } from "./studio/paper/paperTimeline";

const REPO = "https://github.com/forge-context/goodidea-agent";

/**
 * A heading that arrives from 16px below, once, when it first reaches the viewport.
 *
 * The attribute is only added after mount, so the prerendered shell and any visitor
 * without JavaScript get the heading already in place rather than an invisible one;
 * `reduce` and a browser without `IntersectionObserver` skip straight to "in". It
 * fires once and then stops observing, so scrolling back up never replays it.
 */
function useRevealOnce() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "pending" | "in">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined"
      || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setState("in");
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setState("in");
      observer.disconnect();
    }, { threshold: 0.2 });
    // Anything already on screen at mount is not an arrival; it is just there.
    const rect = el.getBoundingClientRect();
    setState(rect.top < window.innerHeight * 0.9 ? "in" : "pending");
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, "data-reveal": state } as const;
}

/**
 * True while the element is on screen, as a data attribute.
 *
 * The hint below the hero moves, and there is no reason for it to keep moving once it
 * has scrolled away — the attribute is what the animation is gated on. Without an
 * observer, or before mount, it is simply on: a hint that animates is the normal
 * case, and a page that never runs script still gets a working link.
 */
function useOnScreen() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, "data-onscreen": onScreen } as const;
}

/**
 * The page, in the order it has to be read.
 *
 * Position, then the demo, then what the demo leaves behind, then who decides, then a
 * short close. The film is the argument, so nothing stands between the hero and it —
 * what a visitor needs before pressing play is a look at the outcome, not seven cards
 * of it, and that is what the hero carries beside the headline.
 */
function App() {
  const documentLocale = document.documentElement.dataset.locale;
  const locale: Locale =
    documentLocale === "ja" || documentLocale === "zh-CN" ? documentLocale : "en";
  const t = siteCopy[locale];
  const brief = buildPaperBrief(locale);
  const seconds = PAPER_SECONDS;
  const groups = groupBrief(brief.blocks, t);
  const demoHeading = useRevealOnce();
  const scrollCue = useOnScreen();

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header className="site-header">
        <a className="brand" href={locale === "en" ? "/" : locale === "ja" ? "/ja/" : "/zh-cn/"}>
          <BrandMark />
          <span>GoodIdea</span>
        </a>
        <nav aria-label={t.primaryNavigationLabel}>
          <a href="#demo">{t.nav.demo}</a>
          <a href="#brief">{t.nav.brief}</a>
          <a href="#how">{t.nav.how}</a>
          <a href={REPO}>{t.nav.github}</a>
        </nav>
        <div className="locale-switch" aria-label={t.languageLabel}>
          <a className={locale === "en" ? "active" : ""} href="/" hrefLang="en" lang="en">EN</a>
          <a className={locale === "ja" ? "active" : ""} href="/ja/" hrefLang="ja" lang="ja">JA</a>
          <a className={locale === "zh-CN" ? "active" : ""} href="/zh-cn/" hrefLang="zh-CN" lang="zh-CN">中文</a>
        </div>
      </header>

      <main id="main">
        {/* One promise, one action, and a drawing of the thing being promised. The
            mechanism is the film's job, one screen down. */}
        <section className="hero section-shell" id="top">
          <div className="hero-lead">
            <div className="hero-copy">
              <p className="eyebrow">{t.heroEyebrow}</p>
              <h1>{t.heroTitle.map((line) => (
                <span key={line}>{markPromise(line, t.heroTitleMark)}</span>
              ))}</h1>
              <p className="hero-intro">
                {t.heroIntro.map((line) => <span key={line}>{line}</span>)}
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#demo">{t.heroPrimary}<ArrowDownIcon /></a>
                {/* Quiet on purpose: the outcome is worth a link, not a second button. */}
                <a className="hero-aside-link" href="#brief">{t.heroSecondary}<ArrowUpRightIcon /></a>
              </div>
              <p className="hero-length">{withSeconds(t.heroPrimaryNote, seconds)}</p>
            </div>
            <HeroScene copy={t} />
          </div>

          {/* A hero that fills the window has to say that the page continues. It is
              an ordinary link to the same place the button goes, given its own row
              at the foot of the screen so it never sits over the drawing, and it
              leaves with the hero rather than following the page down. */}
          <a className="hero-scroll" href="#demo" {...scrollCue}>
            {t.heroScrollCue}
            <ScrollHintIcon />
          </a>
        </section>

        <section className="demo-section" id="demo">
          <div className="section-shell">
            <div className="section-heading" {...demoHeading}>
              <p className="eyebrow">{t.demoEyebrow}</p>
              <h2>{t.demoTitle}</h2>
              <p className="section-lead">{t.demoIntro}</p>
            </div>
            <div className="demo-window">
              <PaperFilm locale={locale} />
            </div>
          </div>
        </section>

        {/* The same case, standing still and complete. The hero shows the shape of it;
            this is where the boundaries are actually readable. */}
        <section className="brief-section" id="brief">
          <div className="section-shell">
            <div className="section-heading">
              <p className="eyebrow">{t.briefEyebrow}</p>
              <h2>{t.briefTitle}</h2>
              <p className="section-lead">{t.briefIntro}</p>
            </div>

            <div className="brief-layout">
              <article className="brief-sheet">
                <p className="brief-input-label">{t.briefInputLabel}</p>
                <p className="brief-input-text">{brief.input}</p>
                <div className="brief-sheet-body">
                  {groups.direction.map((block) => (
                    <BriefBlock key={block.label} block={block} />
                  ))}
                </div>
                <p className="brief-scenario">{t.briefScenarioNote}</p>
              </article>

              <div className="brief-side">
                {groups.scope.map((block) => (
                  <article key={block.label} className="brief-block" data-tone={block.tone ?? "plain"}>
                    <h3>{block.label}</h3>
                    <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>
                  </article>
                ))}
              </div>
            </div>

            {/* The boundaries a first version needs are above, in full. What is below
                is detail — never a boundary hidden behind a summary. */}
            <details className="brief-details">
              <summary>{t.briefDetails}</summary>
              <div className="brief-details-grid">
                {groups.detail.map((block) => (
                  <BriefBlock key={block.label} block={block} />
                ))}
              </div>
            </details>

            <div className="brief-foot">
              <p>{t.briefFooter}</p>
              <button type="button" className="button button-quiet" onClick={() => downloadHandoff(locale)}>
                {t.briefDownload}<ArrowDownIcon />
              </button>
            </div>
          </div>
        </section>

        <section className="work-section section-shell" id="how">
          <div className="section-heading">
            <p className="eyebrow">{t.workEyebrow}</p>
            <h2>{t.workTitle}</h2>
            <p className="section-lead">{t.workIntro}</p>
          </div>
          <ol className="work-steps">
            {t.workSteps.map((item) => (
              <li key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></li>
            ))}
          </ol>
          <dl className="work-principles">
            {t.workPrinciples.map((item) => (
              <div key={item.term}><dt>{item.term}</dt><dd>{item.text}</dd></div>
            ))}
          </dl>
          <p className="work-vision">{t.workVision}</p>
        </section>

        <section className="closing-section" id="start">
          <div className="section-shell closing-panel">
            <p className="eyebrow">{t.closingEyebrow}</p>
            <h2>{t.closingTitle}</h2>
            <p className="closing-lead">{withSeconds(t.closingText, seconds)}</p>
            <div className="closing-actions">
              <a className="button button-primary" href="#demo">{t.closingPrimary}<ArrowUpIcon /></a>
              <a className="button button-quiet" href="#brief">{t.closingSecondary}<ArrowUpIcon /></a>
            </div>
            {/* Said in full, once, where the page ends. */}
            <p className="closing-scope">{t.trustScope}</p>
            <a className="closing-source" href={t.trustLinkHref}>{t.trustLink}<ArrowUpRightIcon /></a>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="#top"><BrandMark /><span>GoodIdea</span></a>
        <p>{t.footer}</p>
        <a href={REPO}>github.com/forge-context/goodidea-agent ↗</a>
      </footer>
    </>
  );
}

/**
 * One line of the headline, with the words that carry the promise underlined.
 *
 * The rule under them is the page's one bright accent, and it is drawn the way the
 * illustration draws a rule — one slightly uneven stroke, not a border. The mark is a
 * `<b>` rather than a `<mark>`: `<mark>` means relevance to the reader's current
 * search, which this is not, and its default yellow ground would have to be undone
 * anyway. Weight is unchanged, so the accent is the only thing that carries it.
 *
 * A line that does not contain the phrase comes back untouched, so a locale whose
 * mark sits on line three costs nothing on lines one and two.
 */
function markPromise(line: string, mark: string) {
  const at = mark ? line.indexOf(mark) : -1;
  if (at < 0) return line;
  return (
    <>
      {line.slice(0, at)}
      <b className="hero-mark">{mark}</b>
      {line.slice(at + mark.length)}
    </>
  );
}

type Block = ReturnType<typeof buildPaperBrief>["blocks"][number];

function BriefBlock({ block }: { block: Block }) {
  return (
    <article className="brief-block" data-tone={block.tone ?? "plain"}>
      <h3>{block.label}</h3>
      <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>
      {block.note && <p className="brief-note">{block.note}</p>}
    </article>
  );
}

/* Seven equally weighted cards is a list, not a result. The same seven blocks are read
 * as one draft and two groups: what the product is, what version one is bounded by,
 * and — opened only if wanted — the detail behind both. */
function groupBrief(blocks: Block[], t: SiteCopy) {
  const by = (label: string) => blocks.filter((block) => block.label === label);
  const L = t.briefLabels;
  return {
    direction: [...by(L.direction), ...by(L.prototype)],
    scope: [...by(L.scope), ...by(L.nonGoals)],
    detail: [...by(L.done), ...by(L.open), ...by(L.handoff)],
  };
}

/* The same content the section above shows, handed over as the file a coding agent
 * would be given. Nothing is fetched: the text is assembled in the page. */
function downloadHandoff(locale: Locale) {
  const blob = new Blob([paperHandoffMarkdown(locale)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `goodidea-handoff-${locale}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "brand-mark small" : "brand-mark"} aria-hidden="true">
      <svg viewBox="0 0 36 36">
        <path className="brand-loop" d="M26.4 10.8A10.5 10.5 0 1 0 27.7 24" />
        <path className="brand-turn" d="M18.8 18.2h8.7v7.5" />
        <circle className="brand-spark" cx="28.3" cy="7.6" r="2.5" />
      </svg>
    </span>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.5v12.2m0 0-4-4m4 4 4-4" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 16.5V4.3m0 0-4 4m4-4 4 4" />
    </svg>
  );
}

/** A thin arrow under the hint. Longer and lighter than the action icons, because it
 *  points at the page rather than labelling a control. */
function ScrollHintIcon() {
  return (
    <svg className="hero-scroll-arrow" viewBox="0 0 24 30" aria-hidden="true">
      <path d="M12 2v23m0 0-7-7.4m7 7.4 7-7.4" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.2 14.8 14.8 5.2M7.2 5.2h7.6v7.6" />
    </svg>
  );
}

export default App;
