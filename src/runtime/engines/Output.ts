import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";

export function createOutputEngine(): ModuleEngine {
  const input = audioCtx.createGain();
  input.gain.value = 0.9;

  // Route into an <audio> element so we can setSinkId (supported browsers)
  const dest = audioCtx.createMediaStreamDestination();
  input.connect(dest);

  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  audioEl.playsInline = true;
  audioEl.srcObject = dest.stream;
  audioEl.style.display = "none";
  document.body.appendChild(audioEl);

  async function setOutputDevice(deviceId: string) {
    const anyEl = audioEl as any;
    if (typeof anyEl.setSinkId === "function") {
      await anyEl.setSinkId(deviceId);
    }
  }

  return {
    audioIn: input,
    setParam(key, value) {
      if (key === "sinkId") void setOutputDevice(String(value));
      if (key === "gain") input.gain.value = Number(value);
    },
    dispose() {
      try { input.disconnect(); } catch {}
      try { audioEl.remove(); } catch {}
    },
  };
}
