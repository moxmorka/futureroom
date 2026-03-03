import React, { useRef, useState } from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { ensureAudioRunning } from "../audio/audioContext";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";
import { StepGrid } from "../ui/StepGrid";

function toggleAt(pattern: string, idx: number, steps = 16) {
  const p = (pattern || "").padEnd(steps, "0").slice(0, steps).split("");
  p[idx] = p[idx] === "1" ? "0" : "1";
  return p.join("");
}

export function SamplerNode({ id, data, runtime }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params || {};
  const steps = 16;
  const pattern = String(p.seqPattern ?? "1000100010001000");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>(String(p.fileName ?? ""));

  async function loadFile(file: File) {
    await ensureAudioRunning();
    const arr = await file.arrayBuffer();
    const buf = await new Promise<AudioBuffer>((resolve, reject) =>
      runtime ? runtime : resolve
    );

    // decode using AudioContext directly (runtime doesn't own it)
    const audioCtx = (window.AudioContext || (window as any).webkitAudioContext)
      ? (runtime?.getEngine?.(id)?.audioOut?.context as AudioContext) ??
        new (window.AudioContext || (window as any).webkitAudioContext)()
      : null;

    if (!audioCtx) return;

    const decoded = await audioCtx.decodeAudioData(arr.slice(0));
    update(id, "fileName", file.name);

    // push buffer into engine
    runtime?.getEngine?.(id)?.setParam?.("buffer", decoded);
    update(id, "hasBuffer", true);
    setFileName(file.name);
  }

  return (
    <div className="node" style={{ width: 380 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Sampler</div>
          <div className="nodeSub">{fileName ? fileName : "upload a file"}</div>
        </div>
        <div className="badge">AUDIO</div>
      </div>

      <div className="nodeBody">
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="fileInput"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void loadFile(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => fileRef.current?.click()}>Upload</Button>
          <Button
            onClick={async () => {
              await ensureAudioRunning();
              runtime?.getEngine?.(id)?.onEvent?.({ type: "noteOn", note: 60, velocity: 1 });
            }}
          >
            Trigger
          </Button>
          <Button onClick={() => update(id, "seqOn", !Boolean(p.seqOn ?? true))}>
            {Boolean(p.seqOn ?? true) ? "Seq: ON" : "Seq: OFF"}
          </Button>
        </div>

        <div className="row nodrag" onPointerDown={(e) => e.stopPropagation()}>
          <div className="labelRow">
            <span>Pattern</span>
            <span className="value">{steps} steps</span>
          </div>
          <StepGrid
            steps={steps}
            pattern={pattern}
            onToggle={(i) => update(id, "seqPattern", toggleAt(pattern, i, steps))}
          />
        </div>

        <div className="row">
          <div className="labelRow"><span>Gain</span><span className="value">{Number(p.gain ?? 0.9).toFixed(2)}</span></div>
          <Slider value={Number(p.gain ?? 0.9)} min={0} max={1} step={0.01} onChange={(v) => update(id, "gain", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Rate</span><span className="value">{Number(p.rate ?? 1).toFixed(2)}</span></div>
          <Slider value={Number(p.rate ?? 1)} min={0.25} max={2} step={0.01} onChange={(v) => update(id, "rate", v)} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div className="row" style={{ flex: 1 }}>
            <div className="labelRow"><span>Start</span><span className="value">{Number(p.start ?? 0).toFixed(2)}</span></div>
            <Slider value={Number(p.start ?? 0)} min={0} max={0.99} step={0.01} onChange={(v) => update(id, "start", v)} />
          </div>
          <div className="row" style={{ flex: 1 }}>
            <div className="labelRow"><span>End</span><span className="value">{Number(p.end ?? 1).toFixed(2)}</span></div>
            <Slider value={Number(p.end ?? 1)} min={0.01} max={1} step={0.01} onChange={(v) => update(id, "end", v)} />
          </div>
        </div>

        <Handle className="handle-event" type="target" position={Position.Left} id="eventIn" style={{ top: 28 }} />
        <Handle className="handle-audio" type="source" position={Position.Right} id="audioOut" style={{ top: 28 }} />
      </div>
    </div>
  );
}
