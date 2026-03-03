import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";
import { clamp } from "../util";

export function createSamplerEngine(initial?: Record<string, any>): ModuleEngine {
  const output = audioCtx.createGain();
  output.gain.value = 0.9;

  const state = {
    gain: 0.9,
    rate: 1.0,
    start: 0.0, // 0..1
    end: 1.0,   // 0..1
    seqOn: true,
    seqPattern: "1000100010001000",
    seqTicksPerStep: 6,
    seqGateTicks: 1,
    ...initial,
  };

  let buffer: AudioBuffer | null = null;
  let running = false;
  let tickCount = 0;
  let step = 0;

  function patternAt(i: number) {
    const s = String(state.seqPattern || "");
    if (!s.length) return false;
    const idx = i % s.length;
    const c = s[idx];
    return c === "1" || c === "x" || c === "X";
  }

  function trigger(vel = 1) {
    if (!buffer) return;

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;

    const g = audioCtx.createGain();
    g.gain.value = clamp(vel, 0, 1) * clamp(Number(state.gain), 0, 1);

    src.playbackRate.value = clamp(Number(state.rate), 0.25, 4);

    const st = clamp(Number(state.start), 0, 0.999);
    const en = clamp(Number(state.end), st + 0.001, 1);

    const dur = buffer.duration;
    const startSec = st * dur;
    const endSec = en * dur;
    const playDur = Math.max(0.01, endSec - startSec);

    src.connect(g);
    g.connect(output);

    const t = audioCtx.currentTime;
    try {
      src.start(t, startSec, playDur);
    } catch {
      // fallback if browser doesn't like duration arg
      src.start(t, startSec);
      src.stop(t + playDur);
    }

    src.onended = () => {
      try { src.disconnect(); } catch {}
      try { g.disconnect(); } catch {}
    };
  }

  const engine: ModuleEngine = {
    audioOut: output,

    setParam(key, value) {
      (state as any)[key] = value;
      if (key === "buffer" && value instanceof AudioBuffer) buffer = value;
    },

    onEvent(msg: EventMessage) {
      if (msg.type === "noteOn") trigger(msg.velocity);

      if (msg.type === "start") {
        running = true;
        tickCount = 0;
        step = 0;
      }
      if (msg.type === "stop") running = false;

      if (msg.type === "clock") {
        if (!running || !state.seqOn) return;

        tickCount++;
        const tps = Math.max(1, Number(state.seqTicksPerStep || 6));
        if (tickCount % tps !== 0) return;

        if (patternAt(step)) trigger(0.95);
        step = (step + 1) % 64;
      }
    },

    dispose() {
      try { output.disconnect(); } catch {}
      buffer = null;
    },
  };

  return engine;
}
