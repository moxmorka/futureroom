import React, { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
};

export function Slider({ value, min, max, step = 0.01, onChange }: Props) {
  const [internal, setInternal] = useState(value);
  const raf = useRef<number | null>(null);
  const latest = useRef(value);

  useEffect(() => {
    setInternal(value);
    latest.current = value;
  }, [value]);

  function commit(v: number) {
    latest.current = v;

    if (raf.current != null) cancelAnimationFrame(raf.current);

    raf.current = requestAnimationFrame(() => {
      onChange(latest.current);
    });
  }

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setInternal(v);
    commit(v);
  }

  return (
    <input
      className="nodrag"
      type="range"
      min={min}
      max={max}
      step={step}
      value={internal}
      onChange={handle}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        cursor: "pointer",
        touchAction: "none",
      }}
    />
  );
}
