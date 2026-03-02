import type { Edge, Node } from "reactflow";
import type { ModuleNodeData, EventMessage } from "./types";
import type { ModuleEngine } from "./engines/base";
import { createEngine } from "./registry";

// Edge data typing
export type EdgeData = {
  kind: "audio" | "event";
};

export class GraphRuntime {
  private engines = new Map<string, ModuleEngine>();
  private lastEdgesKey = "";

  getEngine(id: string) {
    return this.engines.get(id);
  }

  sync(nodes: Node<ModuleNodeData>[], edges: Edge<EdgeData>[]) {
    // create/update engines
    for (const n of nodes) {
      if (!this.engines.has(n.id)) {
        const eng = createEngine(n.data.moduleType, n.data.params);
        this.engines.set(n.id, eng);
      }

      const eng = this.engines.get(n.id)!;
      for (const [k, v] of Object.entries(n.data.params || {})) {
        eng.setParam(k, v);
      }
    }

    // remove deleted
    for (const [id, eng] of [...this.engines.entries()]) {
      if (!nodes.find((n) => n.id === id)) {
        eng.dispose?.();
        this.engines.delete(id);
      }
    }

    // connect graph (rebuild when edges change)
    const edgesKey = JSON.stringify(edges.map(e => [e.id, e.source, e.target, e.data?.kind]));
    if (edgesKey !== this.lastEdgesKey) {
      this.lastEdgesKey = edgesKey;
      this.rebuildConnections(edges);
    }
  }

  private rebuildConnections(edges: Edge<EdgeData>[]) {
    // Best-effort disconnect: we can disconnect by reconnecting from scratch
    // Safer approach: create dedicated input gains and only connect to those.
    // Our engines already do that (audioIn nodes exist as inputs where needed).

    // First: disconnect all source audioOuts from everything
    for (const eng of this.engines.values()) {
      try { eng.audioOut?.disconnect(); } catch {}
    }

    // Setup event broadcasters: modules that emit events get a broadcaster that routes to their outgoing event edges
    for (const [id, eng] of this.engines.entries()) {
      const setBroadcaster = (eng as any).setBroadcaster as undefined | ((fn: (msg: EventMessage) => void) => void);
      if (setBroadcaster) {
        setBroadcaster((msg: EventMessage) => this.broadcastFrom(id, msg, edges));
      }
    }

    // Now connect edges
    for (const e of edges) {
      const src = this.engines.get(e.source);
      const dst = this.engines.get(e.target);
      const kind = e.data?.kind ?? "audio";
      if (!src || !dst) continue;

      if (kind === "audio") {
        if (src.audioOut && dst.audioIn) {
          try { src.audioOut.connect(dst.audioIn); } catch {}
        }
      } else {
        // event: nothing to connect now; broadcastFrom handles routing at runtime
      }
    }
  }

  private broadcastFrom(sourceId: string, msg: EventMessage, edges: Edge<EdgeData>[]) {
    for (const e of edges) {
      if (e.source !== sourceId) continue;
      if ((e.data?.kind ?? "audio") !== "event") continue;

      const dst = this.engines.get(e.target);
      dst?.onEvent?.(msg);
    }
  }
}
