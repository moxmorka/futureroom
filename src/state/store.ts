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
  | "mixerNode";

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
      {
        id: "clock1",
        type: "clockNode",
        position: { x: 60, y: 80 },
        data: { moduleType: "clock", params: { bpm: 124 } },
      },

      // Event sources
      {
        id: "pix1",
        type: "pixelSeqNode",
        position: { x: 380, y: 20 },
        data: {
          moduleType: "pixelseq",
          params: { seqOn: true, rootNote: 48, gateTicks: 3, ticksPerStep: 6, grid: "" },
        },
      },

      // Audio sources
      {
        id: "dn1",
        type: "digitoneNode",
        position: { x: 380, y: 320 },
        data: {
          moduleType: "digitone",
          params: {
            algo: 0,
            cutoff: 14000,
            resonance: 0.7,
            seqOn: true,
            seqPattern: "1000100010001000",
            seqNote: 48,
            seqTicksPerStep: 6,
            seqGateTicks: 3,
            seqScale: "chromatic",
            seqTranspose: 0,
            globalTranspose: 0,
            globalTuneCents: 0,
          },
        },
      },
      {
        id: "mm1",
        type: "monomachineNode",
        position: { x: 380, y: 650 },
        data: {
          moduleType: "monomachine",
          params: {
            machine: "supersaw",
            cutoff: 12000,
            resonance: 0.6,
            seqOn: true,
            seqPattern: "1000100010001000",
            seqNote: 36,
            seqTicksPerStep: 6,
            seqGateTicks: 3,
            globalTranspose: 0,
            globalTuneCents: 0,
          },
        },
      },
      {
        id: "sp1",
        type: "samplerNode",
        position: { x: 820, y: 360 },
        data: {
          moduleType: "sampler",
          params: {
            fileName: "",
            hasBuffer: false,
            gain: 0.9,
            rate: 1,
            start: 0,
            end: 1,
            seqOn: true,
            seqPattern: "1000100010001000",
            seqTicksPerStep: 6,
            seqGateTicks: 1,
          },
        },
      },

      // Scope + Mixer + Output
      {
        id: "tap1",
        type: "scopeNode",
        position: { x: 820, y: 70 },
        data: { moduleType: "scopeTap", params: {} },
      },
      {
        id: "mix1",
        type: "mixerNode",
        position: { x: 1210, y: 330 },
        data: { moduleType: "mixer", params: { gain: 0.9, mute: false } },
      },
      {
        id: "out1",
        type: "outNode",
        position: { x: 1540, y: 360 },
        data: { moduleType: "output", params: {} },
      },
    ],

    edges: [
      // Clock drives modules
      {
        id: "ev1",
        source: "clock1",
        target: "pix1",
        sourceHandle: "eventOut",
        targetHandle: "eventIn",
        data: { kind: "event" },
      },
      {
        id: "ev2",
        source: "clock1",
        target: "dn1",
        sourceHandle: "eventOut",
        targetHandle: "eventIn",
        data: { kind: "event" },
      },
      {
        id: "ev3",
        source: "clock1",
        target: "mm1",
        sourceHandle: "eventOut",
        targetHandle: "eventIn",
        data: { kind: "event" },
      },
      {
        id: "ev4",
        source: "clock1",
        target: "sp1",
        sourceHandle: "eventOut",
        targetHandle: "eventIn",
        data: { kind: "event" },
      },

      // PixelSeq triggers Digitone events
      {
        id: "ev5",
        source: "pix1",
        target: "dn1",
        sourceHandle: "eventOut",
        targetHandle: "eventIn",
        data: { kind: "event" },
      },

      // Audio routing: sources -> scope -> mixer -> out
      {
        id: "au1",
        source: "dn1",
        target: "tap1",
        sourceHandle: "audioOut",
        targetHandle: "audioIn",
        data: { kind: "audio" },
      },
      {
        id: "au2",
        source: "tap1",
        target: "mix1",
        sourceHandle: "audioOut",
        targetHandle: "audioIn",
        data: { kind: "audio" },
      },
      {
        id: "au3",
        source: "mm1",
        target: "mix1",
        sourceHandle: "audioOut",
        targetHandle: "audioIn",
        data: { kind: "audio" },
      },
      {
        id: "au4",
        source: "sp1",
        target: "mix1",
        sourceHandle: "audioOut",
        targetHandle: "audioIn",
        data: { kind: "audio" },
      },
      {
        id: "au5",
        source: "mix1",
        target: "out1",
        sourceHandle: "audioOut",
        targetHandle: "audioIn",
        data: { kind: "audio" },
      },
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
      return {
        moduleType: "digitakt",
        params: { steps: 16, seqOn: true, seqPattern: "1000100010001000", seqTicksPerStep: 6 },
      };

    case "digitoneNode":
      return {
        moduleType: "digitone",
        params: {
          algo: 0,
          cutoff: 14000,
          resonance: 0.7,
          seqOn: true,
          seqPattern: "1000100010001000",
          seqNote: 48,
          seqTicksPerStep: 6,
          seqGateTicks: 3,
          seqScale: "chromatic",
          seqTranspose: 0,
          globalTranspose: 0,
          globalTuneCents: 0,
        },
      };

    case "monomachineNode":
      return {
        moduleType: "monomachine",
        params: {
          machine: "supersaw",
          cutoff: 12000,
          resonance: 0.6,
          seqOn: true,
          seqPattern: "1000100010001000",
          seqNote: 36,
          seqTicksPerStep: 6,
          seqGateTicks: 3,
          globalTranspose: 0,
          globalTuneCents: 0,
        },
      };

    case "samplerNode":
      return {
        moduleType: "sampler",
        params: {
          fileName: "",
          hasBuffer: false,
          gain: 0.9,
          rate: 1,
          start: 0,
          end: 1,
          seqOn: true,
          seqPattern: "1000100010001000",
          seqTicksPerStep: 6,
          seqGateTicks: 1,
        },
      };

    case "pixelSeqNode":
      return {
        moduleType: "pixelseq",
        params: {
          seqOn: true,
          rootNote: 48,
          gateTicks: 3,
          ticksPerStep: 6,
          grid: "",
        },
      };

    case "mixerNode":
      return {
        moduleType: "mixer",
        params: { gain: 0.9, mute: false },
      };
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
        nodes: s.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, params: { ...(n.data.params || {}), [key]: value } } }
            : n
        ),
      })),

    setPatch: (nodes, edges) => set({ nodes, edges }),

    addModule: (uiType, pos) => {
      const id = uid(uiType.replace("Node", "").toLowerCase());
      const def = moduleDefaults(uiType);

      const newNode: Node<ModuleNodeData> = {
        id,
        type: uiType,
        position: pos,
        data: { moduleType: def.moduleType, params: def.params },
      };

      set((s) => ({ nodes: [...s.nodes, newNode] }));
    },

    reset: () => {
      const g2 = defaultGraph();
      set({ nodes: g2.nodes, edges: g2.edges });
    },
  };
});
