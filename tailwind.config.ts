import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        neu: {
          base: "#0D2657",
          dark: "#0A1E45",
          light: "#1A3A7C",
        },
        ocean: {
          50:  "#E0F4FF",
          100: "#B8E3F9",
          200: "#7EC8EF",
          300: "#44ACDF",
          400: "#2B91CE",
          500: "#1A76B8",
          600: "#0D5FA3",
          700: "#0D4A8A",
          800: "#0D2657",
          900: "#081740",
        },
      },
      boxShadow: {
        // Blue dark neumorphism
        'neu-convex': '6px 6px 14px rgba(8, 23, 64, 0.5), -6px -6px 14px rgba(30, 70, 140, 0.4)',
        'neu-concave': 'inset 5px 5px 10px rgba(8, 23, 64, 0.6), inset -5px -5px 10px rgba(30, 70, 140, 0.4)',
        'neu-pressed': 'inset 3px 3px 7px rgba(8, 23, 64, 0.6), inset -3px -3px 7px rgba(30, 70, 140, 0.4)',
        'neu-flat': '0px 2px 8px rgba(8, 23, 64, 0.35)',
        'card-glow': '0 0 20px rgba(44, 116, 177, 0.25)',
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        }
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
      }
    },
  },
  plugins: [],
};
export default config;
