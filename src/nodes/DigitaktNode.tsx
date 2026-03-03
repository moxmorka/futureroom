import React from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { formatNum } from "../ui/theme";

export function DigitaktNode({ id, data }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params;

  return (
    <div className="node" style={{ width: 300 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Digitakt</div>
          <div className="nodeSub">step trigger</div>
        </div>
        <div className="badge">SEQ</div>
      </div>

      <div className="nodeBody">
        <div className="row">
          <div className="labelRow">
            <span>Steps</span>
            <span className="value">{formatNum(Number(p.steps ?? 16), 0)}</span>
          </div>
          <Slider
            value={Number(p.steps ?? 16)}
            min={4}
            max={32}
            step={1}
            onChange={(v) => update(id, "steps", v)}
          />
        </div>

        <Handle
          className="handle-event"
          type="target"
          position={Position.Left}
          id="eventIn"
          style={{ top: 28 }}
        />

        <Handle
          className="handle-audio"
          type="source"
          position={Position.Right}
          id="audioOut"
          style={{ top: 28 }}
        />
      </div>
    </div>
  );
}
