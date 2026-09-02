import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { StudioCopy } from "./ideaStudioCopy";
import type { CanvasView, Placement } from "./ideaStudioFlow";

type DimLevel = "none" | "soft" | "strong";

/** Vertical breathing room the tidy-up pass keeps between two stacked nodes. */
const MIN_GAP = 12;
/** Two nodes count as sharing a column when their boxes come this close, in px. */
const X_MARGIN = 8;
/** Below this the labels stop being readable, so the board scrolls instead. */
const MIN_SCALE = 0.78;
const ESTIMATED_HEIGHT = 46;
/** Breathing room between a node and the edge of the board. */
const EDGE_PAD = 4;

type Laid = { node: Placement; centre: number; top: number; width: number; height: number };

/* The declared layout is tuned for one language; the same node is one line in
 * English and two in Japanese. So the agent tidies the board after measuring: any
 * node that would sit on top of one above it is pushed down until it clears. */
function tidy(nodes: Placement[], heights: Record<string, number>, boardWidth: number): Laid[] {
  const items: Laid[] = nodes
    .map((node) => {
      const width = Math.min((node.w / 100) * boardWidth, boardWidth - 2 * EDGE_PAD);
      const half = width / 2;
      return {
        node,
        // Kept inside the board: a node that hangs over the edge is a node with a
        // cut-off word, whichever language made it wide.
        centre: Math.min(Math.max((node.x / 100) * boardWidth, half + EDGE_PAD), boardWidth - half - EDGE_PAD),
        width,
        top: node.y,
        height: heights[node.id] ?? ESTIMATED_HEIGHT,
      };
    })
    .sort((a, b) => a.top - b.top || a.centre - b.centre);

  for (let i = 1; i < items.length; i += 1) {
    const below = items[i];
    for (let j = 0; j < i; j += 1) {
      const above = items[j];
      const aLeft = above.centre - above.width / 2 - X_MARGIN;
      const aRight = above.centre + above.width / 2 + X_MARGIN;
      const bLeft = below.centre - below.width / 2;
      const bRight = below.centre + below.width / 2;
      if (bRight <= aLeft || bLeft >= aRight) continue;
      const clear = above.top + above.height + MIN_GAP;
      if (below.top < clear) below.top = clear;
    }
  }
  return items;
}

export function ProductCanvas({
  view,
  copy,
  dim,
  selectedNodeId,
  onSelectNode,
  textOverrides,
  reduceMotion,
  minScale = MIN_SCALE,
}: {
  view: CanvasView;
  copy: StudioCopy;
  dim: DimLevel;
  selectedNodeId?: string | null;
  onSelectNode?: (node: Placement) => void;
  textOverrides?: Record<string, string>;
  reduceMotion: boolean;
  /** On a phone the map is a panel of its own, so it stays near full size and
   *  scrolls rather than shrinking to an unreadable diagram. */
  minScale?: number;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [heights, setHeights] = useState<Record<string, number>>({});

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setBox((prev) =>
        Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5
          ? prev
          : { width: rect.width, height: rect.height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // What the nodes say decides how tall they are, so re-measure whenever the text
  // or the available width changes — never on every render, which would loop.
  const shapeKey = view.nodes.map((node) => `${node.id}:${node.content}:${node.w}`).join("|");

  useLayoutEffect(() => {
    if (box.width === 0) return;
    let changed = false;
    const next: Record<string, number> = {};
    for (const node of view.nodes) {
      const element = nodeRefs.current.get(node.id);
      const height = element ? element.offsetHeight : ESTIMATED_HEIGHT;
      next[node.id] = height;
      if (Math.abs((heights[node.id] ?? -1) - height) > 0.5) changed = true;
    }
    if (changed || Object.keys(next).length !== Object.keys(heights).length) setHeights(next);
  }, [shapeKey, box.width, view.nodes, heights]);

  const laid = useMemo(() => tidy(view.nodes, heights, box.width || 360), [view.nodes, heights, box.width]);
  const contentHeight = laid.reduce((tallest, item) => Math.max(tallest, item.top + item.height), 0) + 4;
  const scale =
    box.height > 0 && contentHeight > box.height ? Math.max(minScale, box.height / contentHeight) : 1;
  const lift = box.height > contentHeight ? Math.min((box.height - contentHeight) / 2, 120) : 0;

  const byId = new Map(laid.map((item) => [item.node.id, item]));
  const focus = new Set(view.focus);
  const selectedRelated = useMemo(() => {
    if (!selectedNodeId) return null;
    const ids = new Set([selectedNodeId]);
    view.edges.forEach((edge) => {
      if (edge.from === selectedNodeId) ids.add(edge.to);
      if (edge.to === selectedNodeId) ids.add(edge.from);
    });
    return ids;
  }, [selectedNodeId, view.edges]);

  // When the map is taller than its panel — a phone, mostly — what just changed
  // has to be the part you are looking at.
  const focusKey = view.focus.join(",");
  useEffect(() => {
    const element = viewportRef.current;
    if (!element || element.scrollHeight <= element.clientHeight + 1) return;
    const targets = laid.filter((item) => view.focus.includes(item.node.id));
    if (targets.length === 0) return;
    const middle =
      (targets.reduce((sum, item) => sum + item.top + item.height / 2, 0) / targets.length) * scale;
    element.scrollTo({
      top: Math.max(0, middle - element.clientHeight / 2),
      behavior: reduceMotion ? "auto" : "smooth",
    });
    // The layout, not every render, decides where the new concept sits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, contentHeight, scale, reduceMotion]);

  const setNodeRef = useCallback((id: string, element: HTMLElement | null) => {
    if (element) nodeRefs.current.set(id, element);
    else nodeRefs.current.delete(id);
  }, []);

  return (
    <div className="canvas-viewport" ref={viewportRef}>
      <div
        className="canvas-board"
        style={{
          width: box.width || undefined,
          // The scaled height is the laid-out height: leaving the full height here
          // would keep a scrollbar for content that already fits on screen.
          height: contentHeight * scale,
          transform: `translateY(${lift}px)${scale === 1 ? "" : ` scale(${scale})`}`,
        }}
      >
        <svg className="canvas-edges" width={box.width || 360} height={contentHeight} aria-hidden="true">
          {view.edges.map((edge) => {
            const from = byId.get(edge.from);
            const to = byId.get(edge.to);
            if (!from || !to) return null;
            const selectedLit =
              !selectedRelated || selectedRelated.has(edge.from) || selectedRelated.has(edge.to);
            const lit = selectedLit && (dim !== "strong" || focus.has(edge.from) || focus.has(edge.to));
            return (
              <line
                key={edge.id}
                className="canvas-edge"
                x1={from.centre}
                y1={from.top + from.height / 2}
                x2={to.centre}
                y2={to.top + to.height / 2}
                strokeDasharray={edge.soft ? "3 5" : undefined}
                opacity={lit ? 1 : 0.2}
              />
            );
          })}
        </svg>

        {laid.map((item) => (
          <CanvasNodeView
            key={item.node.id}
            item={item}
            boardWidth={box.width || 360}
            copy={copy}
            dim={
              selectedRelated && !selectedRelated.has(item.node.id)
                ? "strong"
                : focus.has(item.node.id)
                  ? "none"
                  : dim
            }
            selected={selectedNodeId === item.node.id}
            onSelectNode={onSelectNode}
            textOverride={textOverrides?.[item.node.id]}
            reduceMotion={reduceMotion}
            setNodeRef={setNodeRef}
          />
        ))}
      </div>
    </div>
  );
}

function CanvasNodeView({
  item,
  boardWidth,
  copy,
  dim,
  selected,
  onSelectNode,
  textOverride,
  reduceMotion,
  setNodeRef,
}: {
  item: Laid;
  boardWidth: number;
  copy: StudioCopy;
  dim: DimLevel;
  selected: boolean;
  onSelectNode?: (node: Placement) => void;
  textOverride?: string;
  reduceMotion: boolean;
  setNodeRef: (id: string, element: HTMLElement | null) => void;
}) {
  const { node } = item;
  // A fragment drifts in from where it was mentioned and settles into place. With
  // reduced motion it is simply already there.
  const [settled, setSettled] = useState(() => !node.from || reduceMotion);

  useEffect(() => {
    if (settled) return;
    const timer = window.setTimeout(() => setSettled(true), 80);
    return () => window.clearTimeout(timer);
  }, [settled]);

  const left = settled ? item.centre : ((node.from?.x ?? node.x) / 100) * boardWidth;
  const top = settled ? item.top : node.from?.y ?? item.top;

  const style = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${item.width}px`,
    opacity: settled ? undefined : 0,
  };

  const original = copy.nodes[node.content];
  const text = textOverride ? { ...original, text: textOverride } : original;
  const body = <NodeBody text={text} />;
  const className = [
    "canvas-node",
    `is-${node.status}`,
    `shape-${node.shape}`,
    dim === "soft" ? "is-quiet" : "",
    dim === "strong" ? "is-back" : "",
    selected ? "is-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (onSelectNode) {
    return (
      <button
        type="button"
        className={`${className} is-selectable`}
        style={style}
        ref={(element) => setNodeRef(node.id, element)}
        onClick={() => onSelectNode(node)}
        aria-pressed={selected}
        aria-label={`${text.text} — ${copy.ui.selectNode}`}
      >
        {body}
        {/* A corner mark rather than a line of label: the affordance has to be
            visible without touch users hovering, and without making the node
            taller than the layout budgeted for it. */}
        {node.branch && (
          <span className="canvas-node-open" aria-hidden="true">
            ↗
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={className} style={style} ref={(element) => setNodeRef(node.id, element)}>
      {body}
    </div>
  );
}

function NodeBody({ text }: { text: { caption?: string; text: string; detail?: string[]; note?: string } }) {
  return (
    <>
      {text.caption && <span className="canvas-node-caption">{text.caption}</span>}
      <span className="canvas-node-text">{text.text}</span>
      {text.detail && (
        <ul className="canvas-node-detail">
          {text.detail.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {text.note && <span className="canvas-node-note">{text.note}</span>}
    </>
  );
}
