import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";
import { clamp } from "../util";

export function createDigitaktEngine(initial?: Record<string, any>): ModuleEngine {
  const output = audioCtx.createGain();
  output.gain.value = 0.9;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 12000;

  const amp = audioCtx.createGain();
  amp.gain.value = 0;

  filter.connect(amp);
  amp.connect(output);

  const state = {
    steps: 16,
    running: false,
    pattern: Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 1 : 0)),
    ...initial,
  };

  let step = 0;

  const engine: ModuleEngine = {
    audioOut: output,

    setParam(key, value) {
      (state as any)[key] = value;
    },

    onEvent(msg: EventMessage) {
      if (msg.type === "start") {
        state.running = true;
        step = 0;
      }

      if (msg.type === "stop") {
        state.running = false;
      }

      if (msg.type === "clock" && state.running) {
        if (state.pattern[step]) {
          const osc = audioCtx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = 120;
          osc.connect(filter);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.1);
        }

        step = (step + 1) % state.steps;
      }
    },

    dispose() {
      try { filter.disconnect(); } catch {}
      try { amp.disconnect(); } catch {}
      try { output.disconnect(); } catch {}
    }
  };

  return engine;
}
