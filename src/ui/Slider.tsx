import React, { useEffect, useRef, useState } from "react";
import { ensureAudioRunning } from "../audio/audioContext";

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onInput?: (v: number) => void;   // live, no store write
  onChange: (v: number) => void;   // commit at end
};

export function Slider({ value, min, max, step = 0.01, onInput, onChange }: Props) {
  const [internal, setInternal] = useState(value);
  const latest = useRef(value);
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) {
      setInternal(value);
      latest.current = value;
    }
  }, [value]);

  function parse(v: string) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : min;
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parse(e.target.value);
    dragging.current = true;
    latest.current = v;
    setInternal(v);
    void ensureAudioRunning();
    onInput?.(v);
  }

  function commit() {
    if (!dragging.current) return;
    dragging.current = false;
    onChange(latest.current);
  }

  return (
    <input
      className="nodrag"
      type="range"
      min={min}
      max={max}
      step={step}
      value={internal}
      onChange={handleInput}
      onPointerDown={(e) => {
        e.stopPropagation();
        dragging.current = true;
        void ensureAudioRunning();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        commit();
      }}
      onPointerCancel={commit}
      onTouchStart={(e) => {
        e.stopPropagation();
        dragging.current = true;
        void ensureAudioRunning();
      }}
      onTouchEnd={commit}
      onMouseUp={commit}
      style={{ width: "100%", cursor: "pointer", touchAction: "none" }}
    />
  );
}
