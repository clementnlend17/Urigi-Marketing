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
        primary: {
          DEFAULT: "#10B981", // Vert émeraude
          hover: "#059669",
          light: "#D1FAE5"
        },
        sidebar: {
          DEFAULT: "#ffffff",
          hover: "#F3F4F6",
          active: "#F3F4F6",
          border: "#E5E7EB"
        }
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
