export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#172033',
        steel: '#475569',
        mint: '#14b8a6',
        saffron: '#f59e0b'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.10)'
      }
    }
  },
  plugins: []
};
