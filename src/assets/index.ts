export function formatPercentage2(num: number) {
  return (Math.round(num * 100) / 100).toString();
}

export function formatPercentage(num: number): string {
  return Math.floor(num).toString();
}
