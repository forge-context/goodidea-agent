import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { IdeaMapHero, type MapLocale } from "./IdeaMap";
import { LegacyWalkthrough } from "./lab/legacy/LegacyWalkthrough";
import { StoryDemo } from "./studio/story/StoryDemo";
import { PaperFilm } from "./studio/paper/PaperFilm";
import { siteCopy } from "./siteCopy";
import "./styles.css";

const LOCALES: MapLocale[] = ["en", "ja", "zh-CN"];
/* Earlier detailed walkthroughs remain available for comparison with the concept film. */
const VIEWS = ["hero", "paper", "legacy", "story"] as const;
type View = (typeof VIEWS)[number];

const VIEW_LABEL: Record<View, string> = {
  hero: "first view",
  paper: "paper film (debug)",
  legacy: "retired walkthrough",
  story: "detailed product story",
};

function Lab() {
  const params = new URLSearchParams(window.location.search);
  const initial = params.get("lang");
  const [locale, setLocale] = useState<MapLocale>(
    LOCALES.includes(initial as MapLocale) ? (initial as MapLocale) : "zh-CN",
  );
  const [view, setView] = useState<View>(VIEWS.includes(params.get("view") as View) ? params.get("view") as View : "hero");
  const [run, setRun] = useState(0);
  const [stillsOnly, setStillsOnly] = useState(params.get("reduced") === "1");
  /* `?w=390` narrows the demo window so the phone composition can be reviewed without
     emulating a device: the film picks its layout from its own container width. */
  const width = params.get("w");

  // The page-wide typography rules key off the document language; on the real pages
  // the HTML file declares it, so only this preview has to.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  return (
    <div className="lab-shell" data-locale={locale}>
      <div className="lab-bar">
        <div className="locale-switch">
          {VIEWS.map((item) => (
            <button
              className={item === view ? "active" : ""}
              key={item}
              onClick={() => setView(item)}
            >
              {VIEW_LABEL[item]}
            </button>
          ))}
        </div>
        <div className="locale-switch">
          {LOCALES.map((item) => (
            <button
              className={item === locale ? "active" : ""}
              key={item}
              onClick={() => {
                setLocale(item);
                setRun((value) => value + 1);
              }}
            >
              {item === "zh-CN" ? "中文" : item.toUpperCase()}
            </button>
          ))}
          <button onClick={() => setRun((value) => value + 1)}>replay</button>
        </div>
      </div>
      {view === "hero" ? (
        <IdeaMapHero
          actions={
            <div className="hero-actions">
              <div>
                <a className="button button-primary" href="/">
                  {siteCopy[locale].heroPrimary.replace("{seconds}", "60")}
                </a>
              </div>
            </div>
          }
          key={`${locale}-${run}`}
          locale={locale}
        />
      ) : view === "paper" ? (
        <div className="lab-demo">
          <p className="lab-note">
            The film the landing page runs, with the timeline tools the page itself does
            not ship: a loop toggle, a read-out of the sampled second, and the chapter
            list as jump targets.
          </p>
          <label className="lab-note">
            <input type="checkbox" checked={stillsOnly} onChange={(event) => setStillsOnly(event.target.checked)} />
            {" "}preview the reduced-motion presentation
          </label>
          <div className="demo-window" style={width ? { maxWidth: `${width}px` } : undefined}>
            <PaperFilm debug forceReduced={stillsOnly} key={`${locale}-${run}`} locale={locale} />
          </div>
        </div>
      ) : view === "story" ? (
        <div className="lab-demo"><div className="demo-window"><StoryDemo key={`${locale}-${run}`} locale={locale} /></div></div>
      ) : (
        <div className="lab-demo">
          <p className="lab-note">
            The trading example the site used to run. Kept for comparison only; the
            landing page tells a different story.
          </p>
          <div className="demo-window">
            <LegacyWalkthrough key={`${locale}-${run}`} locale={locale} />
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Lab />
  </StrictMode>,
);
