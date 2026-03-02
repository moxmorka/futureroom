import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";
import { clamp } from "../util";

export function createSamplerEngine(initial?: Record<string, any>): ModuleEngine {
  const output = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const amp = audioCtx.createGain();

  filter.type = "lowpass";
  filter.frequency.value = 12000;

  output.gain.value = 0.9;
  amp.gain.value = 0.0;

  filter.connect(amp);
  amp.connect(output);

  const state = {
    gain: 0.8,
    attack: 0.003,
    release: 0.08,
    cutoff: 12000,
    detune: 0, // cents
    start: 0.0,
    end: 1.0,
    ...initial,
  };

  let buffer: AudioBuffer | null = null;
  let active: AudioBufferSourceNode | null = null;

  async function loadFromFile(file: File) {
    const ab = await file.arrayBuffer();
    buffer = await audioCtx.decodeAudioData(ab.slice(0));
  }

  function play(vel: number) {
    if (!buffer) return;

    if (active) {
      try { active.stop(); } catch {}
      active.disconnect();
      active = null;
    }

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.detune.value = state.detune;

    // slice playback
    const dur = buffer.duration;
    const s = clamp(state.start, 0, 0.999) * dur;
    const e = clamp(state.end, 0.001, 1.0) * dur;
    const length = Math.max(0.01, e - s);

    src.connect(filter);
    src.start(audioCtx.currentTime, s, length);
    active = src;

    // envelope
    const t = audioCtx.currentTime;
    const g = clamp(vel, 0, 1) * clamp(state.gain, 0, 1);

    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(0.0, t);
    amp.gain.linearRampToValueAtTime(g, t + state.attack);

    // auto release near end
    const releaseAt = t + Math.max(0.01, length - state.release);
    amp.gain.setValueAtTime(g, releaseAt);
    amp.gain.linearRampToValueAtTime(0.0, releaseAt + state.release);
  }

  const engine: ModuleEngine = {
    audioOut: output,
    setParam(key, value) {
      (state as any)[key] = value;
      const t = audioCtx.currentTime;
      if (key === "cutoff") filter.frequency.setValueAtTime(Number(value), t);
    },
    onEvent(msg: EventMessage) {
      if (msg.type === "noteOn") play(msg.velocity);
      if (msg.type === "noteOff") {
        // optional: immediate release
      }
    },
    dispose() {
      filter.disconnect();
      amp.disconnect();
      output.disconnect();
    },
  };

  // Expose file loader via a symbol-ish property used by UI node
  (engine as any).loadFromFile = loadFromFile;
  (engine as any).hasBuffer = () => !!buffer;

  return engine;
}
