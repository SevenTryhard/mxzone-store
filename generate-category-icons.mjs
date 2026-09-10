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
  return `.category-chip[data-category="${slug}"]::before,\n.category-icon[data-category="${slug}"] {\n  -webkit-mask-image: ${u};\n          mask-image: ${u};\n}`;
}).join('\n\n');

const INICIO = '/* >>> ICONOS-CATEGORIA-INICIO (generado por generate-category-icons.mjs) */';
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
${FIN}
`;

let css = fs.readFileSync(FILE, 'utf8');

// Idempotente: si ya hay un bloque generado, se reemplaza en vez de
// apilar otro debajo. Correr el generador dos veces no puede dejar la
// hoja con dos versiones del mismo icono.
const i = css.indexOf(INICIO);
const f = css.indexOf(FIN);
if (i !== -1 && f !== -1) {
  css = css.slice(0, i).replace(/\s+$/, '\n') + css.slice(f + FIN.length);
  console.log('bloque anterior encontrado y reemplazado');
}

fs.writeFileSync(FILE, css + bloque);
console.log(`OK — ${Object.keys(ICONOS).length} iconos escritos`);
