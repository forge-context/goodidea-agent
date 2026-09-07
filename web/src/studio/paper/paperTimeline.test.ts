import { describe, expect, it } from "vitest";

import {
  CHAPTER_STARTS, DURATION, PAPER_SECONDS, ROLES, STEP_FPS,
  CUES, advanceTime, chapterAt, chapterStill, quantize, sampleScene,
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
      expect(copy.fusion.trade).toContain(copy.agents.engineering.name);
      expect(copy.fusion.trade).toContain(copy.agents.experience.name);
      expect(copy.rail.summary).toHaveLength(6);
      for (const role of ROLES) expect(copy.agents[role].work).toHaveLength(3);
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
  it("gives the fusion card the room the parked sheets were using, then hands it back", () => {
    const open = sampleScene(CUES.fuse.result, true);
    expect(open.fusion.opacity).toBeGreaterThan(0.9);
    for (const role of ROLES) expect(open.work[role].opacity).toBeLessThan(0.05);
    // The card closes before the decision rather than sitting under the cursor.
    const deciding = sampleScene(CUES.decide.cursorIn, true);
    expect(deciding.fusion.opacity).toBe(0);
    for (const role of ROLES) expect(deciding.work[role].opacity).toBeGreaterThan(0.3);
    expect(deciding.designer.thoughtOpacity).toBeGreaterThan(0.5);
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
