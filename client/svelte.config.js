import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/kit/vite'
import { windi } from 'svelte-windicss-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [vitePreprocess(), windi({})],

  kit: {
    adapter: adapter(),
  },

  vitePlugin: {
    experimental: {
      inspector: true,
    },
  },
}

export default config
