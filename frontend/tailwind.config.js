/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#f0f4ff',100:'#e0e9ff',200:'#c7d7fe',300:'#a5b8fc',400:'#8193f8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' },
        dark:  { 900:'#050508',800:'#0a0a12',700:'#0f0f1a',600:'#16162a',500:'#1e1e35',400:'#2a2a45',300:'#3a3a5c',200:'#5a5a8a' }
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
      keyframes: {
        wave: { '0%,100%':{ transform:'scaleY(0.3)' }, '50%':{ transform:'scaleY(1)' } },
        ping2: { '0%':{ transform:'scale(1)', opacity:'0.8' }, '100%':{ transform:'scale(2.2)', opacity:'0' } },
      },
      animation: {
        wave: 'wave 1.2s ease-in-out infinite',
        ping2: 'ping2 1.5s ease-out infinite',
      }
    }
  },
  plugins: []
}
