import React, { useEffect, useRef } from "react";
import { Handle, Position } from "reactflow";
import { drawScope } from "../audio/scopeDraw";

export function ScopeNode({ id, runtime }: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function loop() {
      const eng = runtime?.getEngine?.(id);
      const analyser = eng?.analyser;
      if (analyser) {
        const buf = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(buf);
        drawScope(canvas, buf);
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [id, runtime]);

  return (
    <div className="node" style={{ width: 300 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Scope</div>
          <div className="nodeSub">tap + analyser</div>
        </div>
        <div className="badge">AUDIO</div>
      </div>

      <div className="nodeBody">
        <canvas
          ref={canvasRef}
          width={270}
          height={90}
          style={{ width: "100%", borderRadius: 12, border: "1px solid var(--line)" }}
        />
        <Handle className="handle-audio" type="target" position={Position.Left} id="audioIn" style={{ top: 28 }} />
        <Handle className="handle-audio" type="source" position={Position.Right} id="audioOut" style={{ top: 28 }} />
      </div>
    </div>
  );
}
