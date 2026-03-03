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
  filter.Q.value = 0.6;

  const amp = audioCtx.createGain();
  amp.gain.value = 0;

  filter.connect(amp);
  amp.connect(output);

  const fmGain = audioCtx.createGain();
  fmGain.gain.value = 140;

  const state = {
    machine: "supersaw" as Machine,
    gain: 0.75,
    attack: 0.004,
    release: 0.14,
    cutoff: 12000,
    resonance: 0.6,
    detune: 16,
    fmIndex: 140,
    fmRatio: 2,

    // Sequencer
    seqOn: false,
    seqPattern: "1000100010001000",
    seqNote: 36,
    seqTicksPerStep: 6,
    seqGateTicks: 3,

    // Global tuning
    globalTranspose: 0,
    globalTuneCents: 0,

    ...initial,
  };

  let oscA: OscillatorNode | null = null;
  let oscB: OscillatorNode | null = null;
  let oscC: OscillatorNode | null = null;
  let modOsc: OscillatorNode | null = null;
  let noiseSrc: AudioBufferSourceNode | null = null;

  const noiseBuffer = (() => {
    const len = audioCtx.sampleRate * 1;
    const b = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
    return b;
  })();

  function centsFactor(cents: number) {
    return Math.pow(2, cents / 1200);
  }

  function stopAll() {
    [oscA, oscB, oscC, modOsc].forEach((o) => {
      if (!o) return;
      try { o.stop(); } catch {}
      try { o.disconnect(); } catch {}
    });
    oscA = oscB = oscC = modOsc = null;

    if (noiseSrc) {
      try { noiseSrc.stop(); } catch {}
      try { noiseSrc.disconnect(); } catch {}
      noiseSrc = null;
    }
  }

  function buildMachine(baseHz: number) {
    stopAll();

    if (state.machine === "supersaw") {
      oscA = audioCtx.createOscillator();
      oscB = audioCtx.createOscillator();
      oscC = audioCtx.createOscillator();
      oscA.type = oscB.type = oscC.type = "sawtooth";

      const t = audioCtx.currentTime;
      oscA.frequency.setValueAtTime(baseHz, t);
      oscB.frequency.setValueAtTime(baseHz, t);
      oscC.frequency.setValueAtTime(baseHz, t);

      oscA.detune.setValueAtTime(-state.detune, t);
      oscB.detune.setValueAtTime(0, t);
      oscC.detune.setValueAtTime(state.detune, t);

      oscA.connect(filter);
      oscB.connect(filter);
      oscC.connect(filter);

      oscA.start(); oscB.start(); oscC.start();
    }

    if (state.machine === "pulse") {
      oscA = audioCtx.createOscillator();
      oscA.type = "square";
      oscA.frequency.setValueAtTime(baseHz, audioCtx.currentTime);
      oscA.connect(filter);
      oscA.start();
    }

    if (state.machine === "noise") {
      noiseSrc = audioCtx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      noiseSrc.loop = true;
      noiseSrc.connect(filter);
      noiseSrc.start();
    }

    if (state.machine === "fmLite") {
      oscA = audioCtx.createOscillator();
      modOsc = audioCtx.createOscillator();
      oscA.type = "sine";
      modOsc.type = "sine";

      fmGain.gain.setValueAtTime(state.fmIndex, audioCtx.currentTime);
      modOsc.connect(fmGain);
      fmGain.connect(oscA.frequency);

      const t = audioCtx.currentTime;
      oscA.frequency.setValueAtTime(baseHz, t);
      modOsc.frequency.setValueAtTime(baseHz * state.fmRatio, t);

      oscA.connect(filter);
      oscA.start();
      modOsc.start();
    }
  }

  function envOn(vel: number) {
    const t = audioCtx.currentTime;
    const g = clamp(vel, 0, 1) * clamp(state.gain, 0, 1);
    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(g, t + state.attack);
  }

  function envOff() {
    const t = audioCtx.currentTime;
    amp.gain.cancelScheduledValues(t);
    amp.gain.setValueAtTime(amp.gain.value, t);
    amp.gain.linearRampToValueAtTime(0, t + state.release);
  }

  function noteOn(midi: number, vel: number) {
    const n = midi + Number(state.globalTranspose || 0);
    const baseHz = midiToHz(n) * centsFactor(Number(state.globalTuneCents || 0));
    buildMachine(baseHz);
    envOn(vel);
  }

  function noteOff() {
    envOff();
  }

  // Sequencer runtime
  let seqRunning = false;
  let tickCount = 0;
  let step = 0;
  let gateLeft = 0;
  let gateActive = false;

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
      if (key === "fmIndex") fmGain.gain.setValueAtTime(Number(value), t);
    },

    onEvent(msg: EventMessage) {
      if (msg.type === "noteOn") noteOn(msg.note, msg.velocity);
      if (msg.type === "noteOff") noteOff();

      if (msg.type === "start") {
        seqRunning = true;
        tickCount = 0;
        step = 0;
        gateLeft = 0;
        gateActive = false;
      }

      if (msg.type === "stop") {
        seqRunning = false;
        gateLeft = 0;
        gateActive = false;
        noteOff();
      }

      if (msg.type === "clock") {
        if (!seqRunning || !state.seqOn) return;

        if (gateLeft > 0) {
          gateLeft--;
          if (gateLeft === 0 && gateActive) {
            gateActive = false;
            noteOff();
          }
        }

        tickCount++;
        const tps = Math.max(1, Number(state.seqTicksPerStep || 6));
        if (tickCount % tps !== 0) return;

        if (patternAt(step)) {
          noteOn(Number(state.seqNote || 36), 0.95);
          gateActive = true;
          gateLeft = Math.max(1, Number(state.seqGateTicks || 3));
        }
        step = (step + 1) % 64;
      }
    },

    dispose() {
      stopAll();
      try { fmGain.disconnect(); } catch {}
      try { filter.disconnect(); } catch {}
      try { amp.disconnect(); } catch {}
      try { output.disconnect(); } catch {}
    },
  };

  return engine;
}
