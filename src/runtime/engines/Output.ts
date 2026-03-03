import { audioCtx } from "../../audio/audioContext";
import type { ModuleEngine } from "./base";

export function createOutputEngine(): ModuleEngine {
  const input = audioCtx.createGain();
  input.gain.value = 0.9;

  // ✅ Always connect to default output so sound works everywhere
  input.connect(audioCtx.destination);

  // Optional: route to <audio> so Chrome can select sinkId
  const dest = audioCtx.createMediaStreamDestination();
  input.connect(dest);

  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  audioEl.srcObject = dest.stream;
  audioEl.setAttribute("playsinline", "true");
  audioEl.muted = false;
  audioEl.style.display = "none";
  document.body.appendChild(audioEl);

  async function setOutputDevice(deviceId: string) {
    const anyEl = audioEl as any;
    if (typeof anyEl.setSinkId === "function") {
      await anyEl.setSinkId(deviceId);
      // try to kick playback in case browser paused it
      try { await audioEl.play(); } catch {}
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
