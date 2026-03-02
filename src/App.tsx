import React, { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";

import { useStore } from "./state/store";
import { GraphRuntime, type EdgeData } from "./runtime/GraphRuntime";
import type { ModuleNodeData } from "./runtime/types";
import { ensureAudioRunning } from "./audio/audioContext";

import { FMNode } from "./nodes/FMNode";
import { SamplerNode } from "./nodes/SamplerNode";
import { OutputNode } from "./nodes/OutputNode";
import { ScopeNode } from "./nodes/ScopeNode";
import { ClockNode } from "./nodes/ClockNode";
import { SequencerNode } from "./nodes/SequencerNode";

export default function App() {
  const nodes = useStore((s) => s.nodes) as Node<ModuleNodeData>[];
  const edges = useStore((s) => s.edges) as Edge<EdgeData>[];
  const setNodes = useStore((s) => s.setNodes);
  const setEdges = useStore((s) => s.setEdges);

  const runtime = useMemo(() => new GraphRuntime(), []);

  useEffect(() => {
    runtime.sync(nodes, edges);
  }, [nodes, edges, runtime]);

  const nodeTypes = useMemo(
    () => ({
      fmNode: (props: any) => <FMNode {...props} runtime={runtime} />,
      samplerNode: (props: any) => <SamplerNode {...props} runtime={runtime} />,
      outNode: OutputNode,
      scopeNode: (props: any) => <ScopeNode {...props} runtime={runtime} />,
      clockNode: (props: any) => <ClockNode {...props} runtime={runtime} />,
      seqNode: (props: any) => <SequencerNode {...props} runtime={runtime} />,
    }),
    [runtime]
  );

  const onConnect = async (c: Connection) => {
    await ensureAudioRunning();

    // Decide cable kind based on handle ids
    const isEvent =
      (c.sourceHandle?.toLowerCase().includes("event") ?? false) ||
      (c.targetHandle?.toLowerCase().includes("event") ?? false);

    const edge: Edge<EdgeData> = {
      ...c,
      id: `e_${crypto.randomUUID()}`,
      data: { kind: isEvent ? "event" : "audio" },
      className: isEvent ? "edge-event" : "edge-audio",
    } as any;

    setEdges(addEdge(edge, edges));
  };

  return (
    <div className="rf-shell">
      <div className="topbar">
        <div className="brand">
          <span>ROBOT INTERFACE</span>
          <span className="badge">monochrome</span>
        </div>
        <div className="hint">Drag modules • Connect handles • Start clock</div>
      </div>

      <div className="canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges.map((e) => ({
            ...e,
            className: e.data?.kind === "event" ? "edge-event" : "edge-audio",
          }))}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          onNodesChange={(ch) => setNodes(applyNodeChanges(ch, nodes))}
          onEdgesChange={(ch) => setEdges(applyEdgeChanges(ch, edges))}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap zoomable pannable />
        </ReactFlow>
      </div>
    </div>
  );
}
