/**
 * Parse flexible time input into minutes.
 * Accepts: "30m", "1h30m", "1h 30m", "1.5h", "2h", "90" (bare number = minutes).
 * Returns undefined for empty or unparseable input.
 */
export function parseTimeInput(input: string): number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // "1h30m" or "1h 30m"
  const hm = trimmed.match(/^(\d+(?:\.\d+)?)\s*h\s*(\d+)\s*m$/i);
  if (hm) return Math.round(parseFloat(hm[1]) * 60 + parseInt(hm[2]));

  // "30m"
  const m = trimmed.match(/^(\d+)\s*m$/i);
  if (m) return parseInt(m[1]);

  // "1.5h" or "2h"
  const h = trimmed.match(/^(\d+(?:\.\d+)?)\s*h$/i);
  if (h) return Math.round(parseFloat(h[1]) * 60);

  // bare number defaults to minutes
  const num = parseFloat(trimmed);
  if (!isNaN(num) && num > 0) return Math.round(num);

  return undefined;
}

/**
 * Format minutes into a human-readable string like "1h 30m" or "45m".
 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
