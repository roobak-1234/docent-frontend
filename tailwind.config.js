/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                lifelink: {
                    primary: '#66BB6A', // Mint Green
                    secondary: '#64B5F6', // Soft Blue
                    bg: '#FAFAFA', // Off White
                    card: '#E8F5E9', // Pale Mint
                    text: '#37474F', // Charcoal
                    warning: '#FFA726', // Soft Orange
                },
                docent: {
                    primary: '#66BB6A',
                    secondary: '#64B5F6',
                    bg: '#FAFAFA',
                    card: '#E8F5E9',
                    text: '#37474F',
                    warning: '#FFA726',
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'pulse-slow': 'pulse 3s infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
