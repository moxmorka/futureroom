import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";
import { midiToHz, clamp } from "../util";

type Machine = "supersaw" | "pulse" | "noise" | "fmLite";

export function createMonomachineEngine(initial?: Record<string, any>): ModuleEngine {
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
    machine: "supersaw" as Machine,
    gain: 0.75,
    attack: 0.004,
    release: 0.14,
    detune: 16,
    fmIndex: 140,
    fmRatio: 2,
    cutoff: 12000,
    resonance: 0.6,
    ...initial,
  };

  let oscA: OscillatorNode | null = null;
  let oscB: OscillatorNode | null = null;
  let oscC: OscillatorNode | null = null;
  let modOsc: OscillatorNode | null = null;

  function stopAll() {
    [oscA, oscB, oscC, modOsc].forEach(o => {
      if (o) {
        try { o.stop(); } catch {}
        try { o.disconnect(); } catch {}
      }
    });
    oscA = oscB = oscC = modOsc = null;
  }

  function build(baseHz: number) {
    stopAll();

    if (state.machine === "supersaw") {
      oscA = audioCtx.createOscillator();
      oscB = audioCtx.createOscillator();
      oscC = audioCtx.createOscillator();

      oscA.type = oscB.type = oscC.type = "sawtooth";
      oscA.frequency.value = baseHz;
      oscB.frequency.value = baseHz;
      oscC.frequency.value = baseHz;

      oscA.detune.value = -state.detune;
      oscC.detune.value = state.detune;

      oscA.connect(filter);
      oscB.connect(filter);
      oscC.connect(filter);

      oscA.start(); oscB.start(); oscC.start();
    }

    if (state.machine === "pulse") {
      oscA = audioCtx.createOscillator();
      oscA.type = "square";
      oscA.frequency.value = baseHz;
      oscA.connect(filter);
      oscA.start();
    }

    if (state.machine === "fmLite") {
      oscA = audioCtx.createOscillator();
      modOsc = audioCtx.createOscillator();
      const fmGain = audioCtx.createGain();

      fmGain.gain.value = state.fmIndex;
      modOsc.connect(fmGain);
      fmGain.connect(oscA.frequency);

      oscA.frequency.value = baseHz;
      modOsc.frequency.value = baseHz * state.fmRatio;

      oscA.connect(filter);

      oscA.start();
      modOsc.start();
    }
  }

  function envOn(vel: number) {
    const t = audioCtx.currentTime;
    const g = clamp(vel, 0, 1) * state.gain;
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(g, t + state.attack);
  }

  function envOff() {
    const t = audioCtx.currentTime;
    amp.gain.setValueAtTime(amp.gain.value, t);
    amp.gain.linearRampToValueAtTime(0, t + state.release);
  }

  const engine: ModuleEngine = {
    audioOut: output,

    setParam(key, value) {
      (state as any)[key] = value;
      if (key === "cutoff") filter.frequency.value = Number(value);
      if (key === "resonance") filter.Q.value = Number(value);
    },

    onEvent(msg: EventMessage) {
      if (msg.type === "noteOn") {
        build(midiToHz(msg.note));
        envOn(msg.velocity);
      }
      if (msg.type === "noteOff") envOff();
    },

    dispose() {
      stopAll();
      try { filter.disconnect(); } catch {}
      try { amp.disconnect(); } catch {}
      try { output.disconnect(); } catch {}
    }
  };

  return engine;
}
