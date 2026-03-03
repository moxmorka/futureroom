import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";
import { midiToHz, clamp } from "../util";

type Algo = 0 | 1 | 2;

function create4OpVoice() {
  const op1 = audioCtx.createOscillator();
  const op2 = audioCtx.createOscillator();
  const op3 = audioCtx.createOscillator();
  const op4 = audioCtx.createOscillator();

  const g12 = audioCtx.createGain();
  const g13 = audioCtx.createGain();
  const g14 = audioCtx.createGain();
  const g23 = audioCtx.createGain();
  const g34 = audioCtx.createGain();

  const amp = audioCtx.createGain();
  amp.gain.value = 0;

  op1.type = op2.type = op3.type = op4.type = "sine";
  op1.connect(amp);

  op1.start(); op2.start(); op3.start(); op4.start();

  function disconnectAll() {
    [op2, op3, op4, g12, g13, g14, g23, g34].forEach(n => {
      try { n.disconnect(); } catch {}
    });
  }

  function applyAlgo(algo: Algo) {
    disconnectAll();

    if (algo === 0) {
      op2.connect(g12); g12.connect(op1.frequency);
      op3.connect(g13); g13.connect(op1.frequency);
      op4.connect(g14); g14.connect(op1.frequency);
    }

    if (algo === 1) {
      op4.connect(g34); g34.connect(op3.frequency);
      op3.connect(g23); g23.connect(op2.frequency);
      op2.connect(g12); g12.connect(op1.frequency);
    }

    if (algo === 2) {
      op4.connect(g23); g23.connect(op2.frequency);
      op2.connect(g12); g12.connect(op1.frequency);
      op3.connect(g13); g13.connect(op1.frequency);
    }
  }

  function setRatios(base: number, r1: number, r2: number, r3: number, r4: number) {
    const t = audioCtx.currentTime;
    op1.frequency.setValueAtTime(base * r1, t);
    op2.frequency.setValueAtTime(base * r2, t);
    op3.frequency.setValueAtTime(base * r3, t);
    op4.frequency.setValueAtTime(base * r4, t);
  }

  function setIndexes(i2: number, i3: number, i4: number, i23: number, i34: number) {
    const t = audioCtx.currentTime;
    g12.gain.setValueAtTime(i2, t);
    g13.gain.setValueAtTime(i3, t);
    g14.gain.setValueAtTime(i4, t);
    g23.gain.setValueAtTime(i23, t);
    g34.gain.setValueAtTime(i34, t);
  }

  function envOn(vel: number, gain: number, attack: number) {
    const t = audioCtx.currentTime;
    const g = clamp(vel, 0, 1) * clamp(gain, 0, 1);
    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(g, t + attack);
  }

  function envOff(release: number) {
    const t = audioCtx.currentTime;
    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(amp.gain.value, t);
    amp.gain.linearRampToValueAtTime(0, t + release);
  }

  return {
    out: amp,
    applyAlgo,
    setRatios,
    setIndexes,
    envOn,
    envOff,
    stop() {
      [op1, op2, op3, op4, amp].forEach(n => {
        try { n.stop?.(); } catch {}
        try { n.disconnect(); } catch {}
      });
    }
  };
}

export function createDigitoneEngine(initial?: Record<string, any>): ModuleEngine {
  const output = audioCtx.createGain();
  output.gain.value = 0.9;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 14000;
  filter.Q.value = 0.7;

  filter.connect(output);

  const state = {
    poly: 8,
    algo: 0 as Algo,
    gain: 0.85,
    attack: 0.005,
    release: 0.12,
    r1: 1, r2: 2, r3: 3, r4: 4,
    i2: 160, i3: 60, i4: 30,
    i23: 90, i34: 90,
    cutoff: 14000,
    resonance: 0.7,
    ...initial,
  };

  type Slot = { voice: ReturnType<typeof create4OpVoice>; note: number | null };
  const voices: Slot[] = [];

  for (let i = 0; i < state.poly; i++) {
    const v = create4OpVoice();
    v.out.connect(filter);
    voices.push({ voice: v, note: null });
  }

  function pick(note: number) {
    return voices.find(v => v.note === note)
      || voices.find(v => v.note == null)
      || voices[0];
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
        const slot = pick(msg.note);
        slot.note = msg.note;

        const hz = midiToHz(msg.note);
        slot.voice.applyAlgo(state.algo);
        slot.voice.setRatios(hz, state.r1, state.r2, state.r3, state.r4);
        slot.voice.setIndexes(state.i2, state.i3, state.i4, state.i23, state.i34);
        slot.voice.envOn(msg.velocity, state.gain, state.attack);
      }

      if (msg.type === "noteOff") {
        const slot = voices.find(v => v.note === msg.note);
        if (slot) {
          slot.voice.envOff(state.release);
          slot.note = null;
        }
      }
    },

    dispose() {
      voices.forEach(v => v.voice.stop());
      try { filter.disconnect(); } catch {}
      try { output.disconnect(); } catch {}
    }
  };

  return engine;
}
