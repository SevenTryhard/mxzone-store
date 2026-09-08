const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// LO QUE PROTEGE ESTE ARCHIVO
//
// La regla nueva del 2026-09-08: "si existe un producto en una talla, esa talla
// tiene chip; y si no existe, no lo tiene". Antes los chips salian de una lista
// escrita a mano y el catalogo no opinaba, asi que habia productos con stock
// imposibles de encontrar filtrando —11 de 13 GORRAS, medido en produccion— y
// chips que no encontraban nada nunca.
//
// El invariante que importa esta al final: NINGUN producto con talla puede
// quedar sin al menos un chip que lo encuentre. Si algun dia alguien "ordena" la
// lista de chips y deja un producto afuera, esto se pone rojo.

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

const COMILLAS = ["'", '"', '`'];

function saltarRuido(source, i) {
  const c = source[i];
  const next = source[i + 1];
  if (c === '/' && next === '/') {
    const eol = source.indexOf('\n', i);
    return eol === -1 ? source.length : eol;
  }
  if (c === '/' && next === '*') {
    const end = source.indexOf('*/', i);
    return end === -1 ? source.length : end + 2;
  }
  if (COMILLAS.indexOf(c) !== -1) {
    let j = i + 1;
    while (j < source.length && source[j] !== c) {
      if (source[j] === '\\') j++;
      j++;
    }
    return j + 1;
  }
  return -1;
}

function extractFunction(source, name) {
  const start = source.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('No se encontro la funcion ' + name);
  let i = source.indexOf('{', start);
  let depth = 0;
  while (i < source.length) {
    const salto = saltarRuido(source, i);
    if (salto !== -1) { i = salto; continue; }
    if (source[i] === '{') depth++;
    else if (source[i] === '}') { depth--; if (depth === 0) { i++; break; } }
    i++;
  }
  return source.slice(start, i);
}

function extractConst(source, name) {
  const decl = 'const ' + name + ' =';
  const start = source.indexOf(decl);
  if (start === -1) throw new Error('No se encontro la constante ' + name);
  let i = start + decl.length;
  let depth = 0;
  while (i < source.length) {
    const salto = saltarRuido(source, i);
    if (salto !== -1) { i = salto; continue; }
    const c = source[i];
    if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') depth--;
    else if (c === ';' && depth === 0) { i++; break; }
    i++;
  }
  return source.slice(start, i);
}

const codigo = [
  extractConst(mainSource, 'SIZE_BANDS'),
  extractConst(mainSource, 'SIZE_RANK_UNKNOWN'),
  extractConst(mainSource, 'TOKEN_ALIASES'),
  extractFunction(mainSource, 'foldAccents'),
  extractFunction(mainSource, 'getSizeTokenRank'),
  extractFunction(mainSource, 'relacionesDeCompuestos'),
  extractFunction(mainSource, 'esTallaDeNino'),
  extractFunction(mainSource, 'construirChipsDeTalla')
].join('\n\n').replace(/^const /gm, 'var ');

eval(codigo);

const prod = (...tokens) => ({ tokens: tokens });
const valores = (r) => r.chips.map((c) => c.value);

describe('esTallaDeNino — la Y es de youth', () => {
  it('reconoce las tallas de niño', () => {
    for (const t of ['YS', 'YM', 'YL', 'YLG', 'YXL', 'KIDS', 'ylg']) {
      assert.ok(esTallaDeNino(t), t + ' tendria que ser de niño');
    }
  });

  it('no confunde las de adulto', () => {
    for (const t of ['S', 'M', 'L', 'XL', 'XXL', '10', '38']) {
      assert.ok(!esTallaDeNino(t), t + ' NO es de niño');
    }
  });

  it('la talla compuesta entera tambien: "26-YL" es de niño', () => {
    // 🔴 REGRESION DEL 2026-09-08. El compuesto no empieza con Y, asi que caia
    // del lado ADULTO. Resultado: UNIFORMES NIÑOS se quedaba con el filtro de
    // tallas COMPLETAMENTE VACIO, porque en adulto solo quedaban los compuestos
    // y esos no se muestran como chip.
    for (const t of ['26-YL', '28-YXL', '22-YM']) {
      assert.ok(esTallaDeNino(t), t + ' es de niño');
    }
    assert.ok(!esTallaDeNino('30-S'), '30-S es de adulto');
    assert.ok(!esTallaDeNino('10-US'), '10-US es un calzado de adulto, el US es la unidad');
  });
});

describe('construirChipsDeTalla — el catalogo manda', () => {
  it('sin ninguna talla cargada avisa y no inventa chips', () => {
    // GAFAS: 20 productos, todos "Consultar", que no deja ningun token.
    const r = construirChipsDeTalla([prod(), prod(), prod()], [{ value: 'Unica', label: 'Unica' }], TOKEN_ALIASES);
    assert.equal(r.sinTallaje, true);
    assert.deepEqual(r.chips, []);
  });

  it('una talla que el mapa NO conocia igual tiene chip', () => {
    // El bug de los guantes XXL, en una linea.
    const r = construirChipsDeTalla([prod('S'), prod('XXL')], [{ value: 'S', label: 'S' }], TOKEN_ALIASES);
    assert.ok(valores(r).indexOf('XXL') !== -1, 'falta XXL: ' + JSON.stringify(valores(r)));
  });

  it('una talla del mapa que NADIE tiene no aparece', () => {
    // Los chips muertos: prometian una talla que el catalogo no tenia.
    const mapa = [{ value: 'S', label: 'S' }, { value: 'XS', label: 'XS' }];
    const r = construirChipsDeTalla([prod('S')], mapa, TOKEN_ALIASES);
    assert.deepEqual(valores(r), ['S']);
  });

  it('GORRAS: SM y L/XL dan S, M, L, XL — no un chip inutil', () => {
    // El caso real: 11 de 13 gorras eran inencontrables porque el unico chip
    // era "Unica" y estan cargadas "SM".
    const gorras = [prod('SM', 'S', 'M'), prod('SM', 'S', 'M'), prod('LXL', 'L', 'XL')];
    const r = construirChipsDeTalla(gorras, [{ value: 'Unica', label: 'Unica' }], TOKEN_ALIASES);
    assert.deepEqual(valores(r), ['S', 'M', 'L', 'XL']);
  });

  it('UNIFORMES: se ve la letra, no el numero del pantalon', () => {
    const unis = [prod('30-S', '30', 'S'), prod('32-M', '32', 'M')];
    const mapa = [{ value: 'S', label: 'S/30' }, { value: 'M', label: 'M/32' }];
    const r = construirChipsDeTalla(unis, mapa, TOKEN_ALIASES);
    assert.deepEqual(valores(r), ['S', 'M']);
    assert.deepEqual(r.chips.map((c) => c.label), ['S/30', 'M/32'], 'el mapa tiene que seguir poniendo la etiqueta');
  });

  it('BOTAS: los numeros SI son la talla y se conservan', () => {
    // Aca no hay letra que los reemplace, asi que sacarlos dejaria la categoria
    // sin filtro. Es la diferencia con uniformes.
    const botas = [prod('10-US', '10'), prod('11-US', '11')];
    const mapa = [{ value: '10', label: '10' }, { value: '11', label: '11' }];
    const r = construirChipsDeTalla(botas, mapa, TOKEN_ALIASES);
    assert.deepEqual(valores(r), ['10', '11']);
  });

  it('un numero suelto se conserva si es lo unico que tiene un producto', () => {
    // Caso real de UNIFORMES NIÑOS: dos productos cargados "26" a secas. Si se
    // sacara el chip "26" por "redundante", esos dos desaparecen del filtro.
    const items = [prod('26-YL', '26', 'YL'), prod('26')];
    const r = construirChipsDeTalla(items, null, TOKEN_ALIASES);
    assert.ok(valores(r).indexOf('26') !== -1, 'sin el 26 el producto cargado "26" queda invisible');
    assert.ok(valores(r).indexOf('YL') !== -1);
  });

  it('BOTAS: una talla NO desaparece porque su producto se encuentre por otra', () => {
    // 🔴 REGRESION QUE ME COMI EL 2026-09-08, cazada probando la tienda entera.
    //
    // Un solo par de botas esta cargado "7/8/9/10/11/12". Mi primera version
    // sacaba el chip "12" razonando que ese producto ya se encontraba por el
    // "7". Cierto, pero irrelevante: el cliente que calza 12 no puede filtrar su
    // talla. Un PRODUCTO encontrable no es lo mismo que una TALLA encontrable.
    const botas = [prod('7', '8', '9', '10', '11', '12'), prod('10-US', '10')];
    const r = construirChipsDeTalla(botas, null, TOKEN_ALIASES);
    assert.deepEqual(valores(r), ['7', '8', '9', '10', '11', '12']);
  });

  it('un numero solo se saca si su pareja compuesta ya es chip', () => {
    // La unica razon valida para sacar un numero: que sea la MISMA talla dicha
    // de otra forma. Lo dice el catalogo con el compuesto "30-S", no una tabla.
    const conPareja = construirChipsDeTalla([prod('30-S', '30', 'S')], null, TOKEN_ALIASES);
    assert.deepEqual(valores(conPareja), ['S'], 'el 30 sobra: es la misma talla que la S');

    const sinPareja = construirChipsDeTalla([prod('30'), prod('S')], null, TOKEN_ALIASES);
    assert.ok(valores(sinPareja).indexOf('30') !== -1, 'sin compuesto que los relacione, el 30 es una talla propia');
  });

  it('UNIFORMES NIÑOS: el numero de un compuesto de niño es de niño', () => {
    // 🔴 LA OTRA REGRESION DEL MISMO DIA. El "26" de "26-YL" no empieza con Y,
    // asi que caia del lado ADULTO: la categoria mostraba "22 24 26 28" en
    // adulto y las tallas de niño de verdad no aparecian en ningun lado.
    const items = [prod('26-YL', '26', 'YL'), prod('28-YXL', '28', 'YXL')];
    const rel = relacionesDeCompuestos(items);
    assert.ok(esTallaDeNino('26', rel), 'el 26 de "26-YL" es de niño');
    assert.ok(esTallaDeNino('28', rel), 'el 28 de "28-YXL" es de niño');
    assert.ok(!esTallaDeNino('30', relacionesDeCompuestos([prod('30-S', '30', 'S')])), 'el 30 de "30-S" NO es de niño');
  });

  it('las tallas salen en orden de escala: niño, letras, numeros', () => {
    const items = [prod('XL'), prod('S'), prod('YM'), prod('M'), prod('42')];
    const r = construirChipsDeTalla(items, null, TOKEN_ALIASES);
    assert.deepEqual(valores(r), ['YM', 'S', 'M', 'XL', '42']);
  });

  it('EL INVARIANTE: ningun producto con talla queda sin chip', () => {
    // Esta es la prueba que importa. Cualquier cambio futuro en como se arma la
    // lista de chips tiene que seguir cumpliendo esto.
    const catalogos = [
      [prod('SM', 'S', 'M'), prod('LXL', 'L', 'XL'), prod('XXL')],
      [prod('30-S', '30', 'S'), prod('38-XXL', '38', 'XXL'), prod('26')],
      [prod('10-US', '10'), prod('7'), prod('12')],
      [prod('YS'), prod('YXL'), prod('M')],
      [prod('GRANDE'), prod('S')]
    ];
    for (const catalogo of catalogos) {
      const r = construirChipsDeTalla(catalogo, null, TOKEN_ALIASES);
      const disponibles = valores(r);
      catalogo.forEach((p, i) => {
        if (!p.tokens.length) return;
        assert.ok(
          p.tokens.some((t) => disponibles.indexOf(t) !== -1),
          'producto ' + i + ' [' + p.tokens.join('/') + '] no lo encuentra ningun chip de ' + JSON.stringify(disponibles)
        );
      });
    }
  });
});
