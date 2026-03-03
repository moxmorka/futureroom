import type { Edge, Node } from "reactflow";
import type { ModuleNodeData, EventMessage } from "./types";
import type { ModuleEngine } from "./engines/base";
import { createEngine } from "./registry";
import { audioCtx } from "../audio/audioContext";

export type EdgeData = { kind: "audio" | "event" };

export class GraphRuntime {
  private engines = new Map<string, ModuleEngine>();
  private lastEdgesKey = "";
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
      if (!this.engines.has(n.id)) this.engines.set(n.id, createEngine(n.data.moduleType, n.data.params));
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

    const edgesKey = JSON.stringify(edges.map((e) => [e.id, e.source, e.target, e.data?.kind]));
    if (edgesKey !== this.lastEdgesKey) {
      this.lastEdgesKey = edgesKey;
      this.rebuildConnections(edges);
    }
  }

  private rebuildConnections(edges: Edge<EdgeData>[]) {
    // disconnect all existing audioOut routes (best-effort)
    for (const eng of this.engines.values()) {
      try { eng.audioOut?.disconnect(); } catch {}
    }

    // set event broadcasters
    for (const [id, eng] of this.engines.entries()) {
      const setBroadcaster = (eng as any).setBroadcaster as undefined | ((fn: (msg: EventMessage) => void) => void);
      if (setBroadcaster) setBroadcaster((msg: EventMessage) => this.broadcastFrom(id, msg, edges));
    }

    // connect audio edges
    for (const e of edges) {
      const src = this.engines.get(e.source);
      const dst = this.engines.get(e.target);
      if (!src || !dst) continue;

      if ((e.data?.kind ?? "audio") === "audio") {
        if (src.audioOut && dst.audioIn) {
          try { src.audioOut.connect(dst.audioIn); } catch {}
        }
      }
    }

    // ✅ fallback: if a module has audioOut but no outgoing audio edges, route to master
    for (const [id, eng] of this.engines.entries()) {
      if (!eng.audioOut) continue;

      const hasAudioOutEdge = edges.some(
        (e) => e.source === id && (e.data?.kind ?? "audio") === "audio"
      );

      if (!hasAudioOutEdge) {
        try { eng.audioOut.connect(this.master); } catch {}
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
