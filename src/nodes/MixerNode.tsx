import React from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";

export function MixerNode({ id, data }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params || {};
  const mute = Boolean(p.mute ?? false);

  return (
    <div className="node" style={{ width: 320 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Mixer</div>
          <div className="nodeSub">sum + master</div>
        </div>
        <div className="badge">AUDIO</div>
      </div>

      <div className="nodeBody">
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => update(id, "mute", !mute)}>{mute ? "Muted" : "Mute"}</Button>
        </div>

        <div className="row">
          <div className="labelRow">
            <span>Master</span>
            <span className="value">{Number(p.gain ?? 0.9).toFixed(2)}</span>
          </div>
          <Slider value={Number(p.gain ?? 0.9)} min={0} max={1.5} step={0.01} onChange={(v) => update(id, "gain", v)} />
        </div>

        {/* multiple sources can connect into same input — it's a mix bus */}
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn" style={{ top: 28 }} />
        <Handle className="handle-audio" type="source" position={Position.Right} id="audioOut" style={{ top: 28 }} />
      </div>
    </div>
  );
}
