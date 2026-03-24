import type { Edge, Node } from "reactflow";
import type { ModuleNodeData, EventMessage } from "./types";
import type { ModuleEngine } from "./engines/base";
import { createEngine } from "./registry";
import { audioCtx } from "../audio/audioContext";

export type EdgeData = { kind: "audio" | "event" };

function edgeSignature(edges: Edge<EdgeData>[]) {
  return edges
    .map((e) => `${e.id}|${e.source}|${e.target}|${e.sourceHandle || ""}|${e.targetHandle || ""}|${e.data?.kind || "audio"}`)
    .sort()
    .join("~");
}

export class GraphRuntime {
  private engines = new Map<string, ModuleEngine>();
  private lastEdgesKey = "";
  private currentEdges: Edge<EdgeData>[] = [];

  private master = audioCtx.createGain();

  constructor() {
    this.master.gain.value = 0.9;
    this.master.connect(audioCtx.destination);
  }

  getEngine(id: string) {
    return this.engines.get(id);
  }

  sync(nodes: Node<ModuleNodeData>[], edges: Edge<EdgeData>[]) {
    this.currentEdges = edges;

    const nodeIds = new Set(nodes.map((n) => n.id));

    for (const n of nodes) {
      if (!this.engines.has(n.id)) {
        this.engines.set(n.id, createEngine(n.data.moduleType, n.data.params));
      }
      const eng = this.engines.get(n.id)!;
      for (const [k, v] of Object.entries(n.data.params || {})) eng.setParam(k, v);
    }

    for (const [id, eng] of [...this.engines.entries()]) {
      if (!nodeIds.has(id)) {
        eng.dispose?.();
        this.engines.delete(id);
      }
    }

    const nextKey = edgeSignature(edges);
    if (nextKey !== this.lastEdgesKey) {
      this.lastEdgesKey = nextKey;
      this.rebuildConnections(edges);
    }
  }

  private rebuildConnections(edges: Edge<EdgeData>[]) {
    for (const eng of this.engines.values()) {
      try {
        eng.audioOut?.disconnect();
      } catch {}
    }

    for (const [id, eng] of this.engines.entries()) {
      const setBroadcaster = (eng as any).setBroadcaster as undefined | ((fn: (msg: EventMessage) => void) => void);
      if (setBroadcaster) {
        setBroadcaster((msg: EventMessage) => this.broadcastFrom(id, msg));
      }
    }

    for (const e of edges) {
      const kind = (e.data?.kind ?? "audio") as EdgeData["kind"];
      if (kind !== "audio") continue;

      const src = this.engines.get(e.source);
      const dst = this.engines.get(e.target);
      if (!src?.audioOut || !dst) continue;

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

    for (const [id, eng] of this.engines.entries()) {
      if (!eng.audioOut) continue;
      const hasOutgoingAudio = edges.some((e) => e.source === id && (e.data?.kind ?? "audio") === "audio");
      if (!hasOutgoingAudio) {
        try {
          eng.audioOut.connect(this.master);
        } catch {}
      }
    }
  }

  private broadcastFrom(sourceId: string, msg: EventMessage) {
    for (const e of this.currentEdges) {
      if (e.source !== sourceId) continue;
      if ((e.data?.kind ?? "audio") !== "event") continue;
      this.engines.get(e.target)?.onEvent?.(msg);
    }
  }
}
