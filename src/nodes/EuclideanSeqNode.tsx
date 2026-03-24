import React, { useMemo } from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";
import { formatNum } from "../ui/theme";

function buildPattern(steps: number, pulses: number, rotation: number) {
  const out = new Array(steps).fill(false);
  if (steps <= 0 || pulses <= 0) return out;
  for (let i = 0; i < steps; i++) {
    out[(i + rotation + steps) % steps] = (i * pulses) % steps < pulses;
  }
  return out;
}

export function EuclideanSeqNode({ id, data }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params || {};

  const seqOn = Boolean(p.seqOn ?? true);
  const steps = Number(p.steps ?? 16);
  const pulses = Number(p.pulses ?? 5);
  const rotation = Number(p.rotation ?? 0);
  const note = Number(p.note ?? 48);

  const pattern = useMemo(() => buildPattern(steps, Math.min(pulses, steps), rotation), [steps, pulses, rotation]);

  return (
    <div className="node" style={{ width: 360 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Euclidean Sequencer</div>
          <div className="nodeSub">even pulse distribution</div>
        </div>
        <div className="badge">{seqOn ? "SEQ ON" : "SEQ OFF"}</div>
      </div>

      <div className="nodeBody">
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => update(id, "seqOn", !seqOn)}>{seqOn ? "Disable" : "Enable"}</Button>
        </div>

        <div className="row nodrag" onPointerDown={(e) => e.stopPropagation()}>
          <div className="labelRow"><span>Steps</span><span className="value">{formatNum(steps, 0)}</span></div>
          <Slider value={steps} min={1} max={32} step={1} onChange={(v) => update(id, "steps", v)} />
        </div>

        <div className="row nodrag" onPointerDown={(e) => e.stopPropagation()}>
          <div className="labelRow"><span>Pulses</span><span className="value">{formatNum(pulses, 0)}</span></div>
          <Slider value={pulses} min={0} max={steps} step={1} onChange={(v) => update(id, "pulses", v)} />
        </div>

        <div className="row nodrag" onPointerDown={(e) => e.stopPropagation()}>
          <div className="labelRow"><span>Rotation</span><span className="value">{formatNum(rotation, 0)}</span></div>
          <Slider value={rotation} min={-16} max={16} step={1} onChange={(v) => update(id, "rotation", v)} />
        </div>

        <div className="row nodrag" onPointerDown={(e) => e.stopPropagation()}>
          <div className="labelRow"><span>Note</span><span className="value">{formatNum(note, 0)}</span></div>
          <Slider value={note} min={24} max={84} step={1} onChange={(v) => update(id, "note", v)} />
        </div>

        <div className="grid16 nodrag" style={{ gridTemplateColumns: `repeat(${Math.min(steps, 16)}, 1fr)` }} onPointerDown={(e) => e.stopPropagation()}>
          {pattern.slice(0, Math.min(steps, 16)).map((on, i) => (
            <button
              key={i}
              className={`stepBtn nodrag ${on ? "on" : ""}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => update(id, "rotation", rotation + 1)}
              title={`Step ${i + 1}`}
            />
          ))}
        </div>

        <div className="hint">Connect CLOCK → Euclidean Sequencer → synth EVENT input.</div>

        <Handle className="handle-event" type="target" position={Position.Left} id="eventIn" style={{ top: 28 }} />
        <Handle className="handle-event" type="source" position={Position.Right} id="eventOut" style={{ top: 28 }} />
      </div>
    </div>
  );
}
