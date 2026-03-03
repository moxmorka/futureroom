import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";
import { clamp } from "../util";

type Send = (msg: EventMessage) => void;

export function createPixelSeqEngine(initial?: Record<string, any>): ModuleEngine {
  const state = {
    steps: 16,
    rows: 8,
    seqOn: true,
    rootNote: 48,
    gateTicks: 3,
    ticksPerStep: 6,

    // grid as comma-separated ints length steps*rows
    // -1 = off, otherwise 0..5 palette index
    grid: "",
    ...initial,
  };

  let send: Send | null = null;
  let running = false;
  let tickCount = 0;
  let step = 0;

  let gateLeft = 0;
  let gateNote: number | null = null;

  // palette => semitone offset + cents offset + velocity
  const palette = [
    { semi: 0, cents: -25, vel: 0.6 },
    { semi: 0, cents: 0, vel: 0.85 },
    { semi: 0, cents: +25, vel: 0.95 },
    { semi: 7, cents: 0, vel: 0.85 },
    { semi: 12, cents: 0, vel: 0.9 },
    { semi: -12, cents: 0, vel: 0.75 },
  ];

  function parseGrid(): number[] {
    const total = Number(state.steps) * Number(state.rows);
    const raw = String(state.grid || "");
    if (!raw) return new Array(total).fill(-1);
    const parts = raw.split(",").map((x) => Number(x));
    const out = new Array(total).fill(-1);
    for (let i = 0; i < Math.min(total, parts.length); i++) {
      out[i] = Number.isFinite(parts[i]) ? parts[i] : -1;
    }
    return out;
  }

  function pickCellForStep(grid: number[], s: number) {
    // choose the lowest row active cell at step (musically: bottom = bass)
    const rows = Number(state.rows);
    const steps = Number(state.steps);
    for (let r = rows - 1; r >= 0; r--) {
      const idx = r * steps + s;
      const v = grid[idx];
      if (v >= 0) return { r, v };
    }
    return null;
  }

  function sendNoteOn(note: number, vel: number) {
    send?.({ type: "noteOn", note, velocity: clamp(vel, 0, 1) });
  }
  function sendNoteOff(note: number) {
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
        if (gateNote != null) sendNoteOff(gateNote);
        gateLeft = 0;
        gateNote = null;
      }

      if (msg.type === "clock") {
        if (!running || !state.seqOn) return;

        if (gateLeft > 0) {
          gateLeft--;
          if (gateLeft === 0 && gateNote != null) {
            sendNoteOff(gateNote);
            gateNote = null;
          }
        }

        tickCount++;
        const tps = Math.max(1, Number(state.ticksPerStep || 6));
        if (tickCount % tps !== 0) return;

        const grid = parseGrid();
        const cell = pickCellForStep(grid, step % Number(state.steps));
        if (cell) {
          const pal = palette[clamp(cell.v, 0, palette.length - 1)];
          const note = Number(state.rootNote) + (Number(state.rows) - 1 - cell.r) + pal.semi;
          sendNoteOn(note, pal.vel);
          gateNote = note;
          gateLeft = Math.max(1, Number(state.gateTicks || 3));
        }

        step = (step + 1) % 64;
      }
    },
  };

  // broadcaster hook like Clock engine uses
  (engine as any).setBroadcaster = (fn: Send) => (send = fn);

  return engine;
}
