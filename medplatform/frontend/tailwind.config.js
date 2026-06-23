/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: { base:"#0F1A13", raised:"#172012", card:"#1E2D1A", input:"#243320", hover:"#2A3D25" },
        border:  { subtle:"#2E4228", strong:"#3D5934" },
        content: { primary:"#E8F0E4", secondary:"#9DB896", muted:"#5E7A57" },
        accent:  { green:"#4ADE80", amber:"#FCD34D", red:"#F87171", blue:"#60A5FA", teal:"#34D399" },
      },
    },
  },
  plugins: [],
};
