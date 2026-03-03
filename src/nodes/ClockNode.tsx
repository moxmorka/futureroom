import React from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";
import { formatNum } from "../ui/theme";

export function ClockNode({ id, data, runtime }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params;

  const running = (runtime?.getEngine?.(id) as any)?.isRunning?.() ?? false;

  return (
    <div className="node" style={{ width: 240 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Clock</div>
          <div className="nodeSub">24ppqn</div>
        </div>
        <div className="badge">EVENT</div>
      </div>

      <div className="nodeBody">
        <div className="row">
          <div className="labelRow">
            <span>BPM</span>
            <span className="value">{formatNum(p.bpm ?? 120, 0)}</span>
          </div>
          <Slider
            value={Number(p.bpm ?? 120)}
            min={40}
            max={200}
            step={1}
            onChange={(v) => update(id, "bpm", v)}
          />
        </div>

        <Button
          onClick={() => {
            const eng = runtime?.getEngine?.(id) as any;
            if (!eng) return;
            if (eng.isRunning?.()) eng.stop?.();
            else eng.start?.();
          }}
        >
          {running ? "Stop" : "Start"}
        </Button>

        <Handle
          className="handle-event"
          type="source"
          position={Position.Right}
          id="eventOut"
          style={{ top: 28 }}
        />
      </div>
    </div>
  );
}
