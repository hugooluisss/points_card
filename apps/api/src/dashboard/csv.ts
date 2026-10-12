export function csvCell(value: unknown): string {
  let cell = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",") + "\r\n";
}
