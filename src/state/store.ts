import { create } from "zustand";
import type { Edge, Node, XYPosition } from "reactflow";
import type { ModuleNodeData } from "../runtime/types";
import type { EdgeData } from "../runtime/GraphRuntime";
import { uid } from "../runtime/id";

export type ModuleUIType =
  | "clockNode"
  | "outNode"
  | "scopeNode"
  | "digitoneNode"
  | "digitaktNode"
  | "monomachineNode"
  | "samplerNode"
  | "pixelSeqNode"
  | "euclideanSeqNode"
  | "mixerNode"
  | "mixer8Node";

export type Store = {
  nodes: Node<ModuleNodeData>[];
  edges: Edge<EdgeData>[];
  setNodes: (n: Node<ModuleNodeData>[]) => void;
  setEdges: (e: Edge<EdgeData>[]) => void;
  updateParam: (nodeId: string, key: string, value: any) => void;
  setPatch: (nodes: Node<ModuleNodeData>[], edges: Edge<EdgeData>[]) => void;
  addModule: (uiType: ModuleUIType, pos: XYPosition) => void;
  reset: () => void;
};

function defaultGraph(): { nodes: Node<ModuleNodeData>[]; edges: Edge<EdgeData>[] } {
  return {
    nodes: [
      { id: "clock1", type: "clockNode", position: { x: 60, y: 80 }, data: { moduleType: "clock", params: { bpm: 124 } } },
      { id: "pix1", type: "pixelSeqNode", position: { x: 360, y: 10 }, data: { moduleType: "pixelseq", params: { seqOn: true, rootNote: 48, gateTicks: 3, ticksPerStep: 6, grid: "", brushHue: 30 } } },
      { id: "dn1", type: "digitoneNode", position: { x: 360, y: 320 }, data: { moduleType: "digitone", params: { algo: 0, cutoff: 14000, resonance: 0.7, seqOn: true, seqPattern: "1000100010001000", seqNote: 48, seqTicksPerStep: 6, seqGateTicks: 3, seqScale: "chromatic", seqTranspose: 0, globalTranspose: 0, globalTuneCents: 0 } } },
      { id: "mm1", type: "monomachineNode", position: { x: 360, y: 680 }, data: { moduleType: "monomachine", params: { machine: "sine", gain: 0.75, a: 0.005, d: 0.08, s: 0.65, r: 0.18, cutoff: 12000, resonance: 0.6, lfoRate: 2, lfoDepthCents: 0, seqOn: true, seqPattern: "1000100010001000", seqNote: 36, seqTicksPerStep: 6, seqGateTicks: 3, globalTranspose: 0, globalTuneCents: 0 } } },
      { id: "sp1", type: "samplerNode", position: { x: 820, y: 360 }, data: { moduleType: "sampler", params: { fileName: "", hasBuffer: false, gain: 0.9, rate: 1, start: 0, end: 1, seqOn: true, seqPattern: "1000100010001000", seqTicksPerStep: 6, seqGateTicks: 1 } } },
      { id: "mix8", type: "mixer8Node", position: { x: 1240, y: 280 }, data: { moduleType: "mixer8", params: { master: 0.9, drive: 0.12, delayTime: 0.25, delayFb: 0.35, delayTone: 6000, delayReturn: 0.25, reverbReturn: 0.22, reverbHP: 250, reverbSize: 1.6, reverbDecay: 2.5, ch1_gain: 0.9, ch1_pan: 0, ch1_sendA: 0, ch1_sendB: 0, ch2_gain: 0.9, ch2_pan: 0, ch2_sendA: 0, ch2_sendB: 0, ch3_gain: 0.9, ch3_pan: 0, ch3_sendA: 0, ch3_sendB: 0, ch4_gain: 0.9, ch4_pan: 0, ch4_sendA: 0, ch4_sendB: 0, ch5_gain: 0.9, ch5_pan: 0, ch5_sendA: 0, ch5_sendB: 0, ch6_gain: 0.9, ch6_pan: 0, ch6_sendA: 0, ch6_sendB: 0, ch7_gain: 0.9, ch7_pan: 0, ch7_sendA: 0, ch7_sendB: 0, ch8_gain: 0.9, ch8_pan: 0, ch8_sendA: 0, ch8_sendB: 0 } } },
      { id: "out1", type: "outNode", position: { x: 1650, y: 340 }, data: { moduleType: "output", params: {} } },
    ],
    edges: [
      { id: "ev1", source: "clock1", target: "pix1", sourceHandle: "eventOut", targetHandle: "eventIn", data: { kind: "event" } },
      { id: "ev2", source: "clock1", target: "dn1", sourceHandle: "eventOut", targetHandle: "eventIn", data: { kind: "event" } },
      { id: "ev3", source: "clock1", target: "mm1", sourceHandle: "eventOut", targetHandle: "eventIn", data: { kind: "event" } },
      { id: "ev4", source: "clock1", target: "sp1", sourceHandle: "eventOut", targetHandle: "eventIn", data: { kind: "event" } },
      { id: "ev5", source: "pix1", target: "dn1", sourceHandle: "eventOut", targetHandle: "eventIn", data: { kind: "event" } },
      { id: "au1", source: "dn1", target: "mix8", sourceHandle: "audioOut", targetHandle: "audioIn1", data: { kind: "audio" } },
      { id: "au2", source: "mm1", target: "mix8", sourceHandle: "audioOut", targetHandle: "audioIn2", data: { kind: "audio" } },
      { id: "au3", source: "sp1", target: "mix8", sourceHandle: "audioOut", targetHandle: "audioIn3", data: { kind: "audio" } },
      { id: "au9", source: "mix8", target: "out1", sourceHandle: "audioOut", targetHandle: "audioIn", data: { kind: "audio" } },
    ],
  };
}

function moduleDefaults(uiType: ModuleUIType): ModuleNodeData {
  switch (uiType) {
    case "clockNode":
      return { moduleType: "clock", params: { bpm: 120 } };
    case "outNode":
      return { moduleType: "output", params: {} };
    case "scopeNode":
      return { moduleType: "scopeTap", params: {} };
    case "digitaktNode":
      return { moduleType: "digitakt", params: { steps: 16, seqOn: true, seqPattern: "1000100010001000", seqTicksPerStep: 6 } };
    case "digitoneNode":
      return { moduleType: "digitone", params: { algo: 0, cutoff: 14000, resonance: 0.7, seqOn: true, seqPattern: "1000100010001000", seqNote: 48, seqTicksPerStep: 6, seqGateTicks: 3, seqScale: "chromatic", seqTranspose: 0, globalTranspose: 0, globalTuneCents: 0 } };
    case "monomachineNode":
      return { moduleType: "monomachine", params: { machine: "sine", gain: 0.75, a: 0.005, d: 0.08, s: 0.65, r: 0.18, cutoff: 12000, resonance: 0.6, lfoRate: 2, lfoDepthCents: 0, seqOn: true, seqPattern: "1000100010001000", seqNote: 36, seqTicksPerStep: 6, seqGateTicks: 3, globalTranspose: 0, globalTuneCents: 0 } };
    case "samplerNode":
      return { moduleType: "sampler", params: { fileName: "", hasBuffer: false, gain: 0.9, rate: 1, start: 0, end: 1, seqOn: true, seqPattern: "1000100010001000", seqTicksPerStep: 6, seqGateTicks: 1 } };
    case "pixelSeqNode":
      return { moduleType: "pixelseq", params: { seqOn: true, rootNote: 48, gateTicks: 3, ticksPerStep: 6, grid: "", brushHue: 30 } };
    case "euclideanSeqNode":
      return { moduleType: "euclidseq", params: { seqOn: true, steps: 16, pulses: 5, rotation: 0, note: 48, ticksPerStep: 6, gateTicks: 3, velocity: 0.9 } };
    case "mixerNode":
      return { moduleType: "mixer", params: { gain: 0.9, mute: false } };
    case "mixer8Node":
      return { moduleType: "mixer8", params: { master: 0.9, drive: 0.12, delayTime: 0.25, delayFb: 0.35, delayTone: 6000, delayReturn: 0.25, reverbReturn: 0.22, reverbHP: 250, reverbSize: 1.6, reverbDecay: 2.5 } };
  }
}

export const useStore = create<Store>((set) => {
  const g = defaultGraph();

  return {
    nodes: g.nodes,
    edges: g.edges,
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    updateParam: (nodeId, key, value) =>
      set((s) => ({
        nodes: s.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          if ((n.data.params || {})[key] === value) return n;
          return { ...n, data: { ...n.data, params: { ...(n.data.params || {}), [key]: value } } };
        }),
      })),
    setPatch: (nodes, edges) => set({ nodes, edges }),
    addModule: (uiType, pos) => {
      const id = uid(uiType.replace("Node", "").toLowerCase());
      const def = moduleDefaults(uiType);
      const newNode: Node<ModuleNodeData> = { id, type: uiType, position: pos, data: { moduleType: def.moduleType, params: def.params } };
      set((s) => ({ nodes: [...s.nodes, newNode] }));
    },
    reset: () => {
      const g2 = defaultGraph();
      set({ nodes: g2.nodes, edges: g2.edges });
    },
  };
});
