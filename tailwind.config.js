/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./tools/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./tools/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "rgb(var(--primary) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
          chat: "rgb(var(--chat-primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "oklch(var(--success) / <alpha-value>)",
          foreground: "oklch(0.985 0 0)",
        }
      },
      boxShadow: {
        'modal': '0 24px 48px rgba(0,0,0,var(--shadow-strong)), 0 8px 16px rgba(0,0,0,var(--shadow-medium))',
        'toast': '0 8px 24px rgba(0,0,0,var(--shadow-strong)), 0 2px 8px rgba(0,0,0,var(--shadow-medium))',
        'toast-dark': '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        'btn': 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0, 0, 0, var(--shadow-light))',
        'btn-hover': 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0, 0, 0, var(--shadow-strong))',
        'card': '0 2px 12px rgba(0,0,0,var(--shadow-light))',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'music': '0 0 12px rgb(var(--primary) / 0.4)',
      },
      borderWidth: {
        'medium': '2px',
        'thick': '4px',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '2000ms',
        'slower': '3000ms',
        'slowest': '5000ms',
      },
      transitionTimingFunction: {
        'modal': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'sidebar': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.98) translateY(20px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 0, 0, var(--shadow-strong))' },
          '50%': { boxShadow: '0 0 40px rgba(0, 0, 0, calc(var(--shadow-strong) * 2))' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.8' },
        },
        'scroll-bg': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(50%)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'fade-in-fast': 'fade-in 0.15s ease-in-out',
        'zoom-in': 'zoom-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'bounce': 'bounce 2s infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'scroll-bg': 'scroll-bg 20s linear infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            pre: {
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflowX: 'hidden',
              marginTop: '0',
              marginBottom: '0'
            },
            code: {
              wordBreak: 'break-word'
            },
            'pre code': {
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              display: 'block'
            },
            'p:first-child, div:first-child': {
              marginTop: '0'
            },
            '.katex-display': {
              overflowX: 'hidden',
              overflowY: 'hidden',
              whiteSpace: 'normal',
              wordBreak: 'break-all',
              marginLeft: '0',
              marginRight: '0'
            },
            '.katex-display > .katex': {
              whiteSpace: 'normal',
              wordBreak: 'break-all'
            }
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-dynamic)', 'var(--font-zh)'],
        en: ['var(--font-en)', 'var(--font-zh)'],
        zh: ['var(--font-zh)'],
        mono: ['var(--font-dynamic-code)', 'var(--font-zh)'],
        story: ['var(--story-font-family)', 'var(--font-zh)'],
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
}
