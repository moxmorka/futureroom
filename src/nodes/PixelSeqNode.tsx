import React, { useMemo } from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

const PALETTE = [
  { label: "−25c", bg: "linear-gradient(#7dd3fc,#38bdf8)" },
  { label: "0c",   bg: "linear-gradient(#ffffff,#ededf1)" },
  { label: "+25c", bg: "linear-gradient(#fde68a,#f59e0b)" },
  { label: "5th",  bg: "linear-gradient(#bbf7d0,#22c55e)" },
  { label: "8ve",  bg: "linear-gradient(#ddd6fe,#a78bfa)" },
  { label: "−8ve", bg: "linear-gradient(#fecaca,#ef4444)" },
];

function parseGrid(grid: string, total: number) {
  const out = new Array(total).fill(-1);
  if (!grid) return out;
  const parts = grid.split(",").map((x) => Number(x));
  for (let i = 0; i < Math.min(total, parts.length); i++) out[i] = Number.isFinite(parts[i]) ? parts[i] : -1;
  return out;
}

export function PixelSeqNode({ id, data }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params || {};

  const steps = 16;
  const rows = 8;
  const total = steps * rows;

  const grid = useMemo(() => parseGrid(String(p.grid ?? ""), total), [p.grid, total]);

  function writeGrid(next: number[]) {
    update(id, "grid", next.join(","));
  }

  function cycleCell(idx: number) {
    const next = grid.slice();
    const v = next[idx];
    if (v < 0) next[idx] = 0;
    else if (v >= PALETTE.length - 1) next[idx] = -1;
    else next[idx] = v + 1;
    writeGrid(next);
  }

  function clear() {
    writeGrid(new Array(total).fill(-1));
  }

  const seqOn = Boolean(p.seqOn ?? true);

  return (
    <div className="node" style={{ width: 420 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">PixelSeq</div>
          <div className="nodeSub">paint pixels → notes</div>
        </div>
        <div className="badge">{seqOn ? "SEQ ON" : "SEQ OFF"}</div>
      </div>

      <div className="nodeBody">
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => update(id, "seqOn", !seqOn)}>{seqOn ? "Disable" : "Enable"}</Button>
          <Button onClick={clear}>Clear</Button>
          <div className="hint" style={{ alignSelf: "center" }}>Connect EVENT → synth</div>
        </div>

        <div className="row nodrag" onPointerDown={(e) => e.stopPropagation()}>
          <div className="labelRow">
            <span>Root note (MIDI)</span>
            <span className="value">{Number(p.rootNote ?? 48)}</span>
          </div>
          <Slider
            value={Number(p.rootNote ?? 48)}
            min={24}
            max={84}
            step={1}
            onChange={(v) => update(id, "rootNote", v)}
          />
        </div>

        {/* Swiss-ish grid */}
        <div
          className="nodrag"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${steps}, 1fr)`,
            gap: 6,
            padding: 8,
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "rgba(255,255,255,0.6)",
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const v = grid[i];
            return (
              <button
                key={i}
                className="nodrag"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => cycleCell(i)}
                title={v < 0 ? "off" : PALETTE[clamp(v, 0, PALETTE.length - 1)].label}
                style={{
                  height: 20,
                  borderRadius: 7,
                  border: "1px solid var(--line)",
                  background: v < 0 ? "linear-gradient(#ffffff,#ededf1)" : PALETTE[clamp(v, 0, PALETTE.length - 1)].bg,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
                  cursor: "pointer",
                }}
              />
            );
          })}
        </div>

        <div className="hint">
          Bottom row = lower pitch. Color controls tonality/offset. Click cycles.
        </div>

        <Handle className="handle-event" type="target" position={Position.Left} id="eventIn" style={{ top: 28 }} />
        <Handle className="handle-event" type="source" position={Position.Right} id="eventOut" style={{ top: 28 }} />
      </div>
    </div>
  );
}
