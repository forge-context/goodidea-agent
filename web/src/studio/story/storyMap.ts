/* The idea map for the walkthrough, laid out state by state.
 *
 * Same design space as the shared canvas: `x` and `w` are percentages of the board
 * width, `y` is the node's top in pixels, and heights are measured at runtime —
 * the same node is one line in English and two in Japanese, so a layout that assumes
 * a height is a layout that collides in the language it was not tuned in.
 *
 * Each state is a whole arrangement rather than a diff, which is what lets a visitor
 * jump straight to a chapter and get the map that belongs to it. There are only four
 * of them plus the flow, because every one of them has to be a change a visitor can
 * actually see land.
 */

import type {
  CanvasEdge,
  CanvasView,
  NodeShape,
  NodeStatus,
  Placement,
} from "../../../../shared/studio/types";

export type MapVars = {
  /** How far the idea has been unpacked: the sentence, the pile, the finding, the shape. */
  grown: 1 | 2 | 3 | 4;
  /** Once true the findings are redrawn as the four-step flow. */
  flow: boolean;
};

export const initialMap: MapVars = { grown: 1, flow: false };

type Spot = { x: number; y: number; w: number; from?: { x: number; y: number } };

const LEFT = 27;
const RIGHT = 75;

const SPOTS: Record<number, Record<string, Spot>> = {
  1: { seed: { x: 50, y: 92, w: 86 } },
  2: {
    seed: { x: 50, y: 10, w: 82 },
    fragTalk: { x: LEFT, y: 112, w: 44, from: { x: 46, y: 54 } },
    fragProject: { x: RIGHT, y: 168, w: 42, from: { x: 52, y: 60 } },
    fragQuote: { x: LEFT, y: 226, w: 46, from: { x: 50, y: 66 } },
  },
  3: {
    seed: { x: 50, y: 0, w: 76 },
    fragTalkNow: { x: LEFT, y: 78, w: 46 },
    when: { x: RIGHT, y: 78, w: 42, from: { x: 70, y: 40 } },
    who: { x: LEFT, y: 142, w: 44, from: { x: 30, y: 96 } },
    problem: { x: RIGHT, y: 142, w: 46, from: { x: 74, y: 96 } },
    pain: { x: 50, y: 220, w: 70, from: { x: 50, y: 176 } },
    parked: { x: LEFT, y: 300, w: 48 },
  },
  4: {
    seed: { x: 50, y: 0, w: 72 },
    fragTalkNow: { x: LEFT, y: 70, w: 46 },
    when: { x: RIGHT, y: 70, w: 42 },
    who: { x: LEFT, y: 132, w: 44 },
    problem: { x: RIGHT, y: 132, w: 46 },
    pain: { x: 50, y: 208, w: 70 },
    outcome: { x: 50, y: 282, w: 72, from: { x: 50, y: 238 } },
    shape: { x: 50, y: 356, w: 84, from: { x: 50, y: 312 } },
    parked: { x: LEFT, y: 442, w: 48 },
  },
  /* Once the flow is named, the findings are redrawn as four steps: the one moment
   * the map stops being a pile of things noticed and becomes a route. */
  5: {
    shape: { x: 50, y: 0, w: 86 },
    flow1: { x: 50, y: 86, w: 68, from: { x: 50, y: 40 } },
    flow2: { x: 50, y: 150, w: 68, from: { x: 50, y: 104 } },
    flow3: { x: 50, y: 214, w: 68, from: { x: 50, y: 168 } },
    flow4: { x: 50, y: 278, w: 68, from: { x: 50, y: 232 } },
    parked: { x: 50, y: 348, w: 62 },
  },
};

function place(
  layout: number,
  id: string,
  content: string,
  shape: NodeShape,
  status: NodeStatus,
): Placement | null {
  const spot = SPOTS[layout]?.[id];
  if (!spot) return null;
  return { id, content, shape, status, x: spot.x, y: spot.y, w: spot.w, from: spot.from };
}

export function buildMap(vars: MapVars): CanvasView {
  const layout = vars.flow ? 5 : vars.grown;
  const nodes: Placement[] = [];
  const edges: CanvasEdge[] = [];
  const add = (node: Placement | null) => {
    if (node) nodes.push(node);
  };
  const link = (from: string, to: string, soft = false) => {
    if (nodes.some((node) => node.id === from) && nodes.some((node) => node.id === to)) {
      edges.push({ id: `${from}-${to}`, from, to, soft });
    }
  };

  if (vars.flow) {
    add(place(layout, "shape", "shape", "seed", "confirmed"));
    add(place(layout, "flow1", "flow1", "card", "confirmed"));
    add(place(layout, "flow2", "flow2", "card", "confirmed"));
    add(place(layout, "flow3", "flow3", "card", "confirmed"));
    add(place(layout, "flow4", "flow4", "card", "confirmed"));
    add(place(layout, "parked", "parked", "chip", "changed"));
    link("shape", "flow1");
    link("flow1", "flow2");
    link("flow2", "flow3");
    link("flow3", "flow4");
    return { nodes, edges, focus: ["flow1", "flow2", "flow3", "flow4"] };
  }

  const { grown } = vars;
  add(place(layout, "seed", "seed", "seed", "confirmed"));

  if (grown === 2) {
    add(place(layout, "fragTalk", "fragTalk", "chip", "fragment"));
    add(place(layout, "fragProject", "fragProject", "chip", "fragment"));
    add(place(layout, "fragQuote", "fragQuote", "chip", "fragment"));
    link("seed", "fragTalk", true);
    link("seed", "fragProject", true);
    link("seed", "fragQuote", true);
  }

  if (grown >= 3) {
    add(place(layout, "fragTalkNow", "fragTalkNow", "hub", "confirmed"));
    add(place(layout, "who", "who", "card", "confirmed"));
    add(place(layout, "when", "when", "card", "confirmed"));
    add(place(layout, "problem", "problem", "card", "confirmed"));
    add(place(layout, "pain", "pain", "card", "confirmed"));
    add(place(layout, "parked", "parked", "chip", "changed"));
    link("seed", "fragTalkNow", true);
    link("fragTalkNow", "who", true);
    link("fragTalkNow", "when", true);
    link("who", "problem", true);
    link("when", "pain", true);
    link("problem", "pain");
  }

  if (grown >= 4) {
    add(place(layout, "outcome", "outcome", "card", "confirmed"));
    add(place(layout, "shape", "shape", "card", "confirmed"));
    link("problem", "outcome");
    link("pain", "outcome");
    link("outcome", "shape");
  }

  return { nodes, edges, focus: focusFor(grown) };
}

function focusFor(grown: number): string[] {
  switch (grown) {
    case 1:
      return ["seed"];
    case 2:
      return ["fragTalk", "fragProject", "fragQuote"];
    case 3:
      return ["problem", "pain", "who"];
    default:
      return ["outcome", "shape"];
  }
}
