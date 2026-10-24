import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0d11",
          900: "#10131a",
          800: "#171b24",
          700: "#1f2531",
          600: "#2a3140",
        },
        mist: {
          100: "#e8edf5",
          300: "#b6c0d2",
          500: "#7d89a1",
        },
        ember: "#f5a524",
        signal: {
          affected: "#fb7185",
          clear: "#34d399",
          unknown: "#fbbf24",
          confirmed: "#7dd3fc",
          inferred: "#c4b5fd",
          missing: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
