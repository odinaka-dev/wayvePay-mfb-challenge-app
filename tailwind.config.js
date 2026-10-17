/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Keep in sync with src/constants/colors.ts (used where a raw value is needed, e.g. icon tints).
      colors: {
        primary: "#3451F5",
        "primary-dark": "#2339C9",
        background: "#F5F6FA",
        surface: "#FFFFFF",
        border: "#ECEEF3",
        text: "#1B1D28",
        muted: "#7B8094",
        success: "#1E8E3E",
        danger: "#E5372B",
        warning: "#F5A524",
        reversed: "#6D28D9",
      },
    },
  },
  plugins: [],
};
