import React from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { formatNum } from "../ui/theme";

export function FMNode({ id, data }: any) {
  const update = useStore((s) => s.updateParam);

  const p = data.params;

  return (
    <div className="node">
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">FM Voice</div>
          <div className="nodeSub">carrier ⇄ modulator</div>
        </div>
        <div className="badge">AUDIO</div>
      </div>

      <div className="nodeBody">
        <div className="row">
          <div className="labelRow"><span>Mod Index</span><span className="value">{formatNum(p.modIndex, 0)}</span></div>
          <Slider value={p.modIndex ?? 150} min={0} max={800} step={1} onChange={(v) => update(id, "modIndex", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Mod Ratio</span><span className="value">{formatNum(p.modRatio, 2)}</span></div>
          <Slider value={p.modRatio ?? 2} min={0.25} max={12} step={0.25} onChange={(v) => update(id, "modRatio", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Gain</span><span className="value">{formatNum(p.gain, 2)}</span></div>
          <Slider value={p.gain ?? 0.7} min={0} max={1} step={0.01} onChange={(v) => update(id, "gain", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Attack</span><span className="value">{formatNum(p.attack, 3)}</span></div>
          <Slider value={p.attack ?? 0.005} min={0.001} max={0.2} step={0.001} onChange={(v) => update(id, "attack", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Release</span><span className="value">{formatNum(p.release, 3)}</span></div>
          <Slider value={p.release ?? 0.08} min={0.01} max={0.6} step={0.005} onChange={(v) => update(id, "release", v)} />
        </div>

        {/* Handles */}
        <Handle className="handle-event" type="target" position={Position.Left} id="eventIn" style={{ top: 28 }} />
        <Handle className="handle-audio" type="source" position={Position.Right} id="audioOut" style={{ top: 28 }} />
      </div>
    </div>
  );
}
