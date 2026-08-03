/**
 * Entrypoint de CLOUDFLARE WORKERS -> https://mxzonestore.motocross.workers.dev
 *
 * OJO: este NO es el dominio que usa la gente. www.mxzonestore.com se sirve
 * desde Cloudflare PAGES y su entrypoint es `functions/product.js`. Los dos
 * comparten toda la logica en `worker/og-product.js`; esto es solo el cascaron
 * que Workers necesita.
 *
 * Se deploya con `node deploy.js`. El worker corre unicamente en /product y
 * /product.html — lo acota `assets.run_worker_first` en wrangler.jsonc.
 */

import { handleProductRequest, isProductPath } from './og-product.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // run_worker_first ya deberia acotar esto, pero el worker no confia en la
    // config: si alguien la afloja, aca seguimos sirviendo assets y nada mas.
    if (!isProductPath(url.pathname)) return env.ASSETS.fetch(request);

    return handleProductRequest(
      request,
      () => env.ASSETS.fetch(request),
      (p) => ctx.waitUntil(p)
    );
  },
};
