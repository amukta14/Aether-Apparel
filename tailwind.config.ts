import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // If you have a pages directory
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pastel-blue': 'var(--pastel-blue)',
        'pastel-purple': 'var(--pastel-purple)',
        'pastel-blue-light': 'var(--pastel-blue-light)',
        'custom-button-blue': '#678b91',
      },
      // You can extend your theme here, for example:
      // backgroundImage: {
      //   'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      //   'gradient-conic':
      //     'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      // },
      // colors: {
      //   primary: '#yourprimarycolor',
      //   secondary: '#yoursecondarycolor',
      // },
    },
  },
  plugins: [
    // You can add Tailwind plugins here, e.g., require('@tailwindcss/forms')
  ],
};

export default config; 