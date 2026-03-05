import React from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { Slider } from "../ui/Slider";
import { Button } from "../ui/Button";

function chKey(ch: number, k: string) {
  return `ch${ch}_${k}`;
}

export function Mixer8Node({ id, data }: any) {
  const update = useStore((s) => s.updateParam);
  const p = data.params || {};

  return (
    <div className="node" style={{ width: 460 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Mixer 8</div>
          <div className="nodeSub">sends: delay + reverb</div>
        </div>
        <div className="badge">AUDIO</div>
      </div>

      <div className="nodeBody">
        {/* Channels */}
        {Array.from({ length: 8 }, (_, i) => i + 1).map((ch) => {
          const mute = Boolean(p[chKey(ch, "mute")] ?? false);
          const solo = Boolean(p[chKey(ch, "solo")] ?? false);
          const gain = Number(p[chKey(ch, "gain")] ?? 0.9);
          const pan = Number(p[chKey(ch, "pan")] ?? 0);
          const sendA = Number(p[chKey(ch, "sendA")] ?? 0);
          const sendB = Number(p[chKey(ch, "sendB")] ?? 0);

          return (
            <div key={ch} className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
              <div className="labelRow">
                <span>CH {ch}</span>
                <span className="value">
                  {gain.toFixed(2)} • pan {pan.toFixed(2)} • A {sendA.toFixed(2)} • B {sendB.toFixed(2)}
                </span>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Button style={{ height: 30 }} onClick={() => update(id, chKey(ch, "mute"), !mute)}>
                  {mute ? "Muted" : "Mute"}
                </Button>
                <Button style={{ height: 30 }} onClick={() => update(id, chKey(ch, "solo"), !solo)}>
                  {solo ? "Solo" : "Solo"}
                </Button>
              </div>

              <div className="hint">Gain</div>
              <Slider value={gain} min={0} max={1.5} step={0.01} onChange={(v) => update(id, chKey(ch, "gain"), v)} />
              <div className="hint">Pan</div>
              <Slider value={pan} min={-1} max={1} step={0.01} onChange={(v) => update(id, chKey(ch, "pan"), v)} />
              <div className="hint">Send A (Delay)</div>
              <Slider value={sendA} min={0} max={1} step={0.01} onChange={(v) => update(id, chKey(ch, "sendA"), v)} />
              <div className="hint">Send B (Reverb)</div>
              <Slider value={sendB} min={0} max={1} step={0.01} onChange={(v) => update(id, chKey(ch, "sendB"), v)} />
            </div>
          );
        })}

        {/* FX + Master */}
        <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
          <div className="labelRow">
            <span>Master</span>
            <span className="value">{Number(p.master ?? 0.9).toFixed(2)}</span>
          </div>
          <Slider value={Number(p.master ?? 0.9)} min={0} max={1.5} step={0.01} onChange={(v) => update(id, "master", v)} />

          <div className="labelRow">
            <span>Drive</span>
            <span className="value">{Number(p.drive ?? 0.12).toFixed(2)}</span>
          </div>
          <Slider value={Number(p.drive ?? 0.12)} min={0} max={1} step={0.01} onChange={(v) => update(id, "drive", v)} />

          <div className="labelRow"><span>Delay time</span><span className="value">{Number(p.delayTime ?? 0.25).toFixed(3)}s</span></div>
          <Slider value={Number(p.delayTime ?? 0.25)} min={0} max={1.5} step={0.005} onChange={(v) => update(id, "delayTime", v)} />

          <div className="labelRow"><span>Delay feedback</span><span className="value">{Number(p.delayFb ?? 0.35).toFixed(2)}</span></div>
          <Slider value={Number(p.delayFb ?? 0.35)} min={0} max={0.95} step={0.01} onChange={(v) => update(id, "delayFb", v)} />

          <div className="labelRow"><span>Delay tone</span><span className="value">{Number(p.delayTone ?? 6000).toFixed(0)} Hz</span></div>
          <Slider value={Number(p.delayTone ?? 6000)} min={500} max={16000} step={50} onChange={(v) => update(id, "delayTone", v)} />

          <div className="labelRow"><span>Delay return</span><span className="value">{Number(p.delayReturn ?? 0.25).toFixed(2)}</span></div>
          <Slider value={Number(p.delayReturn ?? 0.25)} min={0} max={1} step={0.01} onChange={(v) => update(id, "delayReturn", v)} />

          <div className="labelRow"><span>Reverb return</span><span className="value">{Number(p.reverbReturn ?? 0.22).toFixed(2)}</span></div>
          <Slider value={Number(p.reverbReturn ?? 0.22)} min={0} max={1} step={0.01} onChange={(v) => update(id, "reverbReturn", v)} />

          <div className="labelRow"><span>Reverb HP</span><span className="value">{Number(p.reverbHP ?? 250).toFixed(0)} Hz</span></div>
          <Slider value={Number(p.reverbHP ?? 250)} min={20} max={1500} step={10} onChange={(v) => update(id, "reverbHP", v)} />

          <div className="labelRow"><span>Reverb size</span><span className="value">{Number(p.reverbSize ?? 1.6).toFixed(2)}s</span></div>
          <Slider value={Number(p.reverbSize ?? 1.6)} min={0.2} max={6} step={0.05} onChange={(v) => update(id, "reverbSize", v)} />

          <div className="labelRow"><span>Reverb decay</span><span className="value">{Number(p.reverbDecay ?? 2.5).toFixed(2)}</span></div>
          <Slider value={Number(p.reverbDecay ?? 2.5)} min={0.5} max={6} step={0.05} onChange={(v) => update(id, "reverbDecay", v)} />
        </div>

        {/* Inputs: target handles audioIn1..audioIn8 */}
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn1" style={{ top: 72 }} />
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn2" style={{ top: 122 }} />
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn3" style={{ top: 172 }} />
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn4" style={{ top: 222 }} />
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn5" style={{ top: 272 }} />
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn6" style={{ top: 322 }} />
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn7" style={{ top: 372 }} />
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn8" style={{ top: 422 }} />

        <Handle className="handle-audio" type="source" position={Position.Right} id="audioOut" style={{ top: 72 }} />
      </div>
    </div>
  );
}
