/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary-bg': '#0f172a',
                'secondary-bg': '#1e293b',
                'card-bg': '#334155',
                'text-primary': '#f8fafc',
                'text-secondary': '#cbd5e1',
                'accent-blue': '#3b82f6',
                'accent-indigo': '#6366f1',
            },
        },
    },
    plugins: [],
}
