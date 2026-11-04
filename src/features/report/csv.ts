type Cell = string | number;

/** Quotes a cell; a leading = + - @ is neutralised so a spreadsheet never runs a movie title as a formula. */
function cell(value: Cell): string {
  if (typeof value === "number") return String(value);
  const text = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Saves the table as a CSV file, with a BOM so Excel reads Vietnamese correctly. */
export function downloadCsv(filename: string, header: string[], rows: Cell[][]) {
  const text = [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿", text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
