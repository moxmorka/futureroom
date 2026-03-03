export function drawScope(canvas: HTMLCanvasElement, data: Float32Array) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0b0b0c";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(229,231,235,0.92)";
  ctx.lineWidth = 2;
  ctx.beginPath();

  const step = Math.max(1, Math.floor(data.length / w));
  for (let x = 0; x < w; x++) {
    const v = data[x * step] ?? 0;
    const y = (0.5 - v * 0.45) * h;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
