import React, { useMemo } from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";
import { StepGrid } from "../ui/StepGrid";
import { formatNum } from "../ui/theme";
import { ensureAudioRunning } from "../audio/audioContext";

const SCALES = [
  { id: "chromatic", name: "Chromatic" },
  { id: "major", name: "Major" },
  { id: "minor", name: "Minor" },
  { id: "dorian", name: "Dorian" },
  { id: "pentatonic", name: "Pentatonic" },
];

function toggleAt(pattern: string, idx: number, steps = 16) {
  const p = (pattern || "").padEnd(steps, "0").slice(0, steps).split("");
  p[idx] = p[idx] === "1" ? "0" : "1";
  return p.join("");
}

export function DigitoneNode({ id, data, runtime }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params || {};

  const seqOn = Boolean(p.seqOn ?? true);
  const steps = 16;
  const pattern = String(p.seqPattern ?? "1000100010001000");
  const note = Number(p.seqNote ?? 48);
  const scale = String(p.seqScale ?? "chromatic");
  const transpose = Number(p.seqTranspose ?? 0);

  const noteLabel = useMemo(() => `MIDI ${note}`, [note]);

  async function trig() {
    await ensureAudioRunning();
    runtime?.getEngine?.(id)?.onEvent?.({ type: "noteOn", note, velocity: 0.95 });
  }
  function rel() {
    runtime?.getEngine?.(id)?.onEvent?.({ type: "noteOff", note });
  }

  return (
    <div className="node" style={{ width: 380 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Digitone</div>
          <div className="nodeSub">FM synth + seq</div>
        </div>
        <div className="badge">{seqOn ? "SEQ ON" : "SEQ OFF"}</div>
      </div>

      <div className="nodeBody">
        <Button onPointerDown={(e) => { e.stopPropagation(); void trig(); }} onPointerUp={(e) => { e.stopPropagation(); rel(); }}>
          Trigger ({noteLabel})
        </Button>

        <div className="row nodrag" onPointerDown={(e) => e.stopPropagation()}>
          <div className="labelRow">
            <span>Sequencer</span>
            <span className="value">{seqOn ? "enabled" : "disabled"}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button style={{ height: 30, flex: 1 }} onClick={() => update(id, "seqOn", !seqOn)}>
              {seqOn ? "Disable" : "Enable"}
            </Button>
            <Button style={{ height: 30, width: 120 }} onClick={() => update(id, "seqPattern", "1000100010001000")}>
              Reset
            </Button>
          </div>

          <StepGrid
            steps={steps}
            pattern={pattern}
            onToggle={(i) => update(id, "seqPattern", toggleAt(pattern, i, steps))}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ flex: 1 }}>
              <div className="hint">Root note</div>
              <input
                className="nodrag"
                type="number"
                value={note}
                min={0}
                max={127}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => update(id, "seqNote", Number(e.target.value))}
                style={{
                  width: "100%",
                  height: 34,
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                  background: "linear-gradient(#ffffff,#ededf1)",
                  padding: "0 10px",
                }}
              />
            </label>

            <label style={{ flex: 1 }}>
              <div className="hint">Scale</div>
              <select
                className="nodrag"
                value={scale}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => update(id, "seqScale", e.target.value)}
                style={{
                  width: "100%",
                  height: 34,
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                  background: "linear-gradient(#ffffff,#ededf1)",
                  padding: "0 10px",
                }}
              >
                {SCALES.map((s) => (
                  <option key={s.id} value={s.id} style={{ background: "#fff" }}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ width: 92 }}>
              <div className="hint">Transp</div>
              <input
                className="nodrag"
                type="number"
                value={transpose}
                min={-24}
                max={24}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => update(id, "seqTranspose", Number(e.target.value))}
                style={{
                  width: "100%",
                  height: 34,
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                  background: "linear-gradient(#ffffff,#ededf1)",
                  padding: "0 10px",
                }}
              />
            </label>
          </div>
        </div>

        <div className="row">
          <div className="labelRow">
            <span>Algorithm</span>
            <span className="value">{formatNum(Number(p.algo ?? 0), 0)}</span>
          </div>
          <Slider value={Number(p.algo ?? 0)} min={0} max={2} step={1} onChange={(v) => update(id, "algo", v)} />
        </div>

        <div className="row">
          <div className="labelRow">
            <span>Cutoff</span>
            <span className="value">{formatNum(Number(p.cutoff ?? 14000), 0)} Hz</span>
          </div>
          <Slider value={Number(p.cutoff ?? 14000)} min={200} max={16000} step={10} onChange={(v) => update(id, "cutoff", v)} />
        </div>

        <Handle className="handle-event" type="target" position={Position.Left} id="eventIn" style={{ top: 28 }} />
        <Handle className="handle-audio" type="source" position={Position.Right} id="audioOut" style={{ top: 28 }} />
      </div>
    </div>
  );
}
