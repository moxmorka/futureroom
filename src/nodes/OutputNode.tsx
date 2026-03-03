import React, { useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../state/store";
import { ensureAudioRunning } from "../audio/audioContext";

export function OutputNode({ id, data, runtime }: any) {
  const update = useStore((s) => s.updateParam);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const sinkSupported = typeof (HTMLMediaElement.prototype as any).setSinkId === "function";

  useEffect(() => {
    (async () => {
      try {
        // Need permission before labels show; harmless even if denied
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {}
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === "audiooutput"));
    })();
  }, []);

  return (
    <div className="node" style={{ width: 260 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Output</div>
          <div className="nodeSub">{sinkSupported ? "select device" : "default device only"}</div>
        </div>
        <div className="badge">DEST</div>
      </div>

      <div className="nodeBody">
        <div className="hint">Connect audio here.</div>

        {sinkSupported && (
          <select
            value={String(data.params?.sinkId ?? "")}
            onChange={async (e) => {
              await ensureAudioRunning();
              update(id, "sinkId", e.target.value);
              runtime?.getEngine?.(id)?.setParam?.("sinkId", e.target.value);
            }}
            style={{
              height: 34,
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text)",
              padding: "0 10px",
            }}
          >
            <option value="" style={{ background: "#111113" }}>
              Default output
            </option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId} style={{ background: "#111113" }}>
                {d.label || `Output (${d.deviceId.slice(0, 6)}…)`}
              </option>
            ))}
          </select>
        )}

        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn" style={{ top: 28 }} />
      </div>
    </div>
  );
}
