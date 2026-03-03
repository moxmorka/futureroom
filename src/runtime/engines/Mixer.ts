import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";

export function createMixerEngine(initial?: Record<string, any>): ModuleEngine {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();

  const state = { gain: 0.9, mute: false, ...initial };

  input.connect(output);

  function apply() {
    output.gain.value = state.mute ? 0 : Math.max(0, Math.min(1.5, Number(state.gain)));
  }
  apply();

  return {
    audioIn: input,
    audioOut: output,
    setParam(key, value) {
      (state as any)[key] = value;
      apply();
    },
    dispose() {
      try { input.disconnect(); } catch {}
      try { output.disconnect(); } catch {}
    },
  };
}
