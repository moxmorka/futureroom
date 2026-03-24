import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ensureAudioRunning, installAudioWakeHandlers } from "./audio/audioContext";

import { ClockNode } from "./nodes/ClockNode";
import { OutputNode } from "./nodes/OutputNode";
import { ScopeNode } from "./nodes/ScopeNode";
import { DigitoneNode } from "./nodes/DigitoneNode";
import { DigitaktNode } from "./nodes/DigitaktNode";
import { MonomachineNode } from "./nodes/MonomachineNode";
import { SamplerNode } from "./nodes/SamplerNode";
import { PixelSeqNode } from "./nodes/PixelSeqNode";
import { EuclideanSeqNode } from "./nodes/EuclideanSeqNode";
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
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    installAudioWakeHandlers();
  }, []);

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
      euclideanSeqNode: (props: any) => <EuclideanSeqNode {...props} runtime={runtime} />,
      mixerNode: (props: any) => <MixerNode {...props} runtime={runtime} />,
      mixer8Node: (props: any) => <Mixer8Node {...props} runtime={runtime} />,
    }),
    [runtime]
  );

  const decoratedEdges = useMemo(
    () => edges.map((e) => ({ ...e, className: e.data?.kind === "event" ? "edge-event" : "edge-audio" })),
    [edges]
  );

  const stopCanvasPropagation = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    void ensureAudioRunning();
  }, []);

  const getViewportCenterFlowPos = useCallback(() => {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    return screenToFlowPosition({ x, y });
  }, [screenToFlowPosition]);

  const handleAdd = useCallback((uiType: ModuleUIType) => {
    const pos = getViewportCenterFlowPos();
    addModule(uiType, { x: pos.x - 160, y: pos.y - 80 });
    void ensureAudioRunning();
  }, [addModule, getViewportCenterFlowPos]);

  const handleSave = useCallback(() => {
    savePatchToLocalStorage(toPatch(nodesRef.current, edgesRef.current));
  }, []);

  const handleLoad = useCallback(() => {
    const patch = loadPatchFromLocalStorage();
    if (!patch) return;
    setPatch(patch.nodes, patch.edges);
    void ensureAudioRunning();
  }, [setPatch]);

  const handleExport = useCallback(() => {
    const fileName = `futureroom-patch-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    downloadJSON(fileName, toPatch(nodesRef.current, edgesRef.current));
  }, []);

  const handleImportFile = useCallback(async (file: File) => {
    const obj = (await readJSONFile(file)) as PatchV1;
    if (!obj || obj.version !== 1) return;
    setPatch(obj.nodes, obj.edges);
    void ensureAudioRunning();
  }, [setPatch]);

  const onConnect = useCallback(async (c: Connection) => {
    await ensureAudioRunning();
    const isEvent = (c.sourceHandle?.toLowerCase().includes("event") ?? false) || (c.targetHandle?.toLowerCase().includes("event") ?? false);
    const edge: Edge<EdgeData> = {
      ...(c as any),
      id: `e_${crypto.randomUUID()}`,
      data: { kind: isEvent ? "event" : "audio" },
      className: isEvent ? "edge-event" : "edge-audio",
    };
    setEdges(addEdge(edge as any, edgesRef.current) as any);
  }, [setEdges]);

  const onNodesChange = useCallback((changes: any) => {
    setNodes(applyNodeChanges(changes, nodesRef.current));
  }, [setNodes]);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges(applyEdgeChanges(changes, edgesRef.current));
  }, [setEdges]);

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node<ModuleNodeData>) => {
    e.preventDefault();
    setNodes(nodesRef.current.filter((n) => n.id !== node.id));
    setEdges(edgesRef.current.filter((ed) => ed.source !== node.id && ed.target !== node.id));
  }, [setEdges, setNodes]);

  return (
    <div className="rf-shell" onPointerDown={() => void ensureAudioRunning()} onTouchStart={() => void ensureAudioRunning()} onMouseDown={() => void ensureAudioRunning()}>
      <div className="topbar">
        <div className="brand">
          <span>FUTUREROOM INTERFACE</span>
          <span className="badge">Matrix Mixer • Euclidean • Sends</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="smallBtn nodrag" onPointerDown={stopCanvasPropagation} onClick={() => setPanelOpen((v) => !v)}>
            {panelOpen ? "Hide" : "Show"}
          </button>
          <button className="smallBtn nodrag" onPointerDown={stopCanvasPropagation} onClick={() => void ensureAudioRunning()}>
            Unlock Audio
          </button>
          <button className="smallBtn nodrag" onPointerDown={stopCanvasPropagation} onClick={handleSave}>Save</button>
          <button className="smallBtn nodrag" onPointerDown={stopCanvasPropagation} onClick={handleLoad}>Load</button>
          <button className="smallBtn nodrag" onPointerDown={stopCanvasPropagation} onClick={handleExport}>Export</button>

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

          <button className="smallBtn nodrag" onPointerDown={stopCanvasPropagation} onClick={() => importInputRef.current?.click()}>Import</button>
          <button className="smallBtn nodrag" onPointerDown={stopCanvasPropagation} onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="canvas" style={{ position: "relative" }}>
        {panelOpen && (
          <div className="panel nodrag" onPointerDown={stopCanvasPropagation as any}>
            <div className="panelTitle">Add Device</div>
            <div className="panelButtons">
              <button className="smallBtn" onClick={() => handleAdd("clockNode")}>Clock</button>
              <button className="smallBtn" onClick={() => handleAdd("digitoneNode")}>Tone Engine</button>
              <button className="smallBtn" onClick={() => handleAdd("digitaktNode")}>Trigger Engine</button>
              <button className="smallBtn" onClick={() => handleAdd("monomachineNode")}>Mono Voice</button>
              <button className="smallBtn" onClick={() => handleAdd("samplerNode")}>Sample Deck</button>
              <button className="smallBtn" onClick={() => handleAdd("pixelSeqNode")}>Pixel Sequencer</button>
              <button className="smallBtn" onClick={() => handleAdd("euclideanSeqNode")}>Euclidean Sequencer</button>
              <button className="smallBtn" onClick={() => handleAdd("mixerNode")}>Mixer</button>
              <button className="smallBtn" onClick={() => handleAdd("mixer8Node")}>Matrix Mixer</button>
              <button className="smallBtn" onClick={() => handleAdd("scopeNode")}>Scope</button>
              <button className="smallBtn" onClick={() => handleAdd("outNode")}>Output</button>
            </div>
            <div className="hint" style={{ marginTop: 6 }}>Tip: Right-click a device to delete it.</div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={decoratedEdges}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeContextMenu={onNodeContextMenu}
          fitView
          deleteKeyCode={["Backspace", "Delete"]}
          onlyRenderVisibleElements
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
