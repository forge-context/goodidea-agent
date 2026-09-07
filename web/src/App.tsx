import { IdeaMapHero } from "./IdeaMap";
import { siteCopy, withSeconds, type Locale } from "./siteCopy";
import { buildPaperBrief, paperHandoffMarkdown } from "./studio/paper/paperBrief";
import { PaperFilm } from "./studio/paper/PaperFilm";
import { PAPER_SECONDS } from "./studio/paper/paperTimeline";

const REPO = "https://github.com/forge-context/goodidea-agent";

function App() {
  const documentLocale = document.documentElement.dataset.locale;
  const locale: Locale =
    documentLocale === "ja" || documentLocale === "zh-CN" ? documentLocale : "en";
  const t = siteCopy[locale];
  const brief = buildPaperBrief(locale);
  const seconds = PAPER_SECONDS;

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
          <a href="#brief">{t.nav.brief}</a>
          <a href="#demo">{t.nav.demo}</a>
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
        <IdeaMapHero
          locale={locale}
          copy={t}
          actions={
            <div className="hero-actions">
              <div>
                <a className="button button-primary" href="#demo">{withSeconds(t.heroPrimary, seconds)}<ArrowDownIcon /></a>
                <small>{t.heroPrimaryNote}</small>
              </div>
              <div>
                <a className="button button-quiet" href="#brief">{t.heroSecondary}<ArrowDownIcon /></a>
                <small>{t.heroSecondaryNote}</small>
              </div>
            </div>
          }
        />

        {/* Before the demo, because a visitor who never clicks anything still has to
            be able to say what they would walk away holding. */}
        <section className="brief-section" id="brief">
          <div className="section-shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t.briefEyebrow}</p>
                <h2>{t.briefTitle}</h2>
              </div>
              <p>{t.briefIntro}</p>
            </div>

            <div className="brief-input">
              <p className="brief-input-label">{t.briefInputLabel}</p>
              <p className="brief-input-text">{brief.input}</p>
              <p className="brief-scenario">{t.briefScenarioNote}</p>
            </div>

            <div className="brief-grid">
              {brief.blocks.map((block) => (
                <article key={block.label} className="brief-block" data-tone={block.tone ?? "plain"}>
                  <h3>{block.label}</h3>
                  <ul>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {block.note && <p className="brief-note">{block.note}</p>}
                </article>
              ))}
            </div>
            <p className="brief-footer">{t.briefFooter}</p>
            <p className="brief-download">
              <button type="button" className="button button-quiet" onClick={() => downloadHandoff(locale)}>
                {t.briefDownload}<ArrowDownIcon />
              </button>
            </p>
          </div>
        </section>

        <section className="demo-section" id="demo">
          <div className="section-shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t.demoEyebrow}</p>
                <h2>{t.demoTitle}</h2>
              </div>
              <p>{withSeconds(t.demoIntro, seconds)}</p>
            </div>

            <div className="demo-window">
              <PaperFilm locale={locale} />
            </div>
          </div>
        </section>

        <section className="how-section section-shell" id="how">
          <div className="section-heading compact">
            <div><p className="eyebrow">{t.howEyebrow}</p><h2>{t.howTitle}</h2></div>
          </div>
          <div className="how-grid">
            {t.howItems.map((item) => (
              <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>
            ))}
          </div>
        </section>

        <section className="trust-section section-shell" id="trust">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">{t.trustEyebrow}</p>
              <h2>{t.trustTitle}</h2>
              <p className="trust-intro">{t.trustIntro}</p>
            </div>
          </div>
          <dl className="trust-list">
            {t.trustItems.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.text}</dd>
              </div>
            ))}
          </dl>
          <p className="trust-scope">{t.trustScope}</p>
          <a className="button button-quiet" href={t.trustLinkHref}>{t.trustLink}<ArrowUpRightIcon /></a>
        </section>

        <section className="closing-section" id="start">
          <div className="section-shell closing-panel">
            <p className="eyebrow">{t.closingEyebrow}</p>
            <h2>{t.closingTitle}</h2>
            <p>{withSeconds(t.closingText, seconds)}</p>
            <div className="closing-actions">
              <a className="button button-primary" href="#demo">{withSeconds(t.closingPrimary, seconds)}<ArrowUpIcon /></a>
              <a className="button button-quiet" href="#brief">{t.closingSecondary}<ArrowUpIcon /></a>
            </div>
            <p className="closing-scope">{t.trustScope}</p>
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

function ArrowUpRightIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.2 14.8 14.8 5.2M7.2 5.2h7.6v7.6" />
    </svg>
  );
}

export default App;
