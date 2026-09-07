import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { storyCopy, type StoryLocale } from "../story/storyCopy";
import { ChangeSheet } from "../story/ChangeSheet";
import { emptyProto, sampleItems } from "../story/storyProto";
import { handoffMarkdown } from "../story/handoffPackage";
import { segmentsOf } from "../typing";
import { filmCopy } from "./filmCopy";
import { FILM_SECONDS, chapterStill, clamp, ease, filmFrame } from "./filmTimeline";
import "./film.css";

function useFilmClock() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [visible, setVisible] = useState(() => !document.hidden);
  const elapsed = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => {
      setReduced(media.matches);
      if (media.matches) {
        setPlaying(false);
        elapsed.current = chapterStill(filmFrame(elapsed.current).chapter);
        setTime(elapsed.current);
      }
    };
    const visibility = () => setVisible(!document.hidden);
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    if (media.matches) motion();
    return () => { media.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  useEffect(() => {
    if (!playing || reduced || !visible) return;
    let last: number | undefined;
    let request = 0;
    const tick = (now: number) => {
      if (last !== undefined) elapsed.current = Math.min(FILM_SECONDS, elapsed.current + (now - last) / 1000);
      last = now;
      setTime(elapsed.current);
      if (elapsed.current >= FILM_SECONDS) setPlaying(false);
      else request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, reduced, visible]);

  const seek = (next: number) => { elapsed.current = clamp(next, 0, FILM_SECONDS); setTime(elapsed.current); setPlaying(false); };
  const replay = () => { seek(reduced ? chapterStill(0) : 0); setPlaying(!reduced); };
  return { time, playing: playing && visible && !reduced, reduced, seek, replay, pause: () => setPlaying(false),
    toggle: () => time >= FILM_SECONDS ? replay() : setPlaying((value) => !value) };
}

export function FilmDemo({ locale }: { locale: StoryLocale }) {
  // Locale navigation remounts the film, including its independent local prototype.
  return <Film key={locale} locale={locale} />;
}

function Film({ locale }: { locale: StoryLocale }) {
  const clock = useFilmClock();
  const { chapter, local, time } = filmFrame(clock.time);
  const t = filmCopy[locale];
  const story = storyCopy[locale];
  const scene = t.chapters[chapter];
  const [exploring, setExploring] = useState(false);
  const [prototype, setPrototype] = useState(() => ({ ...emptyProto, raw: story.proto.raw, items: sampleItems(story, "checked"), clientOnly: true }));
  const intro = useRef<HTMLHeadingElement>(null);
  const exploreTrigger = useRef<HTMLButtonElement>(null);
  const reveal = clock.reduced ? 1 : ease(local / 0.8);
  const animate = (delay = 0, duration = 1) => clock.reduced ? 1 : ease((local - delay) / duration);
  const typed = useMemo(() => segmentsOf(scene.voice ?? ""), [scene.voice]);
  const voice = typed.slice(0, clock.reduced ? typed.length : Math.floor(clamp((local - 0.6) / 2.1) * typed.length)).join("");

  const download = () => {
    const url = URL.createObjectURL(new Blob([handoffMarkdown(locale)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `goodidea-handoff-${locale}.md`; link.click();
    URL.revokeObjectURL(url);
  };
  const openPrototype = () => {
    clock.pause();
    setExploring(true);
    // This is a visitor action; playback itself never scrolls or moves focus.
    requestAnimationFrame(() => intro.current?.focus({ preventScroll: false }));
  };

  return (
    <div className="film-shell">
      <section className="film" data-chapter={chapter} data-playing={clock.playing} aria-label={t.label}>
        <div className="film-grain" aria-hidden="true" />
        <div className="film-halo" aria-hidden="true" style={{ transform: `translate(${Math.sin(time / 12) * 8}%, ${Math.cos(time / 15) * 5}%) scale(${1 + Math.sin(time / 10) * .1})` }} />
        <div className="film-masthead"><span><i aria-hidden="true" /> GoodIdea</span><span>{String(Math.min(chapter + 1, 7)).padStart(2, "0")} / 07 <b>{scene.name}</b></span></div>
        <header className="film-heading"><h3>{scene.title}</h3></header>

        <div className="film-art" style={{ "--reveal": reveal } as CSSProperties}>
          {chapter === 0 && <div className="film-messages">
            {story.proto.items.filter((item) => item.needsClient).slice(0, 3).map((item, index) => <div className="film-message" key={item.id} style={{ opacity: index === 0 ? 1 : .5 + animate(index * .55) * .5, transform: `translateY(${(1 - animate(index * .55)) * 12}px) rotate(${[-3, 2, -1][index] * (1 - animate(5, 3) * .7)}deg)` }}>
              <span className="film-message-meta"><i /> {item.at}</span><p>{item.quote}</p>
            </div>)}
            <div className="film-message-trail" aria-hidden="true"><span /><span /><span /></div>
          </div>}

          {chapter === 1 && <div className="film-flow">
            <div className="film-flow-path" aria-hidden="true"><span style={{ transform: `scaleX(${animate(.5, 4)})` }} /></div>
            {t.flow.map((label, index) => <div className="film-flow-node" key={label} style={{ opacity: animate(index * 1.1), transform: `translateY(${(1 - animate(index * 1.1)) * 36}px)` }}>
              <span className="film-glyph" aria-hidden="true">{["“", "≡", "✓"][index]}</span><strong>{label}</strong><span className="film-node-index">0{index + 1}</span>
            </div>)}
            <div className="film-source-ribbon" style={{ opacity: animate(3.4) }}><span>{t.source}</span>{story.proto.items[0].quote}</div>
          </div>}

          {(chapter === 2 || chapter === 3 || chapter === 6) && <div className="film-product-scene" data-phone={chapter !== 2} style={{ "--morph": chapter === 3 ? animate(0, 2.4) : 1 } as CSSProperties}>
            <div className="film-product" style={{ transform: `perspective(1000px) rotateY(${chapter === 2 ? (1 - animate(0, 2)) * -12 : 0}deg) translateY(${chapter === 3 ? 0 : (1 - reveal) * 18}px)`, opacity: chapter === 3 ? 1 : reveal }}>
              <div className="film-product-bar"><span aria-hidden="true">● ● ●</span><span>{chapter === 2 ? "PROTOTYPE / 01" : t.client}</span><i aria-hidden="true">↗</i></div>
              <div className="film-product-body"><span className="film-project">{story.proto.project}</span><h4>{t.sheet}</h4>
                <div className="film-product-items">
                  {story.proto.items.filter((item) => item.needsClient).map((item, index) => <div className="film-product-item" key={item.id} style={{ opacity: chapter === 2 ? animate(1 + index * .7) : 1 }}>
                    <span className="film-item-number" data-done={chapter === 6 && local >= 2 && index === 0}>{chapter === 6 && local >= 2 && index === 0 ? "✓" : `0${index + 1}`}</span>
                    <div><strong>{item.id === story.proto.corrected.id ? story.proto.corrected.text : item.text}</strong>{chapter === 2 && index === 0 && <small>{t.source} · {item.at}</small>}</div>
                    {chapter === 6 && local >= 2 && index === 0 && <span className="film-confirmed">{story.proto.confirmed}</span>}
                  </div>)}
                </div>
                {chapter === 2 && <div className="film-private">{t.private}</div>}
                {chapter !== 2 && <div className="film-phone-foot"><span className="film-phone-line" /><span>{chapter === 6 && local >= 2 ? "1 / 3" : "0 / 3"}</span></div>}
              </div>
            </div>
            {chapter === 3 && <div className="film-away-note" style={{ opacity: 1 - animate(1.2, 2), transform: `translateX(${animate(1.2, 2) * 28}px)` }}>{t.private}</div>}
            {chapter === 6 && <div className="film-receipt" style={{ opacity: animate(3.2, .8), transform: `translateY(${(1 - animate(3.2, .8)) * 12}px)` }}><span aria-hidden="true">✓</span><div><strong>{t.returned}</strong><small>{story.proto.items[0].text}</small></div></div>}
          </div>}

          {chapter === 4 && <div className="film-scope">
            <div className="film-scope-core" style={{ transform: `scale(${.94 + animate(0, 2) * .06})` }}><span className="film-overline">{t.included}</span><h4>{t.sheet}</h4><div className="film-scope-steps">{t.flow.map((text, index) => <span key={text}><i>0{index + 1}</i>{text}</span>)}</div><div className="film-scope-seal" style={{ opacity: animate(3) }}>✓ {t.ready}</div></div>
            <div className="film-later" style={{ opacity: 1 - animate(1.5, 3) * .48, transform: `translateY(${animate(1.5, 3) * 14}px)` }}><span>{t.later}</span>{t.extras.map((text) => <span key={text}>{text}</span>)}</div>
          </div>}

          {chapter === 5 && <div className="film-handoff">
            <div className="film-packet" style={{ opacity: 1 - animate(4, 2) * .18, transform: `translateX(${animate(3, 3) * 15}px) scale(${1 - animate(3, 3) * .05})` }}><span className="film-overline">GOODIDEA / HANDOFF</span><h4>{t.sheet}</h4>{t.package.map((text, index) => <div key={text}><span>0{index + 1}</span>{text}<b>✓</b></div>)}</div>
            <div className="film-bridge" aria-hidden="true"><span style={{ transform: `scaleX(${animate(1, 2)})` }} /><i style={{ left: `${animate(2, 3) * 100}%`, opacity: 1 - animate(5, 1) }} /></div>
            <div className="film-agent"><div className="film-orbit" aria-hidden="true" style={{ transform: `rotate(${local * 18}deg) scale(${.9 + animate(2, 3) * .1})` }}><i /><i /><i /></div><div className="film-agent-core" aria-hidden="true">✳</div><strong>coding agent</strong><span>{t.building}</span></div>
          </div>}

          {chapter === 7 && <div className="film-ending"><div className="film-end-mark" aria-hidden="true">✳</div><p>{t.question}</p><div className="film-possibilities">{t.possibilities.map((text) => <span key={text}>{text}</span>)}</div><button type="button" className="film-end-cta" onClick={openPrototype}>{t.explore}<span aria-hidden="true">↗</span></button></div>}
        </div>

        <div className="film-narration">
          <p className="film-voice" aria-label={scene.voice}>{scene.voice && <><span aria-hidden="true">“{voice}<i style={{ opacity: voice.length < (scene.voice?.length ?? 0) ? 1 : 0 }} />”</span></>}</p>
          <p className="film-caption">{scene.caption}</p>
          {chapter === 6 && <small>{t.outcomeNote}</small>}
        </div>
      </section>

      <div className="film-controls">
        <button type="button" className="film-play" onClick={clock.reduced ? () => clock.seek(chapter === 7 ? chapterStill(0) : chapterStill(chapter + 1)) : clock.toggle}>{clock.reduced ? chapter === 7 ? t.replay : t.next : time >= FILM_SECONDS ? t.replay : clock.playing ? t.pause : t.play}<span aria-hidden="true">{clock.playing ? "Ⅱ" : "▷"}</span></button>
        <input type="range" min="0" max={FILM_SECONDS} step="0.1" value={time} aria-label={t.progress} aria-valuetext={`${Math.floor(time)} / 60 · ${scene.name}`} onChange={(event) => clock.seek(Number(event.target.value))} />
        <span className="film-time">{String(Math.floor(time)).padStart(2, "0")} / 60</span>
        <button type="button" className="film-replay" aria-label={clock.reduced ? t.previous : t.replay} onClick={clock.reduced ? () => clock.seek(chapterStill(chapter - 1)) : clock.replay}>{clock.reduced ? "←" : "↺"}</button>
      </div>
      <div className="film-below"><p>{clock.reduced ? t.reduced : t.concept}</p><div><button type="button" ref={exploreTrigger} onClick={openPrototype} aria-expanded={exploring} aria-controls="film-prototype">{t.explore} ↗</button><button type="button" onClick={download}>{t.download} ↓</button></div></div>
      {exploring && <section className="film-explorer" id="film-prototype"><header><div><h3 tabIndex={-1} ref={intro}>{t.explore}</h3><p>{t.exploreIntro}</p></div><button type="button" onClick={() => { setExploring(false); exploreTrigger.current?.focus({ preventScroll: true }); }}>{t.close} ×</button></header><ChangeSheet copy={story} state={prototype} interactive onChange={setPrototype} /></section>}
      <div className="film-transcript"><details><summary>{t.label}</summary><ol>{t.chapters.map((item, index) => <li key={item.name}><button type="button" onClick={() => clock.seek(chapterStill(index))}>{item.name}</button><p>{item.title} {item.voice} {item.caption}</p></li>)}</ol></details></div>
    </div>
  );
}
