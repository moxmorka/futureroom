import React, { useMemo } from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";
import { formatNum } from "../ui/theme";
import { ensureAudioRunning } from "../audio/audioContext";

const KEYS = [
  ["C", 0], ["C#", 1], ["D", 2], ["D#", 3], ["E", 4], ["F", 5],
  ["F#", 6], ["G", 7], ["G#", 8], ["A", 9], ["A#", 10], ["B", 11],
] as const;

function midiFromKeyOct(key: number, oct: number) {
  // C4 = 60 => (oct+1)*12 + key
  return (oct + 1) * 12 + key;
}

function togglePattern(pattern: string, idx: number) {
  const p = (pattern || "0000000000000000").padEnd(16, "0").slice(0, 16);
  const a = p.split("");
  a[idx] = a[idx] === "1" ? "0" : "1";
  return a.join("");
}

export function DigitoneNode({ id, data, runtime }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params || {};

  const pattern = String(p.seqPattern ?? "1000100010001000").padEnd(16, "0").slice(0, 16);
  const seqOn = Boolean(p.seqOn ?? true);

  const note = Number(p.seqNote ?? 48);
  const keyGuess = ((note % 12) + 12) % 12;
  const octGuess = Math.floor(note / 12) - 1;

  const keyLabel = useMemo(() => KEYS.find((k) => k[1] === keyGuess)?.[0] ?? "C", [keyGuess]);

  async function trig() {
    await ensureAudioRunning();
    runtime?.getEngine?.(id)?.onEvent?.({ type: "noteOn", note, velocity: 0.95 });
  }
  function rel() {
    runtime?.getEngine?.(id)?.onEvent?.({ type: "noteOff", note });
  }

  return (
    <div className="node" style={{ width: 360 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Digitone</div>
          <div className="nodeSub">FM + 16-step</div>
        </div>
        <div className="badge">AUDIO</div>
      </div>

      <div className="nodeBody">
        <Button onPointerDown={(e) => { e.stopPropagation(); void trig(); }} onPointerUp={(e) => { e.stopPropagation(); rel(); }}>
          Trigger ({keyLabel}{octGuess})
        </Button>

        <div className="row nodrag" onPointerDown={(e) => e.stopPropagation()}>
          <div className="labelRow">
            <span>Sequencer</span>
            <span className="value">{seqOn ? "ON" : "OFF"}</span>
          </div>
          <Button
            style={{ height: 30 }}
            onClick={() => update(id, "seqOn", !seqOn)}
          >
            {seqOn ? "Disable Seq" : "Enable Seq"}
          </Button>

          <div className="grid16">
            {Array.from({ length: 16 }, (_, i) => {
              const on = pattern[i] === "1";
              return (
                <button
                  key={i}
                  className={`stepBtn nodrag ${on ? "on" : ""}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => update(id, "seqPattern", togglePattern(pattern, i))}
                  title={`Step ${i + 1}`}
                />
              );
            })}
          </div>
        </div>

        <div className="row nodrag" onPointerDown={(e) => e.stopPropagation()}>
          <div className="labelRow">
            <span>Note</span>
            <span className="value">{note}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <select
              className="nodrag"
              value={String(keyGuess)}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => update(id, "seqNote", midiFromKeyOct(Number(e.target.value), octGuess))}
              style={{
                height: 34,
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: "linear-gradient(#ffffff,#ededf1)",
                color: "var(--text)",
                padding: "0 10px",
                flex: 1,
              }}
            >
              {KEYS.map(([name, v]) => (
                <option key={name} value={v} style={{ background: "#fff" }}>
                  {name}
                </option>
              ))}
            </select>

            <select
              className="nodrag"
              value={String(octGuess)}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => update(id, "seqNote", midiFromKeyOct(keyGuess, Number(e.target.value)))}
              style={{
                height: 34,
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: "linear-gradient(#ffffff,#ededf1)",
                color: "var(--text)",
                padding: "0 10px",
                width: 90,
              }}
            >
              {Array.from({ length: 9 }, (_, i) => i - 1).map((o) => (
                <option key={o} value={o} style={{ background: "#fff" }}>
                  Oct {o}
                </option>
              ))}
            </select>
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
