import React from "react";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={(props.className ? props.className + " " : "") + "nodrag"}
      style={{
        height: 34,
        borderRadius: 10,
        border: "1px solid var(--line)",
        background: "rgba(255,255,255,0.04)",
        color: "var(--text)",
        cursor: "pointer",
        padding: "0 12px",
        fontSize: 12,
        fontWeight: 650,
        letterSpacing: 0.2,
        ...(props.style || {}),
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        props.onPointerDown?.(e);
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
    />
  );
}
