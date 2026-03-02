import React from "react";

export function Knob({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      className="input"
      type="range"
      min={min}
      max={max}
      step={step ?? 0.01}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
