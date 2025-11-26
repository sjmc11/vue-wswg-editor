/** @type {import('tailwindcss').Config} */
export default {
   content: [
      "./index.html",
      "./src/**/*.{vue,js,ts,jsx,tsx}",
      // Explicitly include component files
      "./src/components/**/*.vue",
   ],
   theme: {
      extend: {},
   },
   plugins: [],
};
