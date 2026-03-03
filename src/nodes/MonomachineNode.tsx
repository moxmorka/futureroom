import React from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";
import { formatNum } from "../ui/theme";

const machines = ["supersaw", "pulse", "noise", "fmLite"] as const;

export function MonomachineNode({ id, data, runtime }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params;

  return (
    <div className="node" style={{ width: 340 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Monomachine</div>
          <div className="nodeSub">machines</div>
        </div>
        <div className="badge">AUDIO</div>
      </div>

      <div className="nodeBody">
        <Button
          onMouseDown={() =>
            runtime?.getEngine?.(id)?.onEvent?.({
              type: "noteOn",
              note: 36,
              velocity: 0.9
            })
          }
          onMouseUp={() =>
            runtime?.getEngine?.(id)?.onEvent?.({
              type: "noteOff",
              note: 36
            })
          }
        >
          Trigger (C1)
        </Button>

        <div className="row">
          <div className="labelRow">
            <span>Machine</span>
            <span className="value">{String(p.machine ?? "supersaw")}</span>
          </div>

          <select
            value={String(p.machine ?? "supersaw")}
            onChange={(e) => update(id, "machine", e.target.value)}
            style={{
              height: 34,
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text)",
              padding: "0 10px"
            }}
          >
            {machines.map((m) => (
              <option key={m} value={m} style={{ background: "#111113" }}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <div className="labelRow">
            <span>Cutoff</span>
            <span className="value">
              {formatNum(Number(p.cutoff ?? 12000), 0)} Hz
            </span>
          </div>
          <Slider
            value={Number(p.cutoff ?? 12000)}
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
