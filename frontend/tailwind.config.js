export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"','system-ui','sans-serif'],
        body:    ['"DM Sans"','system-ui','sans-serif'],
      },
      colors: {
        brand: { DEFAULT:'#2563eb', light:'#eff6ff', dark:'#1d4ed8', mid:'#3b82f6' },
      },
    },
  },
  plugins: [],
};
