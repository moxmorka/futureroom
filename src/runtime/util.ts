export function midiToHz(note: number) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
