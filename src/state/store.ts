import { create } from "zustand";
import type { Edge, Node } from "reactflow";
import type { ModuleNodeData } from "../runtime/types";
import type { EdgeData } from "../runtime/GraphRuntime";

type Store = {
  nodes: Node<ModuleNodeData>[];
  edges: Edge<EdgeData>[];
  setNodes: (nodes: Node<ModuleNodeData>[]) => void;
  setEdges: (edges: Edge<EdgeData>[]) => void;
  updateParam: (nodeId: string, key: string, value: any) => void;
};

export const useStore = create<Store>((set) => ({
  nodes: [
    {
      id: "clock1",
      type: "clockNode",
      position: { x: 80, y: 80 },
      data: { moduleType: "clock", params: { bpm: 120 } },
    },
    {
      id: "seq1",
      type: "seqNode",
      position: { x: 80, y: 260 },
      data: { moduleType: "sequencer", params: { steps: 16, note: 48, velocity: 0.9, division: 6 } },
    },
    {
      id: "fm1",
      type: "fmNode",
      position: { x: 420, y: 260 },
      data: { moduleType: "fmVoice", params: { modIndex: 150, modRatio: 2, gain: 0.7, attack: 0.005, release: 0.08 } },
    },
    {
      id: "tap1",
      type: "scopeNode",
      position: { x: 740, y: 260 },
      data: { moduleType: "scopeTap", params: {} },
    },
    {
      id: "out1",
      type: "outNode",
      position: { x: 1040, y: 260 },
      data: { moduleType: "output", params: {} },
    },
    {
      id: "sam1",
      type: "samplerNode",
      position: { x: 420, y: 80 },
      data: { moduleType: "sampler", params: { gain: 0.8, cutoff: 12000, detune: 0, start: 0.0, end: 1.0 } },
    }
  ],
  edges: [
    // clock -> sequencer (event)
    { id: "e1", source: "clock1", target: "seq1", sourceHandle: "eventOut", targetHandle: "eventIn", data: { kind: "event" } },
    // sequencer -> fm (event)
    { id: "e2", source: "seq1", target: "fm1", sourceHandle: "eventOut", targetHandle: "eventIn", data: { kind: "event" } },
    // fm -> scope tap (audio)
    { id: "e3", source: "fm1", target: "tap1", sourceHandle: "audioOut", targetHandle: "audioIn", data: { kind: "audio" } },
    // scope tap -> output (audio)
    { id: "e4", source: "tap1", target: "out1", sourceHandle: "audioOut", targetHandle: "audioIn", data: { kind: "audio" } },

    // sequencer -> sampler (event) (optional)
    { id: "e5", source: "seq1", target: "sam1", sourceHandle: "eventOut", targetHandle: "eventIn", data: { kind: "event" } },
    // sampler -> output (audio)
    { id: "e6", source: "sam1", target: "out1", sourceHandle: "audioOut", targetHandle: "audioIn", data: { kind: "audio" } },
  ],
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
}));
