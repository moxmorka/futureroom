import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";
import { clamp } from "../util";

type Channel = {
  in: GainNode;
  gain: GainNode;
  pan: StereoPannerNode;
  sendA: GainNode;
  sendB: GainNode;
};

function makeImpulse(seconds: number, decay: number) {
  const sr = audioCtx.sampleRate;
  const len = Math.max(1, Math.floor(sr * seconds));
  const buffer = audioCtx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // exponential-ish decay
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return buffer;
}

export function createMixer8Engine(initial?: Record<string, any>): ModuleEngine {
  const masterSum = audioCtx.createGain();
  const masterOut = audioCtx.createGain();
  masterOut.gain.value = 0.9;

  // FX buses
  const busA = audioCtx.createGain(); // Delay bus
  const busB = audioCtx.createGain(); // Reverb bus
  busA.gain.value = 1;
  busB.gain.value = 1;

  // Delay FX (Send A)
  const delayIn = audioCtx.createGain();
  const delayNode = audioCtx.createDelay(2.0);
  const delayFb = audioCtx.createGain();
  const delayFilter = audioCtx.createBiquadFilter();
  const delayReturn = audioCtx.createGain();

  delayFilter.type = "lowpass";
  delayFilter.frequency.value = 6000;

  delayNode.delayTime.value = 0.25; // default 1/16-ish at 120
  delayFb.gain.value = 0.35;
  delayReturn.gain.value = 0.25;

  busA.connect(delayIn);
  delayIn.connect(delayNode);
  delayNode.connect(delayFilter);
  delayFilter.connect(delayFb);
  delayFb.connect(delayNode);
  delayFilter.connect(delayReturn);
  delayReturn.connect(masterSum);

  // Reverb FX (Send B) - Convolver with generated impulse
  const convIn = audioCtx.createGain();
  const convolver = audioCtx.createConvolver();
  const revPre = audioCtx.createBiquadFilter();
  const revReturn = audioCtx.createGain();

  revPre.type = "highpass";
  revPre.frequency.value = 250;

  convolver.buffer = makeImpulse(1.6, 2.5);
  revReturn.gain.value = 0.22;

  busB.connect(convIn);
  convIn.connect(revPre);
  revPre.connect(convolver);
  convolver.connect(revReturn);
  revReturn.connect(masterSum);

  // Master processing
  const drive = audioCtx.createWaveShaper();
  const limiter = audioCtx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.ratio.value = 14;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.12;

  masterSum.connect(drive);
  drive.connect(limiter);
  limiter.connect(masterOut);

  // 8 channels
  const channels: Channel[] = Array.from({ length: 8 }, () => {
    const i = audioCtx.createGain();
    const g = audioCtx.createGain();
    const p = audioCtx.createStereoPanner();
    const sa = audioCtx.createGain();
    const sb = audioCtx.createGain();

    // main path
    i.connect(g);
    g.connect(p);
    p.connect(masterSum);

    // sends tap pre-pan (keeps send stable; change to post-pan if you want)
    i.connect(sa);
    i.connect(sb);
    sa.connect(busA);
    sb.connect(busB);

    sa.gain.value = 0;
    sb.gain.value = 0;

    return { in: i, gain: g, pan: p, sendA: sa, sendB: sb };
  });

  const state: any = {
    master: 0.9,
    drive: 0.12,

    // Delay params
    delayTime: 0.25,   // seconds
    delayFb: 0.35,     // 0..0.95
    delayTone: 6000,   // Hz
    delayReturn: 0.25, // 0..1

    // Reverb params
    reverbReturn: 0.22,
    reverbHP: 250,     // Hz
    reverbSize: 1.6,   // seconds
    reverbDecay: 2.5,  // curve exponent

    ...initial,
  };

  function setDrive(amount: number) {
    const k = clamp(amount, 0, 1) * 80;
    const curve = new Float32Array(2048);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh((1 + k) * x);
    }
    drive.curve = curve;
  }

  function apply() {
    masterOut.gain.value = clamp(Number(state.master ?? 0.9), 0, 1.5);
    setDrive(Number(state.drive ?? 0.12));

    // FX
    delayNode.delayTime.value = clamp(Number(state.delayTime ?? 0.25), 0, 2.0);
    delayFb.gain.value = clamp(Number(state.delayFb ?? 0.35), 0, 0.95);
    delayFilter.frequency.value = clamp(Number(state.delayTone ?? 6000), 500, 16000);
    delayReturn.gain.value = clamp(Number(state.delayReturn ?? 0.25), 0, 1);

    revReturn.gain.value = clamp(Number(state.reverbReturn ?? 0.22), 0, 1);
    revPre.frequency.value = clamp(Number(state.reverbHP ?? 250), 20, 1500);

    // if user changed impulse parameters, rebuild buffer (cheap enough for occasional tweaks)
    const size = clamp(Number(state.reverbSize ?? 1.6), 0.2, 6.0);
    const dec = clamp(Number(state.reverbDecay ?? 2.5), 0.5, 6.0);
    // rebuild only when needed via setParam guard below, but safe to keep here if you want

    const solos = Array.from({ length: 8 }, (_, i) => i + 1).filter((i) => Boolean(state[`ch${i}_solo`]));
    const soloMode = solos.length > 0;

    for (let i = 1; i <= 8; i++) {
      const ch = channels[i - 1];

      const mute = Boolean(state[`ch${i}_mute`]);
      const soloed = Boolean(state[`ch${i}_solo`]);
      const allowed = soloMode ? soloed : true;

      const g = mute || !allowed ? 0 : clamp(Number(state[`ch${i}_gain`] ?? 0.9), 0, 1.5);
      ch.gain.gain.value = g;

      ch.pan.pan.value = clamp(Number(state[`ch${i}_pan`] ?? 0), -1, 1);

      ch.sendA.gain.value = mute || !allowed ? 0 : clamp(Number(state[`ch${i}_sendA`] ?? 0), 0, 1);
      ch.sendB.gain.value = mute || !allowed ? 0 : clamp(Number(state[`ch${i}_sendB`] ?? 0), 0, 1);
    }

    // Rebuild impulse if requested (handled in setParam for performance)
    convolver.normalize = true;
  }

  apply();

  const engine: ModuleEngine = {
    audioOut: masterOut,

    // expose 8 audio inputs by handle name
    get audioIn1() { return channels[0].in; },
    get audioIn2() { return channels[1].in; },
    get audioIn3() { return channels[2].in; },
    get audioIn4() { return channels[3].in; },
    get audioIn5() { return channels[4].in; },
    get audioIn6() { return channels[5].in; },
    get audioIn7() { return channels[6].in; },
    get audioIn8() { return channels[7].in; },

    setParam(key, value) {
      state[key] = value;

      // rebuild convolver impulse only when size/decay changes
      if (key === "reverbSize" || key === "reverbDecay") {
        const size = clamp(Number(state.reverbSize ?? 1.6), 0.2, 6.0);
        const dec = clamp(Number(state.reverbDecay ?? 2.5), 0.5, 6.0);
        convolver.buffer = makeImpulse(size, dec);
      }

      apply();
    },

    dispose() {
      try { masterSum.disconnect(); } catch {}
      try { drive.disconnect(); } catch {}
      try { limiter.disconnect(); } catch {}
      try { masterOut.disconnect(); } catch {}

      try { busA.disconnect(); } catch {}
      try { busB.disconnect(); } catch {}

      try { delayIn.disconnect(); delayNode.disconnect(); delayFb.disconnect(); delayFilter.disconnect(); delayReturn.disconnect(); } catch {}
      try { convIn.disconnect(); revPre.disconnect(); convolver.disconnect(); revReturn.disconnect(); } catch {}

      channels.forEach((c) => {
        try { c.in.disconnect(); c.gain.disconnect(); c.pan.disconnect(); c.sendA.disconnect(); c.sendB.disconnect(); } catch {}
      });
    },
  } as any;

  return engine;
}
