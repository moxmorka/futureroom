import React from "react";

export function Slider({
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
      className="input nodrag"
      type="range"
      min={min}
      max={max}
      step={step ?? 1}
      value={value}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
