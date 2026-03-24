import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";

export function createSamplerEngine(params?: Record<string, any>): ModuleEngine {
  const output = audioCtx.createGain();
  output.gain.value = Number(params?.gain ?? 0.9);

  let buffer: AudioBuffer | null = null;

  async function loadSample(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = await audioCtx.decodeAudioData(arrayBuffer);
  }

  function trigger() {
    if (!buffer) return;

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(output);
    src.start();
  }

  const engine: ModuleEngine = {
    audioOut: output,

    onEvent(msg: EventMessage) {
      if (msg.type === "noteOn") {
        trigger();
      }
    },

    setParam(key: string, value: any) {
      if (key === "gain") {
        output.gain.value = Number(value);
      }
    },

    dispose() {
      try {
        output.disconnect();
      } catch {}
    },
  } as ModuleEngine & { loadSample?: (file: File) => Promise<void> };

  (engine as any).loadSample = loadSample;

  return engine;
}
