import fs from 'node:fs';

const FILE = 'C:/Users/seven/MXZONESTORE-LANDING/mxzone-store-main/css/styles.css';

// Un solo trazo, un solo grosor, la misma grilla de 24. Es lo que hace
// que ocho dibujos distintos se lean como una familia.
const ICONOS = {
  cascos:       `<path d="M3 14a9 9 0 0 1 18 0v2H8.5A5.5 5.5 0 0 1 3 10.5Z"/><path d="M3 16h18"/><path d="M12 5v9"/>`,
  uniformes:    `<path d="M12 5.5a2 2 0 1 1 2 2c-1.1 0-2 .9-2 2v.5"/><path d="M12 10 3.6 16.4A1 1 0 0 0 4.2 18h15.6a1 1 0 0 0 .6-1.6L12 10Z"/>`,
  botas:        `<path d="M8 3h4v9l7 4v5H8Z"/><path d="M8 8h4"/>`,
  jersey:       `<path d="M9 4 4 6.5 6 11l2-1v10h8V10l2 1 2-4.5L15 4a3 3 0 0 1-6 0Z"/>`,
  guantes:      `<path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V12m0 0V4.8a1.5 1.5 0 0 1 3 0V12m0 0V6.5a1.5 1.5 0 0 1 3 0V13a8 8 0 0 1-8 8 5 5 0 0 1-4-8l1-1.5"/>`,
  gafas:        `<path d="M3 9h18v4a4 4 0 0 1-4 4h-1l-2-3h-4l-2 3H7a4 4 0 0 1-4-4Z"/><path d="M6 9V7h12v2"/>`,
  protecciones: `<path d="M12 3l7 3v5.5c0 4.3-2.9 7.8-7 9.5-4.1-1.7-7-5.2-7-9.5V6Z"/>`,
  gorras:       `<path d="M4 15a8 8 0 0 1 16 0Z"/><path d="M20 15h1.5a1.75 1.75 0 0 1 0 3.5H13"/>`,
  maletas:      `<path d="M6 9.5a6 6 0 0 1 12 0V20H6Z"/><path d="M9 20v-5.5h6V20"/><path d="M9 9.5V7.5a3 3 0 0 1 6 0v2"/>`,
  accesorios:   `<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>`,
  ninos:        `<circle cx="12" cy="5" r="2.5"/><path d="M8.5 21v-5H7l1.9-5.2A2 2 0 0 1 10.8 9.5h2.4a2 2 0 0 1 1.9 1.3L17 16h-1.5v5"/>`,
  // "Todos" no es una categoria de producto, es un filtro: lleva grilla.
  all:          `<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>`,
};

const uri = (cuerpo) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</svg>`;
  const esc = svg
    .replace(/"/g, "'")
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E');
  return `url("data:image/svg+xml,${esc}")`;
};

// El mismo dibujo sirve para la casilla chica del menu y para el icono
// grande de la tarjeta de categoria. Una definicion, dos tamanos.
const reglas = Object.entries(ICONOS).map(([slug, cuerpo]) => {
  const u = uri(cuerpo);
  // El tercer selector deja usar cualquier categoria como icono suelto
  // (<i class="ico" data-ico="botas">), que es lo que necesita el panel de
  // bienvenida para poner un casco al lado de "Casco".
  return `.category-chip[data-category="${slug}"]::before,\n.category-icon[data-category="${slug}"],\n.ico[data-ico="${slug}"] {\n  -webkit-mask-image: ${u};\n          mask-image: ${u};\n  background-color: currentColor;\n}`;
}).join('\n\n');

// ---------------------------------------------------------------------
// ICONOS DE INTERFAZ
// ---------------------------------------------------------------------
// Los de arriba son las CATEGORIAS de producto. Estos son los de la
// interfaz: el aviso de error de un campo, el medio de pago, los pasos
// de "como funciona", las estadisticas de promociones.
//
// Estaban puestos como emoji del teclado, con dos agravantes sobre el
// caso de las categorias: las limpiezas anteriores dejaron elementos
// VACIOS a medio camino (<span class="stat-icon"></span>), y un paso
// tenia la palabra "WA" escrita como si fuera un dibujo. O sea que la
// pagina no tenia un criterio: tenia tres.
const ICONOS_UI = {
  alerta:    `<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><path d="M12 16.2h.01"/>`,
  pago:      `<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/><path d="M6 14.5h4"/>`,
  caja:      `<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z"/><path d="m3 7.5 9 4.5 9-4.5"/><path d="M12 12v9"/>`,
  whatsapp:  `<path d="M3.5 20.5 5 16.2a8.5 8.5 0 1 1 3.3 3.2Z"/><path d="M9 9.2c0 3 2.4 5.4 5.3 5.4.6 0 1-.4 1-.9v-.7l-1.6-.7-.8 1a5.4 5.4 0 0 1-2.3-2.3l1-.8-.7-1.6h-.8c-.5 0-.9.4-.9 1Z"/>`,
  moto:      `<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5 9 10h5l2.5 6.5"/><path d="M9 10 8 7H6"/><path d="M14 10h4"/>`,
  descuento: `<path d="M3.5 12.8V4.5a1 1 0 0 1 1-1h8.3a1 1 0 0 1 .7.3l6.7 6.7a1 1 0 0 1 0 1.4l-8.3 8.3a1 1 0 0 1-1.4 0L3.8 13.5a1 1 0 0 1-.3-.7Z"/><path d="M8 8h.01"/><path d="m11.5 15 4-4"/>`,
  clientes:  `<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.4a3.2 3.2 0 0 1 0 5.2"/><path d="M18 14.4a6.5 6.5 0 0 1 3.5 5.6"/>`,
  envio:     `<path d="M2.5 6.5h11v10h-11Z"/><path d="M13.5 10h4l4 3.2v3.3h-8Z"/><circle cx="7" cy="18.5" r="2"/><circle cx="17.5" cy="18.5" r="2"/>`,
  explorar:  `<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/>`,
  detalles:  `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path d="M7.8 10.5h5.4"/>`,
  carrito:   `<path d="M2.5 3.5h2.6l2.3 11h10.2"/><path d="M6.4 6.5h14.3l-1.6 6.4H7.7"/><circle cx="9" cy="19" r="1.6"/><circle cx="17.5" cy="19" r="1.6"/>`,
  regla:     `<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M7 8v3"/><path d="M11 8v4.5"/><path d="M15 8v3"/><path d="M19 8v4.5"/>`,
};

const reglasUI = Object.entries(ICONOS_UI).map(([slug, cuerpo]) => {
  const u = uri(cuerpo);
  return `.ico[data-ico="${slug}"] {\n  -webkit-mask-image: ${u};\n          mask-image: ${u};\n  background-color: currentColor;\n}`;
}).join('\n\n');

const INICIO = '/* >>> ICONOS-INICIO (generado por generate-icons.mjs) */';
const FIN = '/* <<< ICONOS-CATEGORIA-FIN */';

const bloque = `

${INICIO}

/* ================================================================
   ICONOS DE CATEGORIA — 2026-09-10
   ================================================================
   Antes cada categoria llevaba un emoji del sistema delante del
   nombre. Tres problemas, no uno:

     1. Cada telefono los dibuja distinto (el casco de Android no es
        el de iPhone), asi que la tienda se veia diferente en cada
        pantalla y no habia forma de controlarlo.
     2. Sus colores —verde, azul, morado— peleaban contra el naranja
        y el negro de la marca.
     3. La lista esta escrita en TRES lugares (la home, el menu
        desplegable y la tienda) y los emojis no coincidian entre si:
        "Uniformes" y "Jerseys" usaban exactamente el mismo.

   La solucion no es cambiar un emoji por otro: es que el icono deje
   de ser TEXTO. Estos son dibujos, definidos UNA sola vez aca, y se
   pintan con mascara para que tomen el color del chip solos —claro
   en reposo, negro cuando esta elegido— sin que nadie tenga que
   mantener una segunda lista de colores en paralelo.

   PARA AGREGAR UNA CATEGORIA: se suma su dibujo al mapa ICONOS del
   generador y se le pone data-category="su-slug" al chip. Nada mas.
   ================================================================ */

.category-chip::before {
  content: '';
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  background-color: currentColor;
  -webkit-mask-position: center;
          mask-position: center;
  -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
  -webkit-mask-size: contain;
          mask-size: contain;
}

/* Un chip cuyo slug no esta en la lista no muestra un cuadrado vacio:
   no muestra nada. Es preferible que falte el icono a que aparezca un
   hueco que el cliente lee como imagen rota. */
.category-chip:not([data-category])::before,
.category-chip[data-category=""]::before { display: none; }

/* La barra lateral de la tienda NO lleva icono, y es a proposito.
   Ahi las casillas van en una grilla de dos columnas donde el nombre
   mas largo ("Protecciones") ya se parte en dos renglones: meterle un
   dibujo de 18px al lado desarma la grilla y vuelve a pasar lo que ese
   bloque arreglo en su momento. El icono es para donde hay aire —el
   menu desplegable y la home—, no para donde no lo hay. */
.category-chips .category-chip::before { display: none; }

/* El icono grande de la tarjeta de categoria. Antes era un emoji de
   5rem al 20% de opacidad detras del titulo; ahora es el mismo dibujo
   de la casilla, en grande, y en naranja apagado. */
.category-icon[data-category] {
  display: block;
  width: 84px;
  height: 84px;
  background-color: var(--orange-primary);
  opacity: 0.22;
  -webkit-mask-position: center;
          mask-position: center;
  -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
  -webkit-mask-size: contain;
          mask-size: contain;
}

${reglas}


/* ----------------------------------------------------------------
   ICONOS DE INTERFAZ
   ----------------------------------------------------------------
   Se usan asi:  <i class="ico" data-ico="alerta" aria-hidden="true"></i>

   Miden 1em y toman el color del texto, o sea que se adaptan solos al
   tamano y al color de donde caigan: en un aviso de error salen rojos y
   chicos, en el encabezado del checkout salen grandes y naranjas, sin
   una sola regla extra. Un emoji no puede hacer eso — tiene sus propios
   colores y su propio tamano, y por eso nunca terminaba de encajar.

   aria-hidden porque son decoracion: al lado siempre hay texto que dice
   lo mismo. Un lector de pantalla que los anuncie repite todo dos veces.
   ---------------------------------------------------------------- */
.ico {
  display: inline-block;
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
  vertical-align: -0.125em;
  /* SIN color de fondo aca. El color lo enciende cada dibujo.
     Si estuviera en la base, un data-ico que no existe —un nombre mal
     escrito, un icono que se borro— pintaria un CUADRADO SOLIDO, porque
     una mascara vacia no recorta nada. Y un cuadrado blanco al lado de
     un texto se lee como que la pagina esta rota. Asi, lo peor que puede
     pasar es que no se vea el icono. */
  -webkit-mask-position: center;
          mask-position: center;
  -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
  -webkit-mask-size: contain;
          mask-size: contain;
}

${reglasUI}

/* Los avisos de error de cada campo del checkout llevaban un emoji de
   advertencia escrito DENTRO del texto, repetido en cinco campos y en
   dos archivos: diez copias del mismo caracter. Ahora el dibujo lo pone
   el CSS una sola vez y el texto vuelve a ser solo texto — que ademas
   es lo que necesita un lector de pantalla para leerlo bien. */
.field-error {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
}

.field-error::before {
  content: '';
  flex: 0 0 auto;
  width: 1em;
  height: 1em;
  background-color: currentColor;
  -webkit-mask: ${uri(ICONOS_UI.alerta)} center / contain no-repeat;
          mask: ${uri(ICONOS_UI.alerta)} center / contain no-repeat;
}
${FIN}
`;

let css = fs.readFileSync(FILE, 'utf8');

// El repo alterna LF y CRLF segun quien lo toco ultimo (git normaliza al
// mergear). Se busca sobre LF y se devuelve el final de linea original,
// porque si no los reemplazos por texto exacto fallan EN SILENCIO: el
// script dice que hizo 0 cambios y no da error.
const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);
const CRLF = css.includes(CR + LF);
if (CRLF) css = css.split(CR + LF).join(LF);

// Idempotente: si ya hay un bloque generado, se reemplaza en vez de
// apilar otro debajo. Correr el generador dos veces no puede dejar la
// hoja con dos versiones del mismo icono.
// Se acepta tambien el marcador viejo (ICONOS-CATEGORIA-INICIO), de
// cuando este generador solo hacia las categorias.
const INICIO_VIEJO = '/* >>> ICONOS-CATEGORIA-INICIO (generado por generate-category-icons.mjs) */';
const i = css.includes(INICIO) ? css.indexOf(INICIO) : css.indexOf(INICIO_VIEJO);
const f = css.indexOf(FIN);
if (i !== -1 && f !== -1) {
  css = css.slice(0, i).replace(/\s+$/, '\n') + css.slice(f + FIN.length);
  console.log('bloque anterior encontrado y reemplazado');
}

const salida = css + bloque;
fs.writeFileSync(FILE, CRLF ? salida.split(LF).join(CR + LF) : salida);
console.log(`OK — ${Object.keys(ICONOS).length} de categoria + ${Object.keys(ICONOS_UI).length} de interfaz`);
