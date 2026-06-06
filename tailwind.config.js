/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      colors: {
        ink:    { DEFAULT: "#14202E", soft: "#1F2E40" },
        paper:  { DEFAULT: "#F4EFE6", soft: "#EAE3D3" },
        accent: { DEFAULT: "#B97A6B", dark: "#A06258" },
        muted:  "#5B6779",
        alert:  "#8B4843",
      },
    },
  },
  plugins: [],
};
