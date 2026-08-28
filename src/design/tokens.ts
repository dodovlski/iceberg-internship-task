/** Design tokens ,  Iceberg Digital color palette (DESIGN_LANGUAGE.md) */

export const colors = {
  background: "#F0F0F5",
  foreground: "#000000",
  muted: "#F5F5F5",
  mutedForeground: "#222222",
  accent: "#E6007E",
  accentForeground: "#FFFFFF",
  secondary: "#9B59B6",
  secondaryForeground: "#FFFFFF",
  tertiary: "#F0F0F5",
  quaternary: "#EEEEF3",
  border: "#E5E5EB",
  input: "#FFFFFF",
  card: "#FFFFFF",
  ring: "#E6007E",
  ink: "#000000",
  body: "#1A1A1A",
  dark: "#000000",
} as const;

export const radius = {
  sm: "8px",
  md: "16px",
  lg: "24px",
  full: "9999px",
} as const;

export const borderWidth = "2px";

export const shadow = {
  pop: "4px 4px 0px 0px #000000",
  popHover: "6px 6px 0px 0px #000000",
  popActive: "2px 2px 0px 0px #000000",
  card: "8px 8px 0px 0px #E0E0E8",
  cardFeatured: "8px 8px 0px 0px #E6007E",
  focus: "4px 4px 0px 0px #E6007E",
} as const;

export const motion = {
  bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  duration: "300ms",
} as const;

export const typography = {
  heading: '"Outfit", system-ui, sans-serif',
  body: '"Plus Jakarta Sans", system-ui, sans-serif',
  scaleRatio: 1.25,
} as const;

/** Decorative accents ,  Iceberg magenta + gradient purple + neutrals */
export const featureAccents = ["accent", "secondary", "tertiary", "quaternary"] as const;
