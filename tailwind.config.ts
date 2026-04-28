import type { Config } from "tailwindcss";

// Brand tokens are declared as CSS variables in app/globals.css.
// Tailwind references them via arbitrary-value syntax: bg-[var(--blue)].
// We also expose a short theme extension for the most-used ones so
// classes like bg-panel / text-dim stay readable in components.

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        "panel-2": "var(--panel-2)",
        border: "var(--border)",
        "border-hot": "var(--border-hot)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-faint": "var(--text-faint)",
        blue: "var(--blue)",
        red: "var(--red)",
        orange: "var(--orange)",
        amber: "var(--amber)",
        teal: "var(--teal)",
        pink: "var(--pink)",

        "theme-surface": "var(--theme-surface)",
        "theme-surface-2": "var(--theme-surface-2)",
        "theme-on-surface": "var(--theme-on-surface)",
        "theme-on-surface-dim": "var(--theme-on-surface-dim)",
        "theme-primary": "var(--theme-primary)",
        "theme-primary-on": "var(--theme-primary-on)",
        "theme-accent": "var(--theme-accent)",
        "theme-border": "var(--theme-border)",
      },
      boxShadow: {
        "blue-glow": "0 0 24px var(--blue-glow)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        serif: ["var(--font-serif)"],
      },
      borderRadius: {
        DEFAULT: "2px",
      },
      letterSpacing: {
        mono: "0.15em",
        monoloose: "0.2em",
      },
    },
  },
  plugins: [],
};

export default config;
