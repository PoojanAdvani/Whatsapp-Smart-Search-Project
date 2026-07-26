/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        wa: {
          teal: '#008069',      // header / accents
          tealDark: '#075e54',
          green: '#25d366',      // brand green
          bubbleOut: '#d9fdd3',  // outgoing bubble
          bubbleIn: '#ffffff',   // incoming bubble
          panel: '#f0f2f5',      // left panel / header bg
          chatBg: '#efeae2',     // chat wallpaper base
          hover: '#f5f6f6',
          border: '#e9edef',
          ink: '#111b21',        // primary text
          muted: '#667781',      // secondary text
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
