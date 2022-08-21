import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import generateSitemap from 'vite-ssg-sitemap'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import Components from 'unplugin-vue-components/vite'
import { HeadlessUiResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import { VitePWA } from 'vite-plugin-pwa'
import Markdown from 'vite-plugin-vue-markdown'
import Prism from 'markdown-it-prism'
import LinkAttributes from 'markdown-it-link-attributes'
import string from 'string'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  return {
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
      },
    },

    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_CURATED_ENDPOINT,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    plugins: [
      vue({
        include: [/\.vue$/, /\.md$/],
        reactivityTransform: true,
      }),

      // https://github.com/hannoeru/vite-plugin-pages
      Pages({
        extensions: ['vue', 'md'],
        dirs: [
          { dir: 'src/pages', baseRoute: '' },
          { dir: 'docs/cheatsheet', baseRoute: 'cheatsheet' },
          { dir: 'docs/builtin', baseRoute: 'builtin' },
          { dir: 'docs/modules', baseRoute: 'modules' },
          { dir: 'docs/blog', baseRoute: 'blog' },
        ],
      }),

      // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
      Layouts(),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/head', '@vueuse/core'],
        dts: 'src/auto-imports.d.ts',
        dirs: ['src/composables', 'src/store'],
        vueTemplate: true,
        eslintrc: {
          enabled: true,
        },
      }),

      // https://github.com/antfu/unplugin-vue-components
      Components({
        // allow auto load markdown components under `./src/components/`
        dirs: ['src/components'],
        extensions: ['vue', 'md'],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        dts: 'src/components.d.ts',

        resolvers: [HeadlessUiResolver()],
      }),

      // https://github.com/antfu/vite-plugin-vue-markdown
      // https://prismjs.com/
      Markdown({
        headEnabled: true,
        markdownItSetup(md) {
          md.use(require('markdown-it-anchor'), {
            slugify: (s: string) => string(s).slugify().toString(),
          })
          md.use(Prism, {})
          md.use(LinkAttributes, {
            matcher: (link: string) => /^https?:\/\//.test(link),
            attrs: {
              target: '_blank',
              rel: 'noopener',
            },
          })
        },
      }),

      // https://github.com/antfu/vite-plugin-pwa
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'safari-pinned-tab.svg'],
        manifest: {
          name: 'Python Cheatsheet',
          short_name: 'Python Cheatsheet',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],

    // https://github.com/antfu/vite-ssg
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
      format: 'cjs',
      onFinished() {
        const hostname = `https://${process.env.VITE_BASE_URL}`
        generateSitemap({
          hostname,
        })
      },
    },

    // https://github.com/vitest-dev/vitest
    test: {
      environment: 'jsdom',
      deps: {
        inline: ['@vue', '@vueuse'],
      },
    },

    ssr: {
      // TODO: workaround until they support native ESM
      noExternal: ['workbox-window'],
    },
  }
})
