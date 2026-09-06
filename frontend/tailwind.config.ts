import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        border: "var(--border)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        scan: {
          DEFAULT: "var(--accent-scan)",
          dim: "var(--accent-scan-dim)",
        },
        verify: {
          DEFAULT: "var(--accent-verify)",
          dim: "var(--accent-verify-dim)",
        },
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        gridshift: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "48px 48px" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 var(--accent-scan-dim)" },
          "70%": { boxShadow: "0 0 0 10px transparent" },
          "100%": { boxShadow: "0 0 0 0 transparent" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        scanline: "scanline 1.8s linear infinite",
        gridshift: "gridshift 6s linear infinite",
        pulsering: "pulseRing 2s ease-out infinite",
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
