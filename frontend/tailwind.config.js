/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        danilo: {
          // Surfaces
          bg: "#FFFFFF",
          "bg-secondary": "#F8F9FA",
          "bg-tertiary": "#F1F3F4",
          surface: "#FFFFFF",
          "surface-hover": "#F8F9FA",
          "surface-active": "#E8F0FE",
          "surface-elevated": "#FFFFFF",
          // Borders
          border: "#E0E0E0",
          "border-subtle": "#F1F3F4",
          "border-focus": "#1A73E8",
          // Primary — Google Blue
          primary: "#1A73E8",
          "primary-hover": "#1557B0",
          "primary-subtle": "rgba(26,115,232,0.08)",
          "primary-muted": "rgba(26,115,232,0.04)",
          // Secondary — Google Teal/Cyan
          secondary: "#00897B",
          "secondary-hover": "#00695C",
          "secondary-subtle": "rgba(0,137,123,0.08)",
          // Text hierarchy
          text: "#202124",
          "text-secondary": "#5F6368",
          "text-muted": "#9AA0A6",
          "text-placeholder": "#BDC1C6",
          // Semantic
          success: "#188038",
          "success-hover": "#137333",
          "success-subtle": "rgba(24,128,56,0.08)",
          warning: "#E37400",
          "warning-subtle": "rgba(227,116,0,0.08)",
          error: "#D93025",
          "error-hover": "#B31412",
          "error-subtle": "rgba(217,48,37,0.08)",
          // Accent
          purple: "#7B1FA2",
          "purple-subtle": "rgba(123,31,162,0.08)",
          orange: "#E8710A",
          "orange-subtle": "rgba(232,113,10,0.08)",
          // Google accent tones
          "blue-light": "#E8F0FE",
          "green-light": "#E6F4EA",
          "yellow-light": "#FEF7E0",
          "red-light": "#FCE8E6",
        },
      },
      fontFamily: {
        sans: [
          "Lato",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        "3xl": ["1.75rem", "2.25rem"],
        "4xl": ["2.25rem", "2.75rem"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.07), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
        "elevation-1": "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
        "elevation-2": "0 3px 6px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
        "elevation-3": "0 10px 20px rgba(0,0,0,0.08), 0 3px 6px rgba(0,0,0,0.04)",
        glow: "0 0 24px rgba(26,115,232,0.12)",
        "glow-sm": "0 0 12px rgba(26,115,232,0.08)",
        ring: "0 0 0 3px rgba(26,115,232,0.15)",
      },
      spacing: {
        13: "3.25rem",
        15: "3.75rem",
        18: "4.5rem",
        22: "5.5rem",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        decelerate: "cubic-bezier(0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out both",
        "fade-in-fast": "fadeIn 0.15s ease-out both",
        "slide-up": "slideUp 0.25s ease-out both",
        "slide-down": "slideDown 0.25s ease-out both",
        "slide-in-left": "slideInLeft 0.25s ease-out both",
        "slide-in-right": "slideInRight 0.25s ease-out both",
        pulse: "pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        spin: "spin 0.9s linear infinite",
        "bounce-dot": "bounceDot 1.2s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        "scale-in": "scaleIn 0.18s ease-out both",
        float: "float 3s ease-in-out infinite",
        "typing-dot": "typingDot 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        bounceDot: {
          "0%, 80%, 100%": { transform: "scale(0.8)", opacity: "0.5" },
          "40%": { transform: "scale(1.1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        typingDot: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.3" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
