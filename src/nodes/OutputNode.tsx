import React from "react";
import { Handle, Position } from "reactflow";

export function OutputNode() {
  return (
    <div className="node" style={{ width: 220 }}>
      <div className="nodeHeader">
        <div>
          <div className="nodeTitle">Output</div>
          <div className="nodeSub">speakers</div>
        </div>
        <div className="badge">DEST</div>
      </div>

      <div className="nodeBody">
        <div className="hint">Connect audio here.</div>

        <Handle
          className="handle-audio"
          type="target"
          position={Position.Left}
          id="audioIn"
          style={{ top: 28 }}
        />
      </div>
    </div>
  );
}
