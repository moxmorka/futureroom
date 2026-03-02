export type PortKind = "audio" | "event";

export type EventMessage =
  | { type: "noteOn"; note: number; velocity: number }
  | { type: "noteOff"; note: number }
  | { type: "clock"; tick: number }
  | { type: "start" }
  | { type: "stop" };

export type ModuleParamValue = number | string | boolean;

export type ModuleNodeData = {
  moduleType: string;
  params: Record<string, ModuleParamValue>;
};
