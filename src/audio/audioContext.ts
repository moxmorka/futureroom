declare global {
  interface Window {
    __futureroomAudioCtx?: AudioContext;
    __futureroomAudioWakeInstalled?: boolean;
  }
}

export const audioCtx =
  window.__futureroomAudioCtx ||
  (window.__futureroomAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)());

let resumePromise: Promise<void> | null = null;

async function resumeAudioContext() {
  if (audioCtx.state === "running") return;
  if (!resumePromise) {
    resumePromise = audioCtx
      .resume()
      .catch(() => {})
      .finally(() => {
        resumePromise = null;
      });
  }
  await resumePromise;
}

export async function ensureAudioRunning() {
  await resumeAudioContext();
}

export function installAudioWakeHandlers() {
  if (window.__futureroomAudioWakeInstalled) return;
  window.__futureroomAudioWakeInstalled = true;

  const wake = () => {
    void ensureAudioRunning();
  };

  window.addEventListener("pointerdown", wake, { passive: true });
  window.addEventListener("touchstart", wake, { passive: true });
  window.addEventListener("mousedown", wake, { passive: true });
  window.addEventListener("keydown", wake);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") wake();
  });
}
