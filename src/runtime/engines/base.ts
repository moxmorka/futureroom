import type { EventMessage } from "../types";

export interface ModuleEngine {
  audioIn?: AudioNode;
  audioOut?: AudioNode;

  // optional scope tap output (for UI)
  analyser?: AnalyserNode;

  onEvent?: (msg: EventMessage) => void;

  setParam: (key: string, value: any) => void;
  dispose?: () => void;
}
