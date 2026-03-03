import React from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";
import { formatNum } from "../ui/theme";

export function DigitoneNode({ id, data, runtime }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params;

  return (
    <div className="node" style={{ width: 340 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Digitone</div>
          <div className="nodeSub">4-op FM • poly</div>
        </div>
        <div className="badge">AUDIO</div>
      </div>

      <div className="nodeBody">
        <Button
          onMouseDown={() =>
            runtime?.getEngine?.(id)?.onEvent?.({
              type: "noteOn",
              note: 48,
              velocity: 0.9
            })
          }
          onMouseUp={() =>
            runtime?.getEngine?.(id)?.onEvent?.({
              type: "noteOff",
              note: 48
            })
          }
        >
          Trigger (C2)
        </Button>

        <div className="row">
          <div className="labelRow">
            <span>Algorithm</span>
            <span className="value">{formatNum(Number(p.algo ?? 0), 0)}</span>
          </div>
          <Slider
            value={Number(p.algo ?? 0)}
            min={0}
            max={2}
            step={1}
            onChange={(v) => update(id, "algo", v)}
          />
        </div>

        <div className="row">
          <div className="labelRow">
            <span>Cutoff</span>
            <span className="value">
              {formatNum(Number(p.cutoff ?? 14000), 0)} Hz
            </span>
          </div>
          <Slider
            value={Number(p.cutoff ?? 14000)}
            min={200}
            max={16000}
            step={10}
            onChange={(v) => update(id, "cutoff", v)}
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
