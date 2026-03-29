/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--bg-color)',
          text: 'var(--text-color)',
          primary: 'var(--primary-color)',
          success: 'var(--success-color)',
          danger: 'var(--danger-color)',
        },
        card: {
          bg: 'var(--card-bg)',
          border: 'var(--card-border)',
          hover: 'var(--card-hover)',
        },
        header: {
          bg: 'var(--header-bg)',
          text: 'var(--header-text)',
        },
        btn: {
          bg: 'var(--btn-bg)',
          text: 'var(--btn-text)',
        },
        modal: {
          bg: 'var(--modal-bg)',
          text: 'var(--modal-text)',
        },
        option: {
          bg: 'var(--option-bg)',
          text: 'var(--option-text)',
        },
        msg: {
          bg: 'var(--msg-bg)',
          text: 'var(--msg-text)',
        }
      },
      boxShadow: {
        'modal': '0 24px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
        'toast': '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        'toast-dark': '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        'btn': '0 2px 4px rgba(var(--primary-color-rgb), 0.2)',
        'btn-hover': '0 4px 12px rgba(var(--primary-color-rgb), 0.3)',
        'card': '0 2px 12px rgba(0,0,0,0.05)',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(var(--primary-color-rgb), 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(var(--primary-color-rgb), 0.8)' },
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
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
