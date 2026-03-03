import type { Edge, Node } from "reactflow";
import type { ModuleNodeData } from "./types";
import type { EdgeData } from "./GraphRuntime";

export type PatchV1 = {
  version: 1;
  createdAt: string;
  nodes: Node<ModuleNodeData>[];
  edges: Edge<EdgeData>[];
};

const LS_KEY = "robot_patch_v1";

export function toPatch(nodes: Node<ModuleNodeData>[], edges: Edge<EdgeData>[]): PatchV1 {
  return { version: 1, createdAt: new Date().toISOString(), nodes, edges };
}

export function savePatchToLocalStorage(patch: PatchV1) {
  localStorage.setItem(LS_KEY, JSON.stringify(patch));
}

export function loadPatchFromLocalStorage(): PatchV1 | null {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return null;
    return parsed as PatchV1;
  } catch {
    return null;
  }
}

export function downloadJSON(filename: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function readJSONFile(file: File): Promise<any> {
  const text = await file.text();
  return JSON.parse(text);
}
