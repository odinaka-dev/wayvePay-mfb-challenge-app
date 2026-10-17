// Mirrors the palette in tailwind.config.js for places that need a raw color value
// (icon tints, native props) instead of a className.
export const palette = {
  primary: "#3451F5",
  primaryDark: "#2339C9",
  background: "#F5F6FA",
  surface: "#FFFFFF",
  border: "#ECEEF3",
  text: "#1B1D28",
  muted: "#7B8094",
  success: "#1E8E3E",
  danger: "#E5372B",
  warning: "#F5A524",
  reversed: "#6D28D9",
  white: "#FFFFFF",
} as const;
