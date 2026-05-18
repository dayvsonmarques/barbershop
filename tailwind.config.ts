import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        primary: "#5750F1",
        stroke: "#E6EBF1",
        "stroke-dark": "#27303E",
        dark: {
          DEFAULT: "#111928",
          2: "#1F2A37",
          3: "#374151",
          4: "#4B5563",
          5: "#6B7280",
          6: "#9CA3AF",
        },
        gray: {
          dark: "#122031",
          2: "#F3F4F6",
        },
      },
      boxShadow: {
        1: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        "card-2": "0px 8px 24px rgba(17, 24, 39, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
