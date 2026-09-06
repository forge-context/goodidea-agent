/** Presentation contract only: no demo script, API or workflow policy. */
export type NodeStatus =
  "fragment" | "candidate" | "confirmed" | "unverified" | "changed";
export type NodeShape = "seed" | "hub" | "card" | "chip";
export type Placement<B extends string = string> = {
  id: string;
  content: string;
  shape: NodeShape;
  status: NodeStatus;
  x: number;
  y: number;
  w: number;
  from?: { x: number; y: number };
  branch?: B;
};
export type CanvasEdge = {
  id: string;
  from: string;
  to: string;
  soft?: boolean;
};
export type CanvasView<B extends string = string> = {
  nodes: Placement<B>[];
  edges: CanvasEdge[];
  focus: string[];
};
export type NodeText = {
  caption?: string;
  text: string;
  detail?: string[];
  note?: string;
};
export type CanvasCopy = {
  nodes: Record<string, NodeText>;
  ui: { selectNode: string };
};
