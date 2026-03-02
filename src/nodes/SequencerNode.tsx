import React, { useMemo, useState } from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { formatNum } from "../ui/theme";

export function SequencerNode({ id, data, runtime }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params;
  const [_, force] = useState(0);

  const steps = Math.max(1, Math.min(32, Number(p.steps ?? 16)));

  const pattern = useMemo(() => {
    const eng = runtime?.getEngine?.(id) as any;
    return eng?.getPattern?.() ?? Array.from({ length: steps }, () => 0);
  }, [id, runtime, steps, _]);

  function toggle(i: number) {
    const eng = runtime?.getEngine?.(id) as any;
    eng?.toggleStep?.(i);
    force((x) => x + 1);
  }

  return (
    <div className="node" style={{ width: 320 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Sequencer</div>
          <div className="nodeSub">clock → triggers</div>
        </div>
        <div className="badge">EVENT</div>
      </div>

      <div className="nodeBody">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: 6 }}>
          {Array.from({ length: steps }).slice(0, 16).map((_, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              style={{
                height: 22,
                borderRadius: 7,
                border: "1px solid var(--line)",
                background: pattern[i] ? "rgba(229,231,235,0.9)" : "rgba(255,255,255,0.04)",
                cursor: "pointer",
              }}
              title={`Step ${i + 1}`}
            />
          ))}
        </div>

        <div className="row">
          <div className="labelRow"><span>Steps</span><span className="value">{formatNum(p.steps ?? 16, 0)}</span></div>
          <Slider value={p.steps ?? 16} min={1} max={32} step={1} onChange={(v) => update(id, "steps", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Note</span><span className="value">{formatNum(p.note ?? 48, 0)}</span></div>
          <Slider value={p.note ?? 48} min={24} max={84} step={1} onChange={(v) => update(id, "note", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Velocity</span><span className="value">{formatNum(p.velocity ?? 0.9, 2)}</span></div>
          <Slider value={p.velocity ?? 0.9} min={0} max={1} step={0.01} onChange={(v) => update(id, "velocity", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Division</span><span className="value">{formatNum(p.division ?? 6, 0)} ticks/step</span></div>
          <Slider value={p.division ?? 6} min={1} max={24} step={1} onChange={(v) => update(id, "division", v)} />
        </div>

        <Handle className="handle-event" type="target" position={Position.Left} id="eventIn" style={{ top: 28 }} />
        <Handle className="handle-event" type="source" position={Position.Right} id="eventOut" style={{ top: 28 }} />
      </div>
    </div>
  );
}
