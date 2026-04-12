/**
 * Calculate relative luminance of an RGB color based on W3C standard.
 */
export const calculateLuminance = (r: number, g: number, b: number): number => {
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;
  const R = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const G = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const B = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/**
 * Calculates an appropriate foreground color (text color) given a background RGB.
 * Uses W3C accessibility guidelines for contrast.
 * Returns an RGB string like '255 255 255'.
 */
export const getPrimaryForeground = (r: number, g: number, b: number): string => {
  const luminance = calculateLuminance(r, g, b);
  
  // W3C recommended threshold is ~0.179 for standard text.
  // We use 0.4 based on the project's historical adjustment for better modern UI aesthetics.
  if (luminance > 0.4) {
    // Generate a highly darkened version of the primary color for dark text on bright background
    const darkR = Math.round(r * 0.15);
    const darkG = Math.round(g * 0.15);
    const darkB = Math.round(b * 0.15);
    return `${darkR} ${darkG} ${darkB}`;
  } else {
    // White text for dark backgrounds
    return '255 255 255';
  }
};

/**
 * Converts a hex color string to RGB numbers.
 * @param hex e.g., '#00BCD4' or '00BCD4'
 */
export const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
  let r = 0, g = 188, b = 212; // default #00BCD4
  if (hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
      g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
      b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }
  return { r, g, b };
};

/**
 * Converts RGB numbers to a hex color string.
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};
