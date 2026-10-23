/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f131c",
          dim: "#0f131c",
          bright: "#353943",
          lowest: "#0a0e17",
          low: "#181b25",
          container: "#1c1f29",
          high: "#262a34",
          highest: "#31353f",
        },
        primary: {
          DEFAULT: "#4edea3",
          container: "#10b981",
          dark: "#006c49",
        },
        secondary: {
          DEFAULT: "#45dfa4",
          container: "#00bd85",
        },
        accent: {
          emerald: "#10b981",
          gold: "#f59e0b",
          red: "#ef4444",
        },
        text: {
          main: "#dfe2ef",
          muted: "#86948a",
          dim: "#6b7280",
        },
        outline: {
          DEFAULT: "#3c4a42",
          subtle: "#262a34",
        },
      },
      fontFamily: {
        headline: ["Sora", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        custom: "0.25rem",
      },
    },
  },
  plugins: [],
}
