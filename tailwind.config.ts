import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1B1A",       // near-black charcoal background
        chalk: "#F5F3EE",     // off-white text/background
        signal: "#E8491D",    // safety-orange CTA accent
        steel: "#5B6358",     // muted olive/steel secondary
        tape: "#F2C14E",      // warning-yellow highlight tape
        line: "#3A3835",      // hairline dividers on dark bg
      },
      fontFamily: {
        display: ["var(--font-oswald)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
