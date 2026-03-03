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
  | "monomachineNode";

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
        position: { x: 80, y: 80 },
        data: { moduleType: "clock", params: { bpm: 124 } },
      },
      {
        id: "dt1",
        type: "digitaktNode",
        position: { x: 420, y: 40 },
        data: { moduleType: "digitakt", params: { steps: 16 } },
      },
      {
        id: "dn1",
        type: "digitoneNode",
        position: { x: 420, y: 240 },
        data: { moduleType: "digitone", params: { algo: 0, cutoff: 14000, resonance: 0.7 } },
      },
      {
        id: "mm1",
        type: "monomachineNode",
        position: { x: 420, y: 520 },
        data: { moduleType: "monomachine", params: { machine: "supersaw", cutoff: 12000, resonance: 0.6 } },
      },
      {
        id: "tap1",
        type: "scopeNode",
        position: { x: 780, y: 260 },
        data: { moduleType: "scopeTap", params: {} },
      },
      {
        id: "out1",
        type: "outNode",
        position: { x: 1120, y: 300 },
        data: { moduleType: "output", params: {} },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "clock1",
        target: "dt1",
        sourceHandle: "eventOut",
        targetHandle: "eventIn",
        data: { kind: "event" },
      },
      {
        id: "e2",
        source: "dn1",
        target: "tap1",
        sourceHandle: "audioOut",
        targetHandle: "audioIn",
        data: { kind: "audio" },
      },
      {
        id: "e3",
        source: "tap1",
        target: "out1",
        sourceHandle: "audioOut",
        targetHandle: "audioIn",
        data: { kind: "audio" },
      },
      {
        id: "e4",
        source: "mm1",
        target: "out1",
        sourceHandle: "audioOut",
        targetHandle: "audioIn",
        data: { kind: "audio" },
      },
      {
        id: "e5",
        source: "dt1",
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
      return { moduleType: "digitakt", params: { steps: 16 } };
    case "digitoneNode":
      return { moduleType: "digitone", params: { algo: 0, cutoff: 14000, resonance: 0.7 } };
    case "monomachineNode":
      return { moduleType: "monomachine", params: { machine: "supersaw", cutoff: 12000, resonance: 0.6 } };
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
            ? { ...n, data: { ...n.data, params: { ...n.data.params, [key]: value } } }
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
