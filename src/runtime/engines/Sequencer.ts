import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";
import { clamp } from "../util";

export function createSequencerEngine(initial?: Record<string, any>): ModuleEngine {
  const state = {
    steps: 16,
    pattern: Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 1 : 0)), // triggers
    note: 48,
    velocity: 0.9,
    gate: 0.25, // fraction of step
    division: 6, // ticks per step (24ppqn / 4 = 6 for 16ths)
    ...initial,
  };

  let broadcaster: ((msg: EventMessage) => void) | null = null;
  let running = false;
  let stepIndex = 0;

  function trig() {
    const on = state.pattern[stepIndex] === 1;
    if (!on) return;

    broadcaster?.({ type: "noteOn", note: state.note, velocity: clamp(state.velocity, 0, 1) });

    // schedule noteOff via a short timeout (UI-time; fine for MVP)
    const offDelayMs = clamp(state.gate, 0.05, 0.95) * 120;
    window.setTimeout(() => broadcaster?.({ type: "noteOff", note: state.note }), offDelayMs);
  }

  const engine: ModuleEngine = {
    setParam(key, value) {
      (state as any)[key] = value;
      if (key === "steps") {
        const n = Math.max(1, Math.min(64, Number(value)));
        state.steps = n;
        state.pattern = Array.from({ length: n }, (_, i) => state.pattern[i] ?? 0);
        stepIndex = 0;
      }
    },
    onEvent(msg: EventMessage) {
      if (msg.type === "start") { running = true; stepIndex = 0; }
      if (msg.type === "stop") { running = false; }
      if (msg.type === "clock") {
        if (!running) return;
        if (msg.tick % state.division === 0) {
          trig();
          stepIndex = (stepIndex + 1) % state.steps;
        }
      }
    },
  };

  (engine as any).setBroadcaster = (fn: (msg: EventMessage) => void) => (broadcaster = fn);
  (engine as any).toggleStep = (i: number) => {
    if (i < 0 || i >= state.pattern.length) return;
    state.pattern[i] = state.pattern[i] ? 0 : 1;
  };
  (engine as any).getPattern = () => [...state.pattern];

  return engine;
}
