import type { ModuleEngine } from "./base";
import type { EventMessage } from "../types";

export function createClockEngine(initial?: Record<string, any>): ModuleEngine {
  const state = {
    bpm: 120,
    running: false,
    ...initial,
  };

  let tick = 0;
  let timer: number | null = null;
  let send: ((msg: EventMessage) => void) | null = null;

  function intervalMs() {
    // 24 ppqn-ish
    const bps = state.bpm / 60;
    const tickHz = bps * 24;
    return 1000 / tickHz;
  }

  function start() {
    if (timer != null) return;
    state.running = true;
    tick = 0;
    send?.({ type: "start" });

    timer = window.setInterval(() => {
      tick++;
      send?.({ type: "clock", tick });
    }, intervalMs());
  }

  function stop() {
    state.running = false;
    if (timer != null) {
      window.clearInterval(timer);
      timer = null;
    }
    send?.({ type: "stop" });
  }

  const engine: ModuleEngine = {
    setParam(key, value) {
      (state as any)[key] = value;
      if (key === "bpm" && timer != null) {
        // restart with new interval
        stop();
        start();
      }
    },
    onEvent(msg: EventMessage) {
      // allow external transport control
      if (msg.type === "start") start();
      if (msg.type === "stop") stop();
    },
  };

  // runtime will set this hook so clock can broadcast to connected event edges
  (engine as any).setBroadcaster = (fn: (msg: EventMessage) => void) => (send = fn);
  (engine as any).start = start;
  (engine as any).stop = stop;
  (engine as any).isRunning = () => state.running;

  return engine;
}
