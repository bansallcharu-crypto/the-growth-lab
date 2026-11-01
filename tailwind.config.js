/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pop Art & Living Scrapbook Custom Palette
        pop: {
          blue: {
            DEFAULT: '#2563EB',
            light: '#60A5FA',
            dark: '#1D4ED8',
            deep: '#1E40AF',
            soft: '#EFF6FF',
          },
          pink: {
            DEFAULT: '#F43F5E',
            light: '#FB7185',
            dark: '#E11D48',
            deep: '#9F1239',
            soft: '#FFF1F2',
          },
          yellow: {
            DEFAULT: '#FACC15',
            light: '#FDE047',
            dark: '#EAB308',
            deep: '#CA8A04',
            soft: '#FEFCE8',
          },
          cyan: {
            DEFAULT: '#06B6D4',
            light: '#22D3EE',
            dark: '#0891B2',
            deep: '#0E7490',
            soft: '#ECFEFF',
          },
          lime: {
            DEFAULT: '#84CC16',
            light: '#A3E635',
            dark: '#65A30D',
            deep: '#4D7C0F',
            soft: '#F7FEE7',
          },
        },
        cream: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
        },
        // Bold Pop Academy Electric/Cobalt Blue (Primary)
        // Aliased to coral to seamlessly update all existing buttons, badges, and focus rings!
        coral: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB', // Saturated Electric Blue
          600: '#1D4ED8', // Deep Cobalt
          700: '#1E40AF', // Royal Studio Navy
          800: '#1E3A8A',
          900: '#0F2468',
        },
        // Explicit cobalt color namespace
        cobalt: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#0F2468',
        },
        // Pop Citron & Canary Sunshine Accents
        honey: {
          50: '#FFFDF0',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },
        // Growth Emerald & Mint
        sage: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },
        // Live Voice & Recording Red
        flame: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        // Editorial Slate & Ink
        ink: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03)',
        'soft-md': '0 8px 24px -4px rgba(37, 99, 235, 0.08), 0 2px 8px -1px rgba(15, 23, 42, 0.04)',
        'soft-lg': '0 16px 36px -6px rgba(37, 99, 235, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
        'glow-cobalt': '0 0 24px -2px rgba(37, 99, 235, 0.35)',
        'tactile': '0 4px 0 0 rgba(29, 78, 216, 0.15)',
        'pop': '4px 4px 0px #0F172A',
        'pop-sm': '2px 2px 0px #0F172A',
        'pop-blue': '4px 4px 0px #1E40AF',
        'pop-pink': '4px 4px 0px #9F1239',
        'pop-yellow': '4px 4px 0px #A16207',
        'scrapbook': '0 12px 30px -8px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
        'paper': '0 2px 6px -1px rgba(15, 23, 42, 0.08), 0 10px 20px -3px rgba(15, 23, 42, 0.05)',
        'paper-lift': '0 16px 32px -4px rgba(15, 23, 42, 0.14), 0 8px 16px -4px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
