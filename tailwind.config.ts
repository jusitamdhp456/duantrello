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
          base: "#E0E5EC",
          dark: "#A3B1C6",
          light: "#FFFFFF"
        }
      },
      boxShadow: {
        'neu-convex': '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)',
        'neu-concave': 'inset 6px 6px 10px 0 rgba(163, 177, 198, 0.7), inset -6px -6px 10px 0 rgba(255, 255, 255, 0.8)',
        'neu-pressed': 'inset 4px 4px 6px 0 rgba(163, 177, 198, 0.7), inset -4px -4px 6px 0 rgba(255, 255, 255, 0.8)',
      },
    },
  },
  plugins: [],
};
export default config;
