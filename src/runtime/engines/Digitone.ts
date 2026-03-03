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

  function disconnectAllModRoutes() {
    [op2, op3, op4, g12, g13, g14, g23, g34].forEach((n) => { try { n.disconnect(); } catch {} });
  }

  function applyAlgo(algo: Algo) {
    disconnectAllModRoutes();

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

  function setRatios(baseHz: number, r1: number, r2: number, r3: number, r4: number) {
    const t = audioCtx.currentTime;
    op1.frequency.setValueAtTime(baseHz * r1, t);
    op2.frequency.setValueAtTime(baseHz * r2, t);
    op3.frequency.setValueAtTime(baseHz * r3, t);
    op4.frequency.setValueAtTime(baseHz * r4, t);
  }

  function setIndexes(i2: number, i3: number, i4: number, i23: number, i34: number) {
    const t = audioCtx.currentTime;
    g12.gain.setValueAtTime(i2, t);
    g13.gain.setValueAtTime(i3, t);
    g14.gain.setValueAtTime(i4, t);
    g23.gain.setValueAtTime(i23, t);
    g34.gain.setValueAtTime(i34, t);
  }

  function envOn(vel: number, gainMax: number, attack: number) {
    const t = audioCtx.currentTime;
    const g = clamp(vel, 0, 1) * clamp(gainMax, 0, 1);
    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(g, t + Math.max(0, attack));
  }

  function envOff(release: number) {
    const t = audioCtx.currentTime;
    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(amp.gain.value, t);
    amp.gain.linearRampToValueAtTime(0, t + Math.max(0.001, release));
  }

  return {
    out: amp,
    applyAlgo,
    setRatios,
    setIndexes,
    envOn,
    envOff,
    stop() {
      [op1, op2, op3, op4].forEach((o) => {
        try { o.stop(); } catch {}
        try { o.disconnect(); } catch {}
      });
      try { amp.disconnect(); } catch {}
      disconnectAllModRoutes();
    },
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

    // Sequencer
    seqOn: false,
    seqPattern: "1000100010001000",
    seqNote: 48,
    seqTicksPerStep: 6,
    seqGateTicks: 3,

    // Global tuning
    globalTranspose: 0,
    globalTuneCents: 0,

    ...initial,
  };

  type Slot = { voice: ReturnType<typeof create4OpVoice>; note: number | null; startedAt: number };
  const voices: Slot[] = [];
  for (let i = 0; i < state.poly; i++) {
    const v = create4OpVoice();
    v.out.connect(filter);
    v.applyAlgo(state.algo);
    v.setIndexes(state.i2, state.i3, state.i4, state.i23, state.i34);
    voices.push({ voice: v, note: null, startedAt: 0 });
  }

  function centsFactor(cents: number) {
    return Math.pow(2, cents / 1200);
  }

  function pickVoice(note: number) {
    const existing = voices.find(v => v.note === note);
    if (existing) return existing;
    const free = voices.find(v => v.note == null);
    if (free) return free;
    let oldest = voices[0];
    for (const v of voices) if (v.startedAt < oldest.startedAt) oldest = v;
    return oldest;
  }

  function noteOn(midi: number, vel: number) {
    const n = midi + Number(state.globalTranspose || 0);
    const slot = pickVoice(n);
    slot.note = n;
    slot.startedAt = performance.now();

    const baseHz = midiToHz(n) * centsFactor(Number(state.globalTuneCents || 0));
    slot.voice.applyAlgo(state.algo);
    slot.voice.setRatios(baseHz, state.r1, state.r2, state.r3, state.r4);
    slot.voice.setIndexes(state.i2, state.i3, state.i4, state.i23, state.i34);
    slot.voice.envOn(vel, state.gain, state.attack);
  }

  function noteOff(midi: number) {
    const n = midi + Number(state.globalTranspose || 0);
    const slot = voices.find(v => v.note === n);
    if (slot) {
      slot.voice.envOff(state.release);
      slot.note = null;
    }
  }

  // Sequencer runtime
  let seqRunning = false;
  let tickCount = 0;
  let step = 0;
  let gateLeft = 0;
  let gateNote: number | null = null;

  function patternAt(i: number) {
    const s = String(state.seqPattern || "");
    if (!s.length) return false;
    const idx = i % s.length;
    return s[idx] === "1" || s[idx] === "x" || s[idx] === "X";
  }

  const engine: ModuleEngine = {
    audioOut: output,

    setParam(key, value) {
      (state as any)[key] = value;
      const t = audioCtx.currentTime;
      if (key === "cutoff") filter.frequency.setValueAtTime(Number(value), t);
      if (key === "resonance") filter.Q.setValueAtTime(Number(value), t);

      if (["algo","i2","i3","i4","i23","i34"].includes(key)) {
        for (const v of voices) {
          v.voice.applyAlgo(state.algo);
          v.voice.setIndexes(state.i2, state.i3, state.i4, state.i23, state.i34);
        }
      }
    },

    onEvent(msg: EventMessage) {
      if (msg.type === "noteOn") noteOn(msg.note, msg.velocity);
      if (msg.type === "noteOff") noteOff(msg.note);

      if (msg.type === "start") {
        seqRunning = true;
        tickCount = 0;
        step = 0;
        gateLeft = 0;
        gateNote = null;
      }

      if (msg.type === "stop") {
        seqRunning = false;
        if (gateNote != null) noteOff(gateNote);
        gateLeft = 0;
        gateNote = null;
      }

      if (msg.type === "clock") {
        if (!seqRunning || !state.seqOn) return;

        // gate countdown
        if (gateLeft > 0) {
          gateLeft--;
          if (gateLeft === 0 && gateNote != null) {
            noteOff(gateNote);
            gateNote = null;
          }
        }

        tickCount++;
        const tps = Math.max(1, Number(state.seqTicksPerStep || 6));
        if (tickCount % tps !== 0) return;

        // step advance
        if (patternAt(step)) {
          const n = Number(state.seqNote || 48);
          noteOn(n, 0.95);
          gateNote = n;
          gateLeft = Math.max(1, Number(state.seqGateTicks || 3));
        }
        step = (step + 1) % 64;
      }
    },

    dispose() {
      for (const v of voices) v.voice.stop();
      try { filter.disconnect(); } catch {}
      try { output.disconnect(); } catch {}
    },
  };

  return engine;
}
