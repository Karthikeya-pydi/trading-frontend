export function formatCurrency(value: number | string) {
  return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function formatPercent(value: number | string) {
  return `${Number(value).toFixed(2)}%`;
} 