/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Activation manuelle du Medical Dark Mode
  theme: {
    extend: {
      colors: {
        // Couleurs Sémantiques Strictes (Gris-Bleu profond pour reposer la rétine)
        medical: {
          dark: '#0f172a', // slate-900 (Fond nuit clinique, pas de noir pur)
          surface: '#1e293b', // slate-800 (Cartes, accordéons)
          border: '#334155', // slate-700
          text: '#cbd5e1', // slate-300 (Gris doux pour la lecture)
          primary: '#3b82f6', // blue-500 (Boutons normaux)
          danger: '#ef4444', // red-500 (Réservé aux urgences/interactions !!)
        }
      },
      fontFamily: {
        // Typographie Système Ultra-Légère (Pas de Google Fonts)
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
