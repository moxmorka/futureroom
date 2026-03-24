import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";

function clampInt(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function buildPattern(steps: number, pulses: number, rotation: number) {
  const out = new Array(steps).fill(false);
  if (steps <= 0 || pulses <= 0) return out;
  for (let i = 0; i < steps; i++) {
    out[(i + rotation + steps) % steps] = (i * pulses) % steps < pulses;
  }
  return out;
}

type Send = (msg: EventMessage) => void;

export function createEuclideanSeqEngine(initial?: Record<string, any>): ModuleEngine {
  const state = {
    seqOn: true,
    steps: 16,
    pulses: 5,
    rotation: 0,
    note: 48,
    ticksPerStep: 6,
    gateTicks: 3,
    velocity: 0.9,
    ...initial,
  };

  let send: Send | null = null;
  let running = false;
  let tickCount = 0;
  let step = 0;
  let gateLeft = 0;
  let gateNote: number | null = null;

  function noteOn(note: number, velocity: number) {
    send?.({ type: "noteOn", note, velocity });
  }
  function noteOff(note: number) {
    send?.({ type: "noteOff", note });
  }

  const engine: ModuleEngine = {
    setParam(key, value) {
      (state as any)[key] = value;
    },

    onEvent(msg: EventMessage) {
      if (msg.type === "start") {
        running = true;
        tickCount = 0;
        step = 0;
        gateLeft = 0;
        gateNote = null;
      }
      if (msg.type === "stop") {
        running = false;
        if (gateNote != null) noteOff(gateNote);
        gateLeft = 0;
        gateNote = null;
      }
      if (msg.type !== "clock" || !running || !state.seqOn) return;

      if (gateLeft > 0) {
        gateLeft--;
        if (gateLeft === 0 && gateNote != null) {
          noteOff(gateNote);
          gateNote = null;
        }
      }

      tickCount++;
      const tps = Math.max(1, Number(state.ticksPerStep || 6));
      if (tickCount % tps !== 0) return;

      const steps = clampInt(Number(state.steps || 16), 1, 32);
      const pulses = clampInt(Number(state.pulses || 5), 0, steps);
      const rotation = clampInt(Number(state.rotation || 0), -64, 64);
      const pattern = buildPattern(steps, pulses, rotation);
      const currentStep = step % steps;

      if (pattern[currentStep]) {
        const note = clampInt(Number(state.note || 48), 24, 96);
        noteOn(note, Math.max(0, Math.min(1, Number(state.velocity || 0.9))));
        gateNote = note;
        gateLeft = Math.max(1, Number(state.gateTicks || 3));
      }

      step = (step + 1) % steps;
    },
  };

  (engine as any).setBroadcaster = (fn: Send) => (send = fn);
  return engine;
}
