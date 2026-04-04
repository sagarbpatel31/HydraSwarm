import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#eef6ff",
          100: "#d8e9ff",
          200: "#b9d7ff",
          300: "#8ebcff",
          400: "#5e97ff",
          500: "#3874ff",
          600: "#2456f4",
          700: "#1f46de",
          800: "#203eb4",
          900: "#22398e"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }
    },
  },
  plugins: [],
};

export default config;
