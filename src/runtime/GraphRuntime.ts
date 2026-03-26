import type { Edge, Node } from "reactflow";
import type { ModuleNodeData, EventMessage } from "./types";
import type { ModuleEngine } from "./engines/base";
import { createEngine } from "./registry";
import { audioCtx } from "../audio/audioContext";

export type EdgeData = { kind: "audio" | "event" };

function makeNodeKey(nodes: Node<ModuleNodeData>[]) {
  return JSON.stringify(
    nodes.map((n) => [
      n.id,
      n.type,
      n.data?.moduleType,
      n.data?.params ?? {},
    ])
  );
}

function makeEdgeKey(edges: Edge<EdgeData>[]) {
  return JSON.stringify(
    edges.map((e) => [
      e.id,
      e.source,
      e.target,
      e.sourceHandle,
      e.targetHandle,
      e.data?.kind ?? "audio",
    ])
  );
}

export class GraphRuntime {
  private engines = new Map<string, ModuleEngine>();
  private lastNodeKey = "";
  private lastEdgeKey = "";

  private master = audioCtx.createGain();

  constructor() {
    this.master.gain.value = 0.9;
    this.master.connect(audioCtx.destination);
  }

  getEngine(id: string) {
    return this.engines.get(id);
  }

  sync(nodes: Node<ModuleNodeData>[], edges: Edge<EdgeData>[]) {
    const nodeKey = makeNodeKey(nodes);
    const edgeKey = makeEdgeKey(edges);

    const nodesChanged = nodeKey !== this.lastNodeKey;
    const edgesChanged = edgeKey !== this.lastEdgeKey;

    if (!nodesChanged && !edgesChanged) return;

    if (nodesChanged) {
      this.lastNodeKey = nodeKey;

      for (const n of nodes) {
        if (!this.engines.has(n.id)) {
          this.engines.set(n.id, createEngine(n.data.moduleType, n.data.params));
        }

        const eng = this.engines.get(n.id)!;
        for (const [k, v] of Object.entries(n.data.params || {})) {
          eng.setParam(k, v);
        }
      }

      for (const [id, eng] of [...this.engines.entries()]) {
        if (!nodes.find((n) => n.id === id)) {
          try {
            eng.dispose?.();
          } catch {}
          this.engines.delete(id);
        }
      }
    }

    if (nodesChanged || edgesChanged) {
      this.lastEdgeKey = edgeKey;
      this.rebuildConnections(edges);
    }
  }

  private rebuildConnections(edges: Edge<EdgeData>[]) {
    for (const eng of this.engines.values()) {
      try {
        eng.audioOut?.disconnect();
      } catch {}
    }

    try {
      this.master.disconnect();
    } catch {}
    this.master.connect(audioCtx.destination);

    for (const [id, eng] of this.engines.entries()) {
      const setBroadcaster = (eng as any).setBroadcaster as
        | undefined
        | ((fn: (msg: EventMessage) => void) => void);

      if (setBroadcaster) {
        setBroadcaster((msg: EventMessage) => this.broadcastFrom(id, msg, edges));
      }
    }

    for (const e of edges) {
      const kind = (e.data?.kind ?? "audio") as EdgeData["kind"];
      if (kind !== "audio") continue;

      const src = this.engines.get(e.source);
      const dst = this.engines.get(e.target);
      if (!src?.audioOut || !dst) continue;

      const th = String(e.targetHandle || "audioIn");
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
