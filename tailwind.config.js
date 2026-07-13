// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#64748b",
        success: "#10b981",
        danger: "#ef4444",
        'background-light': "#f8fafc",
        'background-dark': "#0f172a",
        'card-light': "#ffffff",
        'card-dark': "#1e293b",
        'border-light': "#e2e8f0",
        'border-dark': "#334155",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        'xl': "0.75rem",
        '2xl': "1rem",
      },
    },
  },
  plugins: [],
}