import type { Edge, Node } from "reactflow";
import type { ModuleNodeData, EventMessage } from "./types";
import type { ModuleEngine } from "./engines/base";
import { createEngine } from "./registry";
import { audioCtx } from "../audio/audioContext";

export type EdgeData = { kind: "audio" | "event" };

export class GraphRuntime {
  private engines = new Map<string, ModuleEngine>();
  private lastEdgesKey = "";

  // master fallback output (so you always hear something even if Output node wiring is weird)
  private master = audioCtx.createGain();

  constructor() {
    this.master.gain.value = 0.9;
    this.master.connect(audioCtx.destination);
  }

  getEngine(id: string) {
    return this.engines.get(id);
  }

  sync(nodes: Node<ModuleNodeData>[], edges: Edge<EdgeData>[]) {
    // create/update engines
    for (const n of nodes) {
      if (!this.engines.has(n.id)) {
        this.engines.set(n.id, createEngine(n.data.moduleType, n.data.params));
      }
      const eng = this.engines.get(n.id)!;
      for (const [k, v] of Object.entries(n.data.params || {})) eng.setParam(k, v);
    }

    // dispose removed
    for (const [id, eng] of [...this.engines.entries()]) {
      if (!nodes.find((n) => n.id === id)) {
        eng.dispose?.();
        this.engines.delete(id);
      }
    }

    const edgesKey = JSON.stringify(edges.map((e) => [e.id, e.source, e.target, e.sourceHandle, e.targetHandle, e.data?.kind]));
    if (edgesKey !== this.lastEdgesKey) {
      this.lastEdgesKey = edgesKey;
      this.rebuildConnections(edges);
    }
  }

  private rebuildConnections(edges: Edge<EdgeData>[]) {
    // disconnect all audioOut routes (best-effort)
    for (const eng of this.engines.values()) {
      try {
        eng.audioOut?.disconnect();
      } catch {}
    }

    // wire event broadcasters
    for (const [id, eng] of this.engines.entries()) {
      const setBroadcaster = (eng as any).setBroadcaster as undefined | ((fn: (msg: EventMessage) => void) => void);
      if (setBroadcaster) {
        setBroadcaster((msg: EventMessage) => this.broadcastFrom(id, msg, edges));
      }
    }

    // connect audio edges (HANDLE-AWARE)
    for (const e of edges) {
      const kind = (e.data?.kind ?? "audio") as EdgeData["kind"];
      if (kind !== "audio") continue;

      const src = this.engines.get(e.source);
      const dst = this.engines.get(e.target);
      if (!src || !dst) continue;
      if (!src.audioOut) continue;

      // If targetHandle is audioIn1/audioIn2/... route there; else fallback to dst.audioIn
      const th = (e.targetHandle || "audioIn") as string;
      const dstIn =
        (dst as any)[th] ||
        (th === "audioIn" ? (dst as any).audioIn : null) ||
        (dst as any).audioIn;

      if (dstIn) {
        try {
          src.audioOut.connect(dstIn);
        } catch {}
      }
    }

    // fallback: any engine with audioOut but no outgoing audio edges -> route to master
    for (const [id, eng] of this.engines.entries()) {
      if (!eng.audioOut) continue;

      const hasOutgoingAudio = edges.some(
        (e) => e.source === id && (e.data?.kind ?? "audio") === "audio"
      );

      if (!hasOutgoingAudio) {
        try {
          eng.audioOut.connect(this.master);
        } catch {}
      }
    }
  }

  private broadcastFrom(sourceId: string, msg: EventMessage, edges: Edge<EdgeData>[]) {
    for (const e of edges) {
      if (e.source !== sourceId) continue;
      if ((e.data?.kind ?? "audio") !== "event") continue;
      this.engines.get(e.target)?.onEvent?.(msg);
    }
  }
}
