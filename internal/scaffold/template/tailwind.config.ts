import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

const color = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: color("border"),
        input: color("border"),
        ring: color("primary"),
        background: color("background"),
        foreground: color("foreground"),
        primary: { DEFAULT: color("primary"), foreground: color("primary-foreground") },
        secondary: { DEFAULT: color("muted"), foreground: color("foreground") },
        destructive: { DEFAULT: color("destructive"), foreground: color("primary-foreground") },
        muted: { DEFAULT: color("muted"), foreground: color("muted-foreground") },
        accent: { DEFAULT: color("muted"), foreground: color("foreground") },
        popover: { DEFAULT: color("background"), foreground: color("foreground") },
        card: { DEFAULT: color("background"), foreground: color("foreground") },
        sidebar: {
          DEFAULT: color("muted"), foreground: color("foreground"),
          primary: color("primary"), "primary-foreground": color("primary-foreground"),
          accent: color("muted"), "accent-foreground": color("foreground"),
          border: color("border"), ring: color("primary"),
        },
      },
    },
  },
  plugins: [animate, typography],
} satisfies Config;
