import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Outfit"', "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        ink: "#000000",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--foreground))",
        },
        quaternary: {
          DEFAULT: "hsl(var(--quaternary))",
          foreground: "hsl(var(--foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sketch: {
          pen: "#000000",
          postit: "#F5F5F5",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "var(--radius-sm)",
        blob: "1.5rem 1.5rem 1.5rem 0",
        arch: "9999px 9999px 0 0",
      },
      boxShadow: {
        pop: "var(--shadow-pop)",
        "pop-hover": "var(--shadow-pop-hover)",
        "pop-active": "var(--shadow-pop-active)",
        card: "var(--shadow-card)",
        "card-featured": "var(--shadow-card-featured)",
        hard: "4px 4px 0 0 #000000",
        "hard-lg": "8px 8px 0 0 #E0E0E8",
        "hard-hover": "6px 6px 0 0 #000000",
        "hard-active": "2px 2px 0 0 #000000",
        focus: "4px 4px 0 0 hsl(var(--ring))",
      },
      transitionTimingFunction: {
        bounce: "var(--motion-bounce)",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "33%": { transform: "rotate(3deg)" },
          "66%": { transform: "rotate(-3deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "0.65", transform: "scale(1.03)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        wiggle: "wiggle 0.4s ease-in-out",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
        "pop-in": "pop-in 0.45s var(--motion-bounce) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
