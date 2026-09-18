module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm-neutral base
        ivory: "#FAF8F4", // Canvas background — warm porcelain, never stark white
        blush: "#EFEAE1", // Secondary surface / featured panel — warm sand, not pink
        ink: "#1A1715", // Primary text — deep espresso-charcoal

        // Brand chrome: deep olive (navbar, footer)
        brand: {
          light: "#3A4438",
          DEFAULT: "#242A22",
          dark: "#171B16",
        },

        // Commerce accent: deep navy — badges, price, Add to Cart, links
        clay: {
          light: "#D5C2A2",
          DEFAULT: "#B99B6B",
          dark: "#8C7143",
        },

        // Refined accents
        gold: "#B99B6B", // Muted brass — dividers, subtle detail
        sage: "#E4E8E0", // Soft muted olive-grey — pill backgrounds, borders

        // Emerald Palette
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-work-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        marquee: "marquee 26s linear infinite",
        pop: "pop 0.25s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
