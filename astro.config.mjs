import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://evintkoo.github.io',
  output: 'static',
  integrations: [mdx()],
});
