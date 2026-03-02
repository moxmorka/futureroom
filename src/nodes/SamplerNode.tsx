import React, { useRef, useState } from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";
import { formatNum } from "../ui/theme";

export function SamplerNode({ id, data, runtime }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function onPickFile(file: File) {
    const eng = runtime?.getEngine?.(id) as any;
    if (eng?.loadFromFile) {
      await eng.loadFromFile(file);
      setLoaded(true);
    }
  }

  return (
    <div className="node">
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Sampler</div>
          <div className="nodeSub">{loaded ? "sample loaded" : "load a file"}</div>
        </div>
        <div className="badge">AUDIO</div>
      </div>

      <div className="nodeBody">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPickFile(f);
          }}
        />
        <Button onClick={() => inputRef.current?.click()}>
          {loaded ? "Replace Sample" : "Load Sample"}
        </Button>

        <div className="row">
          <div className="labelRow"><span>Gain</span><span className="value">{formatNum(p.gain, 2)}</span></div>
          <Slider value={p.gain ?? 0.8} min={0} max={1} step={0.01} onChange={(v) => update(id, "gain", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Cutoff</span><span className="value">{formatNum(p.cutoff, 0)} Hz</span></div>
          <Slider value={p.cutoff ?? 12000} min={100} max={16000} step={10} onChange={(v) => update(id, "cutoff", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Detune</span><span className="value">{formatNum(p.detune, 0)} cents</span></div>
          <Slider value={p.detune ?? 0} min={-1200} max={1200} step={1} onChange={(v) => update(id, "detune", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>Start</span><span className="value">{formatNum(p.start, 2)}</span></div>
          <Slider value={p.start ?? 0} min={0} max={0.99} step={0.01} onChange={(v) => update(id, "start", v)} />
        </div>

        <div className="row">
          <div className="labelRow"><span>End</span><span className="value">{formatNum(p.end, 2)}</span></div>
          <Slider value={p.end ?? 1} min={0.01} max={1} step={0.01} onChange={(v) => update(id, "end", v)} />
        </div>

        <Handle className="handle-event" type="target" position={Position.Left} id="eventIn" style={{ top: 28 }} />
        <Handle className="handle-audio" type="source" position={Position.Right} id="audioOut" style={{ top: 28 }} />
      </div>
    </div>
  );
}
