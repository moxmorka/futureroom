import React from "react";

export function StepGrid({
  steps = 16,
  pattern,
  onToggle,
  activeStep = -1,
}: {
  steps?: number;
  pattern: string; // "1010..."
  onToggle: (i: number) => void;
  activeStep?: number;
}) {
  const p = (pattern || "").padEnd(steps, "0").slice(0, steps);

  return (
    <div
      className="grid16 nodrag"
      style={{ gridTemplateColumns: `repeat(${steps}, 1fr)` }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {Array.from({ length: steps }, (_, i) => {
        const on = p[i] === "1";
        const isActive = i === activeStep;
        return (
          <button
            key={i}
            className={`stepBtn nodrag ${on ? "on" : ""}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onToggle(i)}
            title={`Step ${i + 1}`}
            style={{
              outline: isActive ? "2px solid rgba(0,0,0,0.35)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}
