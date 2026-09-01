/* The fixed storyboard behind the landing-page demo.
 *
 * Nothing here reaches an API, a database, or a broker. The whole walkthrough is a
 * small state machine plus a per-state canvas layout, so what a visitor sees is the
 * product behaviour and never a live agent.
 *
 * The canvas is laid out in a design space rather than as free-floating boxes: `x`
 * and `w` are percentages of the board width, `y` is the node's top in pixels. Node
 * heights are measured at runtime, because the same node is one line in English and
 * two in Japanese, and a layout that assumes a height is a layout that collides in
 * the language it was not tuned in.
 */

export type StudioLocale = "en" | "ja" | "zh-CN";

export type NodeStatus = "fragment" | "candidate" | "confirmed" | "unverified" | "changed";
export type NodeShape = "seed" | "hub" | "card" | "chip";
export type BranchId = "people" | "help";

export type Placement = {
  /** Identity across states, so a node moves instead of being replaced. */
  id: string;
  /** Which copy entry this node currently shows; a node can change what it says. */
  content: string;
  shape: NodeShape;
  status: NodeStatus;
  /** Centre, as a percentage of the board width. */
  x: number;
  /** Top, in pixels of the board's design space. */
  y: number;
  /** Width, as a percentage of the board width. */
  w: number;
  /** Where the node drifts in from the first time it appears. */
  from?: { x: number; y: number };
  branch?: BranchId;
};

export type CanvasEdge = { id: string; from: string; to: string; soft?: boolean };

export type CanvasView = {
  nodes: Placement[];
  edges: CanvasEdge[];
  /** What the current turn is about; everything else fades back. */
  focus: string[];
};

export type CanvasVars = {
  /** How far the idea has grown, 1 to 6. */
  grown: 1 | 2 | 3 | 4 | 5 | 6;
  people: null | "a" | "b";
  help: null | "a" | "b";
  firstStep: boolean;
};

export const initialCanvas: CanvasVars = {
  grown: 1,
  people: null,
  help: null,
  firstStep: false,
};

type Spot = { x: number; y: number; w: number; from?: { x: number; y: number } };

/* Each state gets its own arrangement. The agent tidies the board as the idea
 * grows: nodes move closer together and make room instead of the board getting
 * taller, which is what keeps the whole map inside the demo window. */
const SPOTS: Record<number, Record<string, Spot>> = {
  1: {
    seed: { x: 50, y: 92, w: 86 },
  },
  2: {
    seed: { x: 50, y: 12, w: 82 },
    whoHub: { x: 34, y: 110, w: 46, from: { x: 46, y: 56 } },
    fragA: { x: 26, y: 182, w: 50, from: { x: 34, y: 118 } },
    fragB: { x: 66, y: 238, w: 52, from: { x: 38, y: 124 } },
    fragC: { x: 30, y: 296, w: 56, from: { x: 34, y: 130 } },
  },
  /* From here the board runs as two columns: everything the user is on the left,
   * everything the situation is on the right. The columns are kept apart on the x
   * axis on purpose — nodes that overlap sideways get stacked by the tidy-up pass,
   * and a stack is what pushes the map off the bottom of the window. */
  3: {
    seed: { x: 50, y: 6, w: 78 },
    whoHub: { x: 25, y: 92, w: 44 },
    fragB: { x: 27, y: 156, w: 48 },
    fragA: { x: 22, y: 240, w: 42 },
    fragC: { x: 26, y: 292, w: 46 },
    when: { x: 77, y: 92, w: 40, from: { x: 66, y: 40 } },
  },
  4: {
    seed: { x: 50, y: 2, w: 74 },
    whoHub: { x: 25, y: 82, w: 44 },
    fragB: { x: 27, y: 142, w: 48 },
    fragA: { x: 22, y: 224, w: 42 },
    fragC: { x: 26, y: 276, w: 46 },
    when: { x: 77, y: 82, w: 40 },
    problem: { x: 76, y: 146, w: 42, from: { x: 84, y: 98 } },
    scene: { x: 72, y: 244, w: 32, from: { x: 74, y: 198 } },
  },
  5: {
    seed: { x: 50, y: 0, w: 72 },
    whoHub: { x: 25, y: 78, w: 44 },
    fragB: { x: 27, y: 136, w: 48 },
    fragA: { x: 22, y: 216, w: 42 },
    fragC: { x: 26, y: 266, w: 46 },
    when: { x: 77, y: 78, w: 40 },
    problem: { x: 76, y: 138, w: 42 },
    scene: { x: 72, y: 232, w: 32 },
    outcome: { x: 77, y: 300, w: 42, from: { x: 77, y: 252 } },
  },
  6: {
    seed: { x: 50, y: 0, w: 78 },
    whoHub: { x: 25, y: 70, w: 44 },
    fragB: { x: 27, y: 126, w: 48 },
    fragA: { x: 22, y: 190, w: 42 },
    fragC: { x: 26, y: 232, w: 46 },
    when: { x: 77, y: 70, w: 40 },
    problem: { x: 76, y: 126, w: 42 },
    scene: { x: 72, y: 206, w: 32 },
    outcome: { x: 77, y: 258, w: 42 },
    help: { x: 26, y: 286, w: 50, from: { x: 40, y: 250 } },
    feasible: { x: 77, y: 340, w: 40, from: { x: 77, y: 296 } },
  },
  /* Once the first step is named the map is complete, so the agent tightens the
   * board one last time to keep all of it on screen at once. */
  7: {
    seed: { x: 50, y: 0, w: 78 },
    whoHub: { x: 25, y: 66, w: 44 },
    when: { x: 77, y: 66, w: 40 },
    fragB: { x: 27, y: 120, w: 48 },
    problem: { x: 76, y: 120, w: 42 },
    fragA: { x: 22, y: 182, w: 42 },
    scene: { x: 72, y: 200, w: 32 },
    fragC: { x: 26, y: 222, w: 46 },
    outcome: { x: 77, y: 250, w: 42 },
    help: { x: 26, y: 280, w: 50 },
    feasible: { x: 77, y: 348, w: 40 },
    firstStep: { x: 50, y: 470, w: 68, from: { x: 50, y: 430 } },
  },
};

function place(
  layout: number,
  id: string,
  content: string,
  shape: NodeShape,
  status: NodeStatus,
  branch?: BranchId,
): Placement | null {
  const spot = SPOTS[layout]?.[id];
  if (!spot) return null;
  return { id, content, shape, status, x: spot.x, y: spot.y, w: spot.w, from: spot.from, branch };
}

export function buildCanvas(vars: CanvasVars): CanvasView {
  const { grown } = vars;
  const layout = vars.firstStep ? 7 : grown;
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

  add(place(layout, "seed", "seed", "seed", "confirmed"));

  if (grown >= 2) {
    const merged = vars.people !== null;
    add(
      place(
        layout,
        "whoHub",
        merged ? "whoHubMerged" : "whoHub",
        "hub",
        merged ? "confirmed" : "candidate",
        "people",
      ),
    );
    add(
      place(
        layout,
        "fragA",
        merged ? "fragAAside" : "fragA",
        "chip",
        merged ? "changed" : "fragment",
      ),
    );
    add(
      place(
        layout,
        "fragC",
        vars.people === "a" ? "earlyUserA" : vars.people === "b" ? "earlyUserB" : "fragC",
        merged ? "card" : "chip",
        merged ? "confirmed" : "fragment",
      ),
    );
    add(
      grown >= 3
        ? place(layout, "fragB", "who", "card", grown >= 5 ? "confirmed" : "candidate")
        : place(layout, "fragB", "fragB", "chip", "fragment"),
    );
    link("seed", "whoHub", true);
    link("whoHub", "fragA", true);
    link("whoHub", "fragB", true);
    link("whoHub", "fragC", true);
  }

  if (grown >= 3) {
    add(place(layout, "when", "when", "card", grown >= 5 ? "confirmed" : "candidate"));
    link("seed", "when", true);
  }

  if (grown >= 4) {
    add(place(layout, "problem", "problem", "card", grown >= 5 ? "confirmed" : "candidate"));
    add(place(layout, "scene", "scene", "hub", grown >= 5 ? "confirmed" : "candidate"));
    link("seed", "problem", true);
    link("scene", "fragB", true);
    link("scene", "when", true);
    link("scene", "problem", true);
  }

  if (grown >= 5) {
    add(place(layout, "outcome", "outcome", "card", "confirmed"));
    link("scene", "outcome");
  }

  if (grown >= 6) {
    add(
      place(
        layout,
        "help",
        vars.help === "a" ? "helpA" : vars.help === "b" ? "helpB" : "help",
        "card",
        "confirmed",
        "help",
      ),
    );
    add(
      place(
        layout,
        "feasible",
        vars.help === "a" ? "feasibleA" : vars.help === "b" ? "feasibleB" : "feasible",
        "card",
        "unverified",
      ),
    );
    link("outcome", "help");
    link("help", "feasible", true);
    if (vars.firstStep) {
      add(place(layout, "firstStep", "firstStep", "card", "confirmed"));
      link("help", "firstStep");
    }
  }

  return { nodes, edges, focus: focusFor(vars) };
}

function focusFor(vars: CanvasVars): string[] {
  if (vars.firstStep) return ["firstStep", "help"];
  switch (vars.grown) {
    case 1:
      return ["seed"];
    case 2:
      return ["whoHub", "fragA", "fragB", "fragC"];
    case 3:
      return ["fragB", "when"];
    case 4:
      return ["problem", "scene", "fragB", "when"];
    case 5:
      return ["outcome", "scene"];
    default:
      return ["help", "feasible", "outcome"];
  }
}

/** What the canvas highlights while a branch is open. */
export const branchFocus: Record<BranchId, string[]> = {
  people: ["whoHub", "fragA", "fragB", "fragC"],
  help: ["help", "outcome", "feasible"],
};

/* ------------------------------- conversation ------------------------------ */

export type StepId = "s0" | "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "bp0" | "bh0";
export type HintId = "scene" | "shape" | "updated";

export type OptionDef = {
  id: string;
  next: StepId | null;
  canvas?: Partial<CanvasVars>;
  stage?: number;
  hint?: HintId;
  /** Opens a side conversation instead of moving the main thread on. */
  branch?: BranchId;
  /** Ends a side conversation with a change preview the user has to accept. */
  preview?: "a" | "b";
};

export type StepDef = { id: StepId; stage: number; options: OptionDef[] };

export const steps: Record<StepId, StepDef> = {
  s0: {
    id: "s0",
    stage: 0,
    options: [
      { id: "s0a", next: "s1", canvas: { grown: 2 }, stage: 1 },
      { id: "s0b", next: "s1", canvas: { grown: 2 }, stage: 1 },
    ],
  },
  s1: {
    id: "s1",
    stage: 1,
    options: [
      { id: "s1a", next: "s2", canvas: { grown: 3 } },
      { id: "s1b", next: "s2", canvas: { grown: 3 } },
    ],
  },
  s2: {
    id: "s2",
    stage: 1,
    options: [
      { id: "s2a", next: "s3", canvas: { grown: 4 }, stage: 2, hint: "scene" },
      { id: "s2b", next: "s3", canvas: { grown: 4 }, stage: 2, hint: "scene" },
    ],
  },
  s3: {
    id: "s3",
    stage: 2,
    options: [
      { id: "s3a", next: "s4", canvas: { grown: 5 } },
      { id: "s3b", next: "s4", canvas: { grown: 5 } },
    ],
  },
  s4: {
    id: "s4",
    stage: 2,
    options: [
      { id: "s4a", next: "s5", canvas: { grown: 6 }, stage: 3, hint: "shape" },
      { id: "s4b", next: "s5", canvas: { grown: 6 }, stage: 3, hint: "shape" },
    ],
  },
  s5: {
    id: "s5",
    stage: 3,
    options: [
      { id: "s5a", next: "bp0", branch: "people", stage: 1 },
      { id: "s5b", next: "s6", canvas: { firstStep: true }, stage: 4 },
    ],
  },
  s6: { id: "s6", stage: 4, options: [] },
  bp0: {
    id: "bp0",
    stage: 1,
    options: [
      { id: "bp0a", next: null, preview: "a" },
      { id: "bp0b", next: null, preview: "b" },
    ],
  },
  bh0: {
    id: "bh0",
    stage: 3,
    options: [
      { id: "bh0a", next: null, preview: "a" },
      { id: "bh0b", next: null, preview: "b" },
    ],
  },
};

export const branchEntryStep: Record<BranchId, StepId> = { people: "bp0", help: "bh0" };
export const branchStage: Record<BranchId, number> = { people: 1, help: 3 };
