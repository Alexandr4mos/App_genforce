/** @type {import('workbox-build').GenerateSWOptions} */
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,css,html,png,ico,json,svg,woff,woff2,ttf,map}'],
  swDest: 'dist/sw.js',
  // Hash do conteúdo versiona o precache — deploy novo invalida o antigo.
  dontCacheBustURLsMatching: /\.\w{8}\./,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  navigateFallback: '/index.html',
  navigateFallbackAllowlist: [/^(?!\/__).*/],
  runtimeCaching: [
    {
      // HTML / navegação: prioriza rede (deploy fresco); cai no cache se offline.
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'genforce-pages',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 16, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // Bundles JS/CSS: stale-while-revalidate (rápido + atualiza em segundo plano).
      urlPattern: ({ request }) =>
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'worker',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'genforce-assets',
        expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'genforce-images',
        expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // API Supabase / auth: nunca cachear respostas autenticadas.
      urlPattern: ({ url }) =>
        url.hostname.endsWith('supabase.co') || url.pathname.startsWith('/auth'),
      handler: 'NetworkOnly',
    },
  ],
};
