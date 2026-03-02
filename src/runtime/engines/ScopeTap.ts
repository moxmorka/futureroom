import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";

export function createScopeTapEngine(): ModuleEngine {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  const analyser = audioCtx.createAnalyser();

  analyser.fftSize = 2048;
  input.connect(analyser);
  input.connect(output);

  return {
    audioIn: input,
    audioOut: output,
    analyser,
    setParam() {},
    dispose() {
      input.disconnect();
      analyser.disconnect();
      output.disconnect();
    },
  };
}
