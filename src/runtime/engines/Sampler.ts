import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";

export function createSamplerEngine(initial?: Record<string, any>): ModuleEngine {
  const output = audioCtx.createGain();
  output.gain.value = Number(initial?.gain ?? 0.9);

  const state = {
    gain: 0.9,
    rate: 1,
    start: 0,
    end: 1,
    seqOn: true,
    seqPattern: "1000100010001000",
    seqTicksPerStep: 6,
    seqGateTicks: 1,
    ...initial,
  };

  let buffer: AudioBuffer | null = null;
  const active = new Set<AudioBufferSourceNode>();

  async function loadSample(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = await audioCtx.decodeAudioData(arrayBuffer);
  }

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  function patternAt(i: number) {
    const s = String(state.seqPattern || "");
    if (!s.length) return false;
    const idx = i % s.length;
    const ch = s[idx];
    return ch === "1" || ch === "x" || ch === "X";
  }

  function trigger(velocity = 1) {
    if (!buffer) return;

    const src = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();

    const startNorm = clamp(Number(state.start ?? 0), 0, 1);
    const endNorm = clamp(Number(state.end ?? 1), 0, 1);
    const lo = Math.min(startNorm, endNorm);
    const hi = Math.max(startNorm, endNorm);

    const offset = buffer.duration * lo;
    const dur = Math.max(0.005, buffer.duration * (hi - lo));

    src.buffer = buffer;
    src.playbackRate.setValueAtTime(Number(state.rate ?? 1), audioCtx.currentTime);

    gain.gain.setValueAtTime(clamp(Number(state.gain ?? 0.9) * velocity, 0, 2), audioCtx.currentTime);

    src.connect(gain);
    gain.connect(output);

    active.add(src);

    src.onended = () => {
      active.delete(src);
      try {
        src.disconnect();
      } catch {}
      try {
        gain.disconnect();
      } catch {}
    };

    try {
      src.start(audioCtx.currentTime, offset, dur);
    } catch {}
  }

  function stopAll() {
    for (const src of [...active]) {
      try {
        src.stop();
      } catch {}
      active.delete(src);
    }
  }

  let seqRunning = false;
  let tickCount = 0;
  let step = 0;

  const engine: ModuleEngine = {
    audioOut: output,

    onEvent(msg: EventMessage) {
      if (msg.type === "noteOn") {
        trigger(msg.velocity ?? 1);
        return;
      }

      if (msg.type === "noteOff") {
        return;
      }

      if (msg.type === "start") {
        seqRunning = true;
        tickCount = 0;
        step = 0;
        return;
      }

      if (msg.type === "stop") {
        seqRunning = false;
        return;
      }

      if (msg.type === "clock") {
        if (!seqRunning || !state.seqOn) return;

        tickCount++;
        const tps = Math.max(1, Number(state.seqTicksPerStep || 6));
        if (tickCount % tps !== 0) return;

        if (patternAt(step)) {
          trigger(1);
        }

        step = (step + 1) % 64;
      }
    },

    setParam(key: string, value: any) {
      (state as any)[key] = value;

      if (key === "gain") {
        output.gain.value = Number(value);
      }
    },

    dispose() {
      stopAll();
      try {
        output.disconnect();
      } catch {}
    },
  } as ModuleEngine & { loadSample?: (file: File) => Promise<void> };

  (engine as any).loadSample = loadSample;

  return engine;
}
