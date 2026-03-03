export const formatNum = (n: number, digits = 2) =>
  Number.isFinite(n) ? n.toFixed(digits) : "—";
