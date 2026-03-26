export const audioCtx =
  new (window.AudioContext || (window as any).webkitAudioContext)();

let handlersInstalled = false;

export async function ensureAudioRunning() {
  if (audioCtx.state !== "running") {
    try {
      await audioCtx.resume();
    } catch {}
  }
}

export function installAudioWakeHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;

  const wake = () => {
    void ensureAudioRunning();
  };

  window.addEventListener("pointerdown", wake, { passive: true });
  window.addEventListener("touchstart", wake, { passive: true });
  window.addEventListener("mousedown", wake, { passive: true });
  window.addEventListener("keydown", wake);
  window.addEventListener("focus", wake);
  window.addEventListener("visibilitychange", wake);
}
