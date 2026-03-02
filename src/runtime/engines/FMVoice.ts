import { audioCtx } from "../../audio/audioContext";
import { midiToHz, clamp } from "../util";
import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";

export function createFMVoiceEngine(initial?: Record<string, any>): ModuleEngine {
  const carrier = audioCtx.createOscillator();
  const mod = audioCtx.createOscillator();
  const modGain = audioCtx.createGain();
  const amp = audioCtx.createGain();

  const state = {
    modIndex: 150,
    modRatio: 2,
    gain: 0.0,
    attack: 0.005,
    release: 0.08,
    ...initial,
  };

  carrier.type = "sine";
  mod.type = "sine";
  modGain.gain.value = state.modIndex;
  amp.gain.value = 0.0;

  mod.connect(modGain);
  modGain.connect(carrier.frequency);

  carrier.connect(amp);

  carrier.start();
  mod.start();

  let currentNote: number | null = null;

  function envOn(vel: number) {
    const t = audioCtx.currentTime;
    const g = clamp(vel, 0, 1) * clamp(state.gain, 0, 1);
    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(amp.gain.value, t);
    amp.gain.linearRampToValueAtTime(g, t + state.attack);
  }

  function envOff() {
    const t = audioCtx.currentTime;
    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(amp.gain.value, t);
    amp.gain.linearRampToValueAtTime(0.0, t + state.release);
  }

  const engine: ModuleEngine = {
    audioOut: amp,
    setParam(key, value) {
      (state as any)[key] = value;

      const t = audioCtx.currentTime;
      if (key === "modIndex") modGain.gain.setValueAtTime(Number(value), t);
      if (key === "gain") {
        // gain acts as envelope max; no immediate set unless held note
      }
      if (key === "attack" || key === "release") {
        // envelope shape
      }
      if (key === "modRatio" && currentNote != null) {
        const hz = midiToHz(currentNote);
        mod.frequency.setValueAtTime(hz * Number(value), t);
      }
    },
    onEvent(msg: EventMessage) {
      if (msg.type === "noteOn") {
        const hz = midiToHz(msg.note);
        const t = audioCtx.currentTime;

        currentNote = msg.note;
        carrier.frequency.setValueAtTime(hz, t);
        mod.frequency.setValueAtTime(hz * state.modRatio, t);

        envOn(msg.velocity);
      }
      if (msg.type === "noteOff") {
        if (currentNote === msg.note) currentNote = null;
        envOff();
      }
    },
    dispose() {
      try { carrier.stop(); } catch {}
      try { mod.stop(); } catch {}
      carrier.disconnect();
      mod.disconnect();
      modGain.disconnect();
      amp.disconnect();
    },
  };

  return engine;
}
