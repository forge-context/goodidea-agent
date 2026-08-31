import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { IdeaMapHero, type MapLocale } from "./IdeaMap";
import "./styles.css";

const LOCALES: MapLocale[] = ["en", "ja", "zh-CN"];

function Lab() {
  const initial = new URLSearchParams(window.location.search).get("lang");
  const [locale, setLocale] = useState<MapLocale>(
    LOCALES.includes(initial as MapLocale) ? (initial as MapLocale) : "zh-CN",
  );
  const [run, setRun] = useState(0);

  // The page-wide typography rules key off the document language; on the real pages
  // the HTML file declares it, so only this preview has to.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  return (
    <div className="lab-shell" data-locale={locale}>
      <div className="lab-bar">
        <span>first-view review</span>
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
      <IdeaMapHero
        actions={
          <div className="hero-actions">
            <div>
              <a className="button button-primary" href="#demo">
                {locale === "ja" ? "固定 Demo を試す" : locale === "zh-CN" ? "体验固定 Demo" : "Try the fixed demo"}
              </a>
            </div>
          </div>
        }
        key={`${locale}-${run}`}
        locale={locale}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Lab />
  </StrictMode>,
);
