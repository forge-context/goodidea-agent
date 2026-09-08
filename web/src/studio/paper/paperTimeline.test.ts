import { describe, expect, it } from "vitest";

import {
  CHAPTER_STARTS, DURATION, LAST_FRAME, PAPER_SECONDS, ROLES, STEP_FPS,
  CUES, advanceTime, atEnd, chapterAt, chapterStill, circleStroke, quantize,
  sampleScene, strikeStroke, underlineStroke, type TextBox,
} from "./paperTimeline";
import { paperCopy, type PaperLocale } from "./paperCopy";

const LOCALES: PaperLocale[] = ["zh-CN", "en", "ja"];
/** Every frame the film can be asked for. */
const frames = (compact = false) => {
  const out = [];
  for (let frame = 0; frame <= Math.ceil(DURATION * STEP_FPS); frame++) out.push(sampleScene(frame / STEP_FPS, compact));
  return out;
};

describe("the film's clock", () => {
  it("states a length derived from the script, not typed into the copy", () => {
    expect(PAPER_SECONDS).toBe(Math.round(DURATION));
    expect(DURATION).toBeGreaterThan(CUES.outlook.brandLine2);
  });

  it("gives the same picture for a second however you arrive at it", () => {
    // Played to, dragged to, and looped past all quantise to the same frame.
    const frame = quantize(41.244);
    const played = sampleScene(frame, false, true);
    const dragged = sampleScene(frame, false, true);
    const withinFrame = sampleScene(frame + 1 / STEP_FPS / 3, false, true);
    expect(JSON.stringify(dragged)).toBe(JSON.stringify(played));
    expect(JSON.stringify(withinFrame)).toBe(JSON.stringify(played));
  });

  it("keeps looping and single playback identical except for the closing fade", () => {
    const t = DURATION - 2;
    const looped = { ...sampleScene(t, false, true), fade: 0 };
    const once = { ...sampleScene(t, false, false), fade: 0 };
    expect(JSON.stringify(looped)).toBe(JSON.stringify(once));
    expect(sampleScene(t, false, false).fade).toBe(1);
    expect(advanceTime(DURATION - 0.01, 1, DURATION, true).time).toBeLessThan(1);
    expect(advanceTime(DURATION - 0.01, 1, DURATION, false)).toEqual({ time: DURATION, playing: false });
  });

  it("orders its chapters and opens each one on a settled frame", () => {
    for (let i = 1; i < CHAPTER_STARTS.length; i++) expect(CHAPTER_STARTS[i]).toBeGreaterThan(CHAPTER_STARTS[i - 1]);
    CHAPTER_STARTS.forEach((start, index) => {
      const still = chapterStill(index);
      expect(chapterAt(still)).toBe(index);
      expect(still).toBeGreaterThanOrEqual(start);
    });
    expect(quantize(1.999)).toBe(Math.floor(1.999 * STEP_FPS) / STEP_FPS);
  });
});

describe("the AI team's contributions", () => {
  it("only changes an agent's state when the film shows that contribution", () => {
    let previous = frames()[0].rail.agents;
    let changes = 0;
    for (const scene of frames()) {
      scene.rail.agents.forEach((agent, index) => {
        // Nothing ever un-contributes, and nothing goes back to an earlier line.
        expect(agent.work).toBeGreaterThanOrEqual(previous[index].work);
        expect(agent.note).toBeGreaterThanOrEqual(previous[index].note);
        if (agent.work !== previous[index].work || agent.note !== previous[index].note) changes++;
      });
      previous = scene.rail.agents;
    }
    // Three agents, three steps each: a status that changed on every frame would be a
    // spinner, and one that never changed would be a decoration.
    expect(changes).toBe(9);
  });

  it("never leaves all three agents busy at once, and marks each one live only on its turn", () => {
    for (const scene of frames()) {
      expect(scene.rail.agents.filter((agent) => agent.live).length).toBeLessThanOrEqual(1);
    }
    const during = sampleScene(CUES.uxSketch[1]);
    expect(during.rail.agents.find((agent) => agent.live)?.role).toBe("experience");
    expect(sampleScene(CUES.researchLine1).rail.agents.find((agent) => agent.live)?.role).toBe("research");
    expect(sampleScene(CUES.engineeringLines[0]).rail.agents.find((agent) => agent.live)?.role).toBe("engineering");
  });

  it("counts contributions into GoodIdea's own status, and stops at one decision", () => {
    expect(sampleScene(CUES.researchEnter).rail.summary).toBe(0);
    expect(sampleScene(CUES.researchLine2 + 1).rail.summary).toBe(1);
    expect(sampleScene(CUES.uxOption + 1).rail.summary).toBe(2);
    expect(sampleScene(CUES.engineeringPark.from).rail.summary).toBe(3);
    expect(sampleScene(CUES.fuse.result).rail.summary).toBe(4);
    expect(sampleScene(CUES.decide.revised1).rail.summary).toBe(5);
  });

  it("keeps each sheet identifiable once it has shrunk to the edge", () => {
    const parked = sampleScene(CUES.fuse.shared);
    for (const role of ROLES) {
      expect(parked.work[role].scale).toBeLessThan(0.5);
      expect(parked.tags[role].opacity).toBeGreaterThan(0.5);
    }
    // While one sheet is in the middle of the desk it covers the others, so the
    // markers wait rather than floating over the sheet being read.
    const working = sampleScene(CUES.engineeringLines[0]);
    for (const role of ROLES) expect(working.tags[role].opacity).toBe(0);
  });

  it("says in every language whose earlier work each later contribution answers", () => {
    for (const locale of LOCALES) {
      const copy = paperCopy[locale];
      // UX opens by naming the research it picked up...
      expect(copy.work.uxQuestion).toContain(copy.agents.research.name);
      // ...and engineering quotes UX's open question before proposing anything.
      expect(copy.work.engineeringQuote.length).toBeGreaterThan(0);
      // The fusion card credits all three by name in its own chips, and then states
      // the trade-off once and briefly: engineering's full reasoning has already been
      // read on its sheet, and repeating it there made the card the longest thing on
      // the desk.
      ROLES.forEach((role, index) => expect(copy.fusion.chips[index]).toContain(copy.agents[role].name));
      expect(copy.fusion.trade.length).toBeLessThan(copy.work.engineeringLines.join("").length + 24);
      expect(copy.rail.summary).toHaveLength(6);
      // Two lines of activity, not three: once a contribution is in, the contribution
      // is the useful line and "handed in" is not.
      for (const role of ROLES) expect(copy.agents[role].work).toHaveLength(2);
    }
  });
});

describe("GoodIdea's synthesis", () => {
  it("shows the contributions, the agreement and the trade-off before any proposal", () => {
    const F = CUES.fuse;
    expect(F.links[0]).toBeGreaterThan(F.open);
    expect(F.shared).toBeGreaterThan(F.links[2]);
    expect(F.trade).toBeGreaterThan(F.shared);
    expect(F.result).toBeGreaterThan(F.trade);
    expect(F.proposal).toBeGreaterThan(F.result);

    const mid = sampleScene(F.trade);
    expect(mid.fusion.opacity).toBeGreaterThan(0.9);
    expect(mid.fusion.chips.every((chip) => chip === 1)).toBe(true);
    expect(mid.fusion.shared).toBe(1);
    expect(mid.fusion.result).toBe(0);
    // The proposal has not reached the product draft yet.
    expect(mid.productText.proposal).toBe(0);
  });

  it("gives the synthesis long enough to be read before the cursor moves", () => {
    expect(CUES.fuse.result - CUES.fuse.open).toBeGreaterThan(2.5);
    expect(CUES.decide.cursorIn - CUES.fuse.button).toBeGreaterThanOrEqual(3);
  });
});

describe("the creator's confirmation", () => {
  it("changes nothing on the product draft until the press", () => {
    for (const scene of frames()) {
      if (scene.t >= CUES.decide.cursorPress) continue;
      expect(scene.productText.revised1).toBe(0);
      expect(scene.productText.revised2).toBe(0);
      expect(scene.acceptedSketch.every((value) => value === 0)).toBe(true);
      expect(scene.ink.strike).toBe(0);
      expect(scene.workspace.version).toBe("v0.1");
      expect(scene.workspace.adopted).toBe(false);
    }
  });

  it("moves the version and the draft only after the release", () => {
    const before = sampleScene(CUES.decide.cursorPress - 0.2);
    const pressed = sampleScene(CUES.decide.cursorPress + 0.12);
    const after = sampleScene(CUES.decide.revised2 + 0.5);
    expect(before.button).toBe("idle");
    expect(pressed.button).toBe("press");
    expect(after.button).toBe("done");
    expect(after.workspace.version).toBe("v0.2");
    expect(after.productText.revised2).toBe(1);
    expect(after.workspace.adopted).toBe(true);
  });

  it("puts the collaboration away for the client's view and brings the team back at the end", () => {
    const client = sampleScene(CUES.outlook.rows[0] + 0.5);
    expect(client.rail.opacity).toBe(0);
    expect(client.fusion.opacity).toBe(0);
    for (const role of ROLES) expect(client.work[role].opacity).toBeLessThan(0.05);

    const ending = sampleScene(CUES.outlook.brandLine2);
    for (const role of ROLES) {
      expect(ending.work[role].opacity).toBeGreaterThan(0.3);
      expect(ending.tags[role].opacity).toBeGreaterThan(0.3);
    }
    expect(ending.outlook.brand[0]).toBe(1);
  });
});

describe("the narrow-screen composition", () => {
  it("shows one block at a time from the synthesis onward, and brings the team back at the end", () => {
    const open = sampleScene(CUES.fuse.result, true);
    expect(open.fusion.opacity).toBeGreaterThan(0.9);
    for (const role of ROLES) expect(open.work[role].opacity).toBeLessThan(0.05);
    expect(open.rail.opacity).toBeLessThan(0.05);

    /* The card closes before the decision rather than sitting under the cursor, and
     * nothing takes its place: the decision — the question, what it gives up and the
     * control that adopts it — is the only thing on that screen asking to be read.
     * Who it came from is named inside the card itself. */
    const deciding = sampleScene(CUES.decide.cursorIn, true);
    expect(deciding.fusion.opacity).toBe(0);
    for (const role of ROLES) expect(deciding.work[role].opacity).toBeLessThan(0.05);
    expect(deciding.rail.opacity).toBeLessThan(0.05);
    // The creator steps aside too: at this size the draft fills the frame, and a
    // second voice beside it would be a line lying over the one being read.
    expect(deciding.designer.thoughtOpacity).toBe(0);
    expect(deciding.designer.pose.opacity).toBeLessThan(0.05);
    // And the draft has come forward, so that decision is read at close range.
    expect(deciding.product.scale).toBeGreaterThan(sampleScene(CUES.fuse.result, true).product.scale);

    // The team, and the creator, come back for the closing frame.
    const ending = sampleScene(CUES.outlook.brandLine1, true);
    for (const role of ROLES) expect(ending.work[role].opacity).toBeGreaterThan(0.3);
    expect(ending.designer.pose.opacity).toBeGreaterThan(0.5);
  });

  it("keeps the same story beats as the wide composition", () => {
    for (const scene of frames(true)) {
      if (scene.t >= CUES.decide.cursorPress) continue;
      expect(scene.productText.revised1).toBe(0);
      expect(scene.workspace.version).toBe("v0.1");
    }
    expect(sampleScene(CUES.fuse.result, true).rail.summary).toBe(4);
  });
});

describe("the end of the film", () => {
  /* The clock runs in raw seconds and the picture is sampled from quantised ones, and
   * the two disagree at the end: `DURATION` is almost never a whole frame, so the last
   * frame the film can show is strictly earlier than the length the page states.
   * Asking "is it finished?" in raw seconds is what used to leave the transport
   * offering "play" at a film that had already stopped. */
  it("calls itself finished on the last frame, not one frame past the end", () => {
    expect(LAST_FRAME).toBeLessThanOrEqual(DURATION);
    expect(DURATION - LAST_FRAME).toBeLessThan(1 / STEP_FPS);
    expect(atEnd(LAST_FRAME)).toBe(true);
    expect(atEnd(DURATION)).toBe(true);
    // The frame before it is not the end, however the raw time is rounded.
    expect(atEnd(LAST_FRAME - 1 / STEP_FPS)).toBe(false);
    expect(atEnd(0)).toBe(false);
    // Playing off the end leaves the clock exactly there, and that reads as finished.
    const stopped = advanceTime(DURATION - 0.01, 1, DURATION, false);
    expect(stopped.playing).toBe(false);
    expect(atEnd(stopped.time)).toBe(true);
  });

  it("holds its closing frame rather than a blank desk", () => {
    // The page plays it once, so the last frame is the closing card at full strength;
    // only the looping preview fades out to meet its own first frame.
    const last = sampleScene(LAST_FRAME, false, false);
    expect(last.outlook.brand[0]).toBe(1);
    expect(last.fade).toBe(1);
    expect(sampleScene(LAST_FRAME, false, true).fade).toBeLessThan(0.5);
  });
});

describe("the two clicks", () => {
  /* The pointer is described by which control it is going to and how far along it is.
   * It never carries a coordinate, because a coordinate is a second opinion about
   * where the button is — and that is exactly how the arrow came to land above the
   * control it was pressing. The stage resolves both ends from the box it laid out. */
  const cursorAt = (t: number, compact = false) => sampleScene(t, compact).cursor;

  it("names a control instead of a place, in both compositions", () => {
    for (const compact of [false, true]) {
      expect(cursorAt(CUES.decide.cursorArrive, compact).target).toBe("adopt");
      expect(cursorAt(CUES.outlook.cursorArrive, compact).target).toBe("client");
      // And is not on the desk at all when there is nothing to press.
      expect(cursorAt(CUES.fuse.shared, compact).visible).toBe(false);
      expect(cursorAt(CUES.decide.cursorOut + 0.5, compact).visible).toBe(false);
    }
  });

  it("has arrived before it presses, and presses only between press and release", () => {
    for (const [name, act] of [["adopt", CUES.decide], ["client", CUES.outlook]] as const) {
      // Arrival happens first, and the approach is finished by then: nothing is still
      // travelling while the button is being pushed.
      expect(cursorAt(act.cursorArrive).target).toBe(name);
      expect(cursorAt(act.cursorArrive).p).toBe(1);
      expect(cursorAt(act.cursorPress).p).toBe(1);
      expect(cursorAt(act.cursorRelease).p).toBe(1);
      expect(cursorAt(act.cursorIn).p).toBe(0);

      expect(cursorAt(act.cursorPress - 0.2).pressed).toBe(false);
      expect(cursorAt(act.cursorPress + 0.09).pressed).toBe(true);
      expect(cursorAt(act.cursorRelease + 0.09).pressed).toBe(false);
    }
  });

  it("keeps the same pointer for the same second however you arrive at it", () => {
    for (const t of [CUES.decide.cursorArrive, CUES.decide.cursorPress, CUES.outlook.cursorPress]) {
      const frame = quantize(t);
      expect(sampleScene(frame).cursor).toEqual(sampleScene(frame + 1 / STEP_FPS / 3).cursor);
    }
  });
});

describe("ink drawn on a line of text", () => {
  /* A strike, an underline and a circle all answer a particular sentence, and a
   * sentence is a different length in every language. These are generated from the box
   * the sentence occupies, so the only thing worth asserting is that each mark stays
   * with its own line: over it, under it, or around it — never in the gap above or
   * across the paragraph below. */
  const box: TextBox = { x: 116, y: 226, w: 210, h: 36 };
  const points = (paths: string[]) =>
    paths.flatMap((d) => [...d.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)]
      .map((m) => ({ x: Number(m[1]), y: Number(m[2]) })));

  it("strikes through the middle of the line it belongs to", () => {
    const ys = points(strikeStroke(box)).map((p) => p.y);
    expect(Math.min(...ys)).toBeGreaterThan(box.y);
    expect(Math.max(...ys)).toBeLessThan(box.y + box.h);
    const xs = points(strikeStroke(box)).map((p) => p.x);
    // It covers the words and overruns a little, the way a hand does — but it never
    // stops halfway, which is what a fixed path did to a longer language.
    expect(Math.min(...xs)).toBeLessThanOrEqual(box.x);
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(box.x + box.w);
    expect(Math.max(...xs)).toBeLessThan(box.x + box.w + 16);
  });

  it("underlines just below its own line and not into the next", () => {
    const ys = points(underlineStroke(box)).map((p) => p.y);
    expect(Math.min(...ys)).toBeGreaterThan(box.y + box.h / 2);
    expect(Math.max(...ys)).toBeLessThanOrEqual(box.y + box.h);
  });

  it("draws a loop that contains the line and closes near where it started", () => {
    const p = points(circleStroke(box));
    expect(Math.min(...p.map((v) => v.x))).toBeLessThan(box.x);
    expect(Math.max(...p.map((v) => v.x))).toBeGreaterThan(box.x + box.w);
    expect(Math.min(...p.map((v) => v.y))).toBeLessThan(box.y);
    expect(Math.max(...p.map((v) => v.y))).toBeGreaterThan(box.y + box.h);
    const gap = Math.hypot(p[0].x - p[p.length - 1].x, p[0].y - p[p.length - 1].y);
    expect(gap).toBeLessThan(box.h);
  });

  it("follows the words when the language makes them longer", () => {
    const wider = strikeStroke({ ...box, w: box.w * 2 });
    const xs = points(wider).map((v) => v.x);
    expect(Math.max(...xs)).toBeGreaterThan(box.x + box.w * 2 - 1);
  });
});
