/**
 * Entrypoint de CLOUDFLARE PAGES -> https://www.mxzonestore.com/product
 *
 * ESTE ES EL QUE IMPORTA. www.mxzonestore.com se sirve desde el proyecto de
 * Pages "mxzone-store", que auto-deploya en cada push a `main`. El worker de
 * `worker/index.js` sirve mxzonestore.motocross.workers.dev, que es otra cosa
 * y no la usa ningun cliente. Los dos comparten `worker/og-product.js`.
 *
 * `context.next()` es el equivalente en Pages a `env.ASSETS.fetch(request)`:
 * devuelve el product.html estatico para que lo reescribamos.
 *
 * Pages rutea por nombre de archivo: functions/product.js -> /product. Las URL
 * lindas (/product/:slug) y /product.html caen aca por `_redirects`, y todos
 * los links internos ya apuntan a /product?product=<slug>.
 */

import { handleProductRequest } from '../worker/og-product.js';

export function onRequest(context) {
  return handleProductRequest(
    context.request,
    () => context.next(),
    (p) => context.waitUntil(p)
  );
}
