const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Regresion del 2026-09-07: la categoria JERSEYS no mostraba NINGUNA talla en
// la tienda. `jersey` usa un alias hacia `uniformes` y el resolvedor solo sabia
// resolver una de las dos formas de escribirlo. El cliente que entraba a
// Jerseys veia la fila de tallas vacia.
//
// Este archivo NO reimplementa la resolucion: extrae la funcion REAL de
// main.js. Si alguien vuelve a romper el alias, esto se pone rojo.
const fs = require('fs');
const path = require('path');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

// Extrae `const NOMBRE = ...;` completo. A diferencia de un regex hasta el
// primer `;`, este respeta comentarios y strings: el comentario de CALZADO_US_EU
// tiene un `;` adentro ("...dice 45; 12-US...") y un regex simple cortaba ahi.
function extractConstStatement(source, name) {
  const decl = 'const ' + name + ' =';
  const start = source.indexOf(decl);
  if (start === -1) throw new Error('No se encontro la constante ' + name + ' en main.js');

  let depth = 0;
  let i = start + decl.length;

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (c === '/' && next === '/') {
      const eol = source.indexOf('\n', i);
      if (eol === -1) break;
      i = eol;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i);
      if (end === -1) break;
      i = end + 2;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      i++;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ';' && depth === 0) return source.slice(start, i + 1);
    i++;
  }
  throw new Error('La declaracion de ' + name + ' no cierra en main.js');
}

function extractFunction(source, name) {
  const start = source.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('No se encontro la funcion ' + name + ' en main.js');

  let depth = 0;
  let started = false;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') { depth++; started = true; }
    else if (source[i] === '}') {
      depth--;
      if (started && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error('Llaves sin cerrar en ' + name);
}

// Todo en UN solo eval, igual que size-filter.test.js: cada eval() crea su
// propio scope. Los `const` de nivel superior pasan a `var` para que queden
// visibles entre si.
const extracted = [
  extractConstStatement(mainSource, 'CALZADO_US_EU'),
  extractConstStatement(mainSource, 'CALZADO_CHIPS'),
  extractConstStatement(mainSource, 'sizeMap'),
  extractConstStatement(mainSource, 'MAX_SALTOS_ALIAS'),
  extractFunction(mainSource, 'resolveSizeChips')
].join('\n\n').replace(/^const /gm, 'var ');

eval(extracted);

const EDADES = ['adulto', 'nino'];

describe('resolveSizeChips — alias de tallas', () => {
  it('JERSEYS devuelve tallas, no un string de alias', () => {
    // El bug exacto: devolvia 'uniformes' (string) en vez del array de tallas.
    const adulto = resolveSizeChips('jersey', 'adulto');
    assert.ok(Array.isArray(adulto), 'jersey/adulto tiene que devolver un array');
    assert.ok(adulto.length > 0, 'jersey/adulto no puede venir vacio');

    const nino = resolveSizeChips('jersey', 'nino');
    assert.ok(Array.isArray(nino), 'jersey/nino tiene que devolver un array');
    assert.ok(nino.length > 0, 'jersey/nino no puede venir vacio');
  });

  it('JERSEYS filtra por los MISMOS valores que UNIFORMES', () => {
    // Lo que filtra es el `value` (va al `data-size` del chip). Tiene que seguir
    // siendo identico al de uniformes: si se separaran, un jersey cargado como
    // "M" dejaria de aparecer al marcar M.
    for (const edad of EDADES) {
      assert.deepEqual(
        resolveSizeChips('jersey', edad).map((t) => t.value),
        resolveSizeChips('uniformes', edad).map((t) => t.value),
        'jersey/' + edad + ' tiene que filtrar igual que uniformes/' + edad
      );
    }
  });

  it('JERSEYS NO muestra la talla de pantalon', () => {
    // El bug que reporto Seven el 2026-09-08: los chips de la categoria JERSEYS
    // decian "S/30", "M/32". Ese numero es la talla del PANTALON y viene de que
    // jersey era un alias de uniformes, que es el kit completo. Un jersey solo
    // no tiene talla de pantalon.
    for (const edad of EDADES) {
      for (const talla of resolveSizeChips('jersey', edad)) {
        assert.ok(
          !/\d/.test(talla.label),
          'la etiqueta de jersey/' + edad + ' no puede tener numeros: "' + talla.label + '"'
        );
        assert.equal(
          talla.label,
          talla.value,
          'en jersey la etiqueta es la letra sola: "' + talla.label + '" vs "' + talla.value + '"'
        );
      }
    }
  });

  it('UNIFORMES SI muestra los dos tallajes', () => {
    // El complemento del anterior: el kit es jersey + pantalon, y ahi el numero
    // es informacion que el comprador necesita. Sacarlo de los dos lados seria
    // cambiar un bug por otro.
    const etiquetas = resolveSizeChips('uniformes', 'adulto').map((t) => t.label);
    assert.ok(
      etiquetas.every((l) => /\//.test(l)),
      'uniformes/adulto tiene que seguir mostrando letra/numero: ' + JSON.stringify(etiquetas)
    );
  });

  it('NINGUNA categoria del mapa se queda sin tallas', () => {
    // Este es el que ataja el proximo bug, no el de hoy: cualquier categoria
    // nueva o alias mal escrito cae aca antes de llegar a la tienda.
    for (const cat of Object.keys(sizeMap)) {
      for (const edad of EDADES) {
        const tallas = resolveSizeChips(cat, edad);
        assert.ok(
          Array.isArray(tallas) && tallas.length > 0,
          'La categoria "' + cat + '" no devuelve tallas para "' + edad + '"'
        );
      }
    }
  });

  it('cada chip tiene value y label', () => {
    for (const cat of Object.keys(sizeMap)) {
      for (const edad of EDADES) {
        for (const chip of resolveSizeChips(cat, edad)) {
          assert.equal(typeof chip.value, 'string', cat + '/' + edad + ': chip sin value');
          assert.equal(typeof chip.label, 'string', cat + '/' + edad + ': chip sin label');
        }
      }
    }
  });

  it('una categoria que no existe devuelve null, no explota', () => {
    assert.equal(resolveSizeChips('categoria-inventada', 'adulto'), null);
  });
});
