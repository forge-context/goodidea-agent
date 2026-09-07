/* The playback state machine behind "watch the walkthrough".
 *
 * It is deliberately plain data: no React, no timers, no DOM. The component owns
 * exactly one timeout and asks this module what to do next, which is what keeps two
 * timers from ever running against the same scene, and what makes pause actually
 * stop the typing, the conversation and the map instead of only the visible one.
 *
 * A turn is four beats, and all four live in this one state: the visitor's line
 * appears character by character in the demo field (`typing`), rests there
 * (`pending`), lands in the thread on its own (`sent`), and only then is answered
 * while the map moves (`reply`, which doubles as the reading hold). Because the beat
 * is part of the state, a pause freezes the half-typed line exactly where it was, and
 * a jump or a replay cannot leave the previous scene still typing: there is one
 * timeout, and it is re-armed from whatever the state says now.
 *
 * The manual walkthrough is a separate state entirely. Nothing here writes into it,
 * so switching modes cannot overwrite a choice the visitor made by hand, and the
 * simulated draft never reaches the field the visitor types into.
 */

export type PlayMode = "intro" | "auto" | "manual";

/** The beats of one turn, in order. */
export type Beat = "typing" | "pending" | "sent" | "reply";

export type AutoState = {
  /** Index into the scene list. Scene 0 is what the intro screen already shows. */
  index: number;
  /** Which beat of the scene is on screen. */
  beat: Beat;
  /** How many characters of this scene's line are in the demo field. */
  typed: number;
  /** Whether playback wants to advance. Being hidden or reduced-motion holds it. */
  playing: boolean;
  /** True once the last scene is on screen; the transport offers replay instead. */
  finished: boolean;
};

/** What the reducer needs to know about the scenes, without knowing the scenes. */
export type PlaybackPlan = {
  /** Number of scenes. */
  count: number;
  /** Characters to type per scene; 0 means the scene opens with the answer. */
  typed: number[];
  /** Characters revealed per typing tick. */
  perTick: number;
};

export type AutoAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "toggle" }
  | { type: "advance" }
  /** `whole` lands on the finished scene instead of at the start of its typing. */
  | { type: "seek"; index: number; whole?: boolean }
  | { type: "step"; by: number }
  | { type: "replay" };

export const autoInitial: AutoState = {
  index: 0,
  beat: "reply",
  typed: 0,
  playing: false,
  finished: false,
};

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

/** Where a scene starts: at its first character, or straight at the answer. */
function opening(plan: PlaybackPlan, index: number): Pick<AutoState, "beat" | "typed"> {
  return plan.typed[index] > 0 ? { beat: "typing", typed: 0 } : { beat: "reply", typed: 0 };
}

export function autoReducer(state: AutoState, action: AutoAction, plan: PlaybackPlan): AutoState {
  const last = Math.max(plan.count - 1, 0);

  /** Start of a scene. The last scene is the end of playback, so it stops there. */
  const at = (index: number, playing: boolean): AutoState => {
    const settled = clamp(index, last);
    const done = settled >= last;
    return { index: settled, ...opening(plan, settled), playing: done ? false : playing, finished: done };
  };

  /** A scene with everything it has to say already on screen. */
  const whole = (index: number, playing: boolean): AutoState => {
    const settled = clamp(index, last);
    return {
      index: settled,
      beat: "reply",
      typed: plan.typed[settled] ?? 0,
      playing: settled >= last ? false : playing,
      finished: settled >= last,
    };
  };

  switch (action.type) {
    case "play":
    case "replay":
      return at(0, true);
    case "pause":
      return { ...state, playing: false };
    case "resume":
      // Resuming after the end replays rather than sitting on a dead play button.
      return state.finished ? at(0, true) : { ...state, playing: true };
    case "toggle":
      return autoReducer(state, { type: state.playing ? "pause" : "resume" }, plan);
    case "advance": {
      // A timeout that survived a pause must not move anything.
      if (!state.playing) return state;
      const target = plan.typed[state.index] ?? 0;
      switch (state.beat) {
        case "typing": {
          const typed = Math.min(state.typed + plan.perTick, target);
          // The line is only sent once every character of it is on screen.
          return typed < target ? { ...state, typed } : { ...state, typed, beat: "pending" };
        }
        case "pending":
          return { ...state, beat: "sent" };
        case "sent":
          return { ...state, beat: "reply" };
        default:
          return at(state.index + 1, true);
      }
    }
    case "seek":
      return action.whole ? whole(action.index, false) : at(action.index, state.playing);
    case "step":
      return whole(state.index + action.by, false);
    default:
      return state;
  }
}

/** The one condition under which the component is allowed to arm a timer. */
export function shouldAdvance(
  state: AutoState,
  { mode, visible, reduceMotion }: { mode: PlayMode; visible: boolean; reduceMotion: boolean },
): boolean {
  return mode === "auto" && state.playing && !state.finished && visible && !reduceMotion;
}
