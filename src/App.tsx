import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type Node,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { useStore, type ModuleUIType } from "./state/store";
import { GraphRuntime, type EdgeData } from "./runtime/GraphRuntime";
import type { ModuleNodeData } from "./runtime/types";
import { ensureAudioRunning } from "./audio/audioContext";

import { ClockNode } from "./nodes/ClockNode";
import { OutputNode } from "./nodes/OutputNode";
import { ScopeNode } from "./nodes/ScopeNode";
import { DigitoneNode } from "./nodes/DigitoneNode";
import { DigitaktNode } from "./nodes/DigitaktNode";
import { MonomachineNode } from "./nodes/MonomachineNode";
import { SamplerNode } from "./nodes/SamplerNode";
import { PixelSeqNode } from "./nodes/PixelSeqNode";
import { MixerNode } from "./nodes/MixerNode";
import { Mixer8Node } from "./nodes/Mixer8Node";

import {
  toPatch,
  savePatchToLocalStorage,
  loadPatchFromLocalStorage,
  downloadJSON,
  readJSONFile,
  type PatchV1,
} from "./runtime/patch";

function InnerApp() {
  const nodes = useStore((s) => s.nodes) as Node<ModuleNodeData>[];
  const edges = useStore((s) => s.edges) as Edge<EdgeData>[];
  const setNodes = useStore((s) => s.setNodes);
  const setEdges = useStore((s) => s.setEdges);
  const setPatch = useStore((s) => s.setPatch);
  const addModule = useStore((s) => s.addModule);
  const reset = useStore((s) => s.reset);

  const runtime = useMemo(() => new GraphRuntime(), []);
  const { screenToFlowPosition } = useReactFlow();

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    runtime.sync(nodes, edges);
  }, [nodes, edges, runtime]);

  const nodeTypes = useMemo(
    () => ({
      clockNode: (props: any) => <ClockNode {...props} runtime={runtime} />,
      outNode: (props: any) => <OutputNode {...props} runtime={runtime} />,
      scopeNode: (props: any) => <ScopeNode {...props} runtime={runtime} />,
      digitoneNode: (props: any) => <DigitoneNode {...props} runtime={runtime} />,
      digitaktNode: (props: any) => <DigitaktNode {...props} runtime={runtime} />,
      monomachineNode: (props: any) => <MonomachineNode {...props} runtime={runtime} />,
      samplerNode: (props: any) => <SamplerNode {...props} runtime={runtime} />,
      pixelSeqNode: (props: any) => <PixelSeqNode {...props} runtime={runtime} />,
      mixerNode: (props: any) => <MixerNode {...props} runtime={runtime} />,
      mixer8Node: (props: any) => <Mixer8Node {...props} runtime={runtime} />,
    }),
    [runtime]
  );

  const onConnect = async (c: Connection) => {
    await ensureAudioRunning();

    const isEvent =
      (c.sourceHandle?.toLowerCase().includes("event") ?? false) ||
      (c.targetHandle?.toLowerCase().includes("event") ?? false);

    const edge: Edge<EdgeData> = {
      ...(c as any),
      id: `e_${crypto.randomUUID()}`,
      data: { kind: isEvent ? "event" : "audio" },
      className: isEvent ? "edge-event" : "edge-audio",
    };

    setEdges(addEdge(edge as any, edges) as any);
  };

  function getViewportCenterFlowPos() {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    return screenToFlowPosition({ x, y });
  }

  function handleAdd(uiType: ModuleUIType) {
    const pos = getViewportCenterFlowPos();
    addModule(uiType, { x: pos.x - 160, y: pos.y - 80 });
  }

  function handleSave() {
    const patch = toPatch(nodes, edges);
    savePatchToLocalStorage(patch);
  }

  function handleLoad() {
    const patch = loadPatchFromLocalStorage();
    if (!patch) return;
    setPatch(patch.nodes, patch.edges);
  }

  function handleExport() {
    const patch = toPatch(nodes, edges);
    downloadJSON(`robot-patch-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`, patch);
  }

  async function handleImportFile(file: File) {
    const obj = (await readJSONFile(file)) as PatchV1;
    if (!obj || obj.version !== 1) return;
    setPatch(obj.nodes, obj.edges);
  }

  return (
    <div className="rf-shell">
      <div className="topbar">
        <div className="brand">
          <span>ROBOT INTERFACE</span>
          <span className="badge">Mixer8 • Sends</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="smallBtn nodrag" onPointerDown={(e) => e.stopPropagation()} onClick={() => setPanelOpen((v) => !v)}>
            {panelOpen ? "Hide" : "Show"}
          </button>

          <button className="smallBtn nodrag" onPointerDown={(e) => e.stopPropagation()} onClick={() => void ensureAudioRunning()}>
            Unlock Audio
          </button>

          <button className="smallBtn nodrag" onPointerDown={(e) => e.stopPropagation()} onClick={handleSave}>
            Save
          </button>
          <button className="smallBtn nodrag" onPointerDown={(e) => e.stopPropagation()} onClick={handleLoad}>
            Load
          </button>
          <button className="smallBtn nodrag" onPointerDown={(e) => e.stopPropagation()} onClick={handleExport}>
            Export
          </button>

          <input
            ref={importInputRef}
            className="fileInput"
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
              if (importInputRef.current) importInputRef.current.value = "";
            }}
          />

          <button className="smallBtn nodrag" onPointerDown={(e) => e.stopPropagation()} onClick={() => importInputRef.current?.click()}>
            Import
          </button>

          <button className="smallBtn nodrag" onPointerDown={(e) => e.stopPropagation()} onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <div className="canvas" style={{ position: "relative" }}>
        {panelOpen && (
          <div className="panel nodrag" onPointerDown={(e) => e.stopPropagation()}>
            <div className="panelTitle">Add Module</div>
            <div className="panelButtons">
              <button className="smallBtn" onClick={() => handleAdd("clockNode")}>Clock</button>
              <button className="smallBtn" onClick={() => handleAdd("digitoneNode")}>Digitone</button>
              <button className="smallBtn" onClick={() => handleAdd("monomachineNode")}>Monomachine</button>
              <button className="smallBtn" onClick={() => handleAdd("samplerNode")}>Sampler</button>
              <button className="smallBtn" onClick={() => handleAdd("pixelSeqNode")}>PixelSeq</button>
              <button className="smallBtn" onClick={() => handleAdd("mixer8Node")}>Mixer 8</button>
              <button className="smallBtn" onClick={() => handleAdd("scopeNode")}>Scope</button>
              <button className="smallBtn" onClick={() => handleAdd("outNode")}>Output</button>
            </div>
            <div className="hint" style={{ marginTop: 6 }}>
              Tip: Right-click a node to delete it.
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges.map((e) => ({ ...e, className: e.data?.kind === "event" ? "edge-event" : "edge-audio" }))}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          onNodesChange={(ch) => setNodes(applyNodeChanges(ch, nodes))}
          onEdgesChange={(ch) => setEdges(applyEdgeChanges(ch, edges))}
          onNodeContextMenu={(e, node) => {
            e.preventDefault();
            setNodes(nodes.filter((n) => n.id !== node.id));
            setEdges(edges.filter((ed) => ed.source !== node.id && ed.target !== node.id));
          }}
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

export default function App() {
  return (
    <ReactFlowProvider>
      <InnerApp />
    </ReactFlowProvider>
  );
}
