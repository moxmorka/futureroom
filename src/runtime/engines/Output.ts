import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";

export function createOutputEngine(): ModuleEngine {
  const input = audioCtx.createGain();
  input.gain.value = 0.9;
  input.connect(audioCtx.destination);

  return {
    audioIn: input,
    setParam() {},
    dispose() {
      input.disconnect();
    },
  };
}
