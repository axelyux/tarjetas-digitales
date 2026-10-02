function channel(hex: string, start: number): number {
  return parseInt(hex.slice(start, start + 2), 16) / 255;
}

function linear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return 0;
  return 0.2126 * linear(channel(hex, 1)) + 0.7152 * linear(channel(hex, 3)) + 0.0722 * linear(channel(hex, 5));
}

/** Color de texto legible (casi negro / blanco) sobre un fondo dado. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.45 ? "#111111" : "#ffffff";
}
