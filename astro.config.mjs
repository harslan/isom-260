// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Students naturally truncate asset URLs like /session-02/slides.html to
// /session-02/ — send those to the real session pages instead of a 404.
const sessionRedirects = Object.fromEntries(
  Array.from({ length: 13 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return [`/session-${n}`, `/sessions/session-${n}`];
  })
);

export default defineConfig({
  output: 'static',
  site: 'https://isom-260.vercel.app',
  redirects: sessionRedirects,
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: vercel()
});
