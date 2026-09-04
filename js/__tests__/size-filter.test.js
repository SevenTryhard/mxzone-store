const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Mismo enfoque que size-validation.test.js: main.js corre entero en el navegador
// y toca el DOM, asi que no se puede requerir. Se extrae el codigo de las
// funciones puras y se evalua aislado.
const fs = require('fs');
const path = require('path');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

// Extractor por balance de llaves: mas robusto que un regex no-greedy cuando la
// funcion tiene bloques anidados (getSizeTokenRank tiene un for con un if).
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

function extractConst(source, name) {
  const match = source.match(new RegExp('const ' + name + '\\s*=[\\s\\S]*?;', 'm'));
  if (!match) throw new Error('No se encontro la constante ' + name + ' en main.js');
  return match[0];
}

// Todo en UN solo eval: cada eval() crea su propio scope, asi que constantes y
// funciones evaluadas por separado no se ven entre si. Y los `const` de nivel
// superior pasan a `var` para que queden en el scope compartido del modulo.
const extracted = [
  extractConst(mainSource, 'SIZE_BANDS'),
  extractConst(mainSource, 'SIZE_RANK_UNKNOWN'),
  extractConst(mainSource, 'TOKEN_ALIASES'),
  extractConst(mainSource, 'NON_SIZE_TOKENS'),
  extractFunction(mainSource, 'foldAccents'),
  extractFunction(mainSource, 'getNormalizedFilterSizes'),
  extractFunction(mainSource, 'getNormalizedFilterTokens'),
  extractFunction(mainSource, 'getSizeTokenRank'),
  extractFunction(mainSource, 'getCardSizeRank')
].join('\n').replace(/^const /gm, 'var ');

eval(extracted);

// Replica exacta de la condicion de filterProducts(), para testear el criterio
// real y no una parafrasis del mismo.
function matchesSize(rawCardSizes, selectedSizes) {
  const tokens = getNormalizedFilterTokens(rawCardSizes);
  return selectedSizes.length === 0 || selectedSizes.some(s => tokens.includes(foldAccents(String(s).toUpperCase())));
}

describe('getNormalizedFilterTokens', () => {
  it('parte por barra', () => {
    assert.deepEqual(getNormalizedFilterTokens('S/M/L'), ['S', 'M', 'L']);
  });

  it('pliega el acento de Única para que matchee el chip "Unica"', () => {
    assert.deepEqual(getNormalizedFilterTokens('Única'), ['UNICA']);
  });

  // CAMBIO DE CONTRATO 2026-09-04: antes se le pegaban a "10-US" sus EU
  // aproximadas, porque los chips de botas estaban en EU. Ahora los chips de
  // calzado hablan US, asi que alcanza con el numero pelado — y la tabla de
  // equivalencia dejo de estar duplicada adentro del normalizador.
  it('de "10-US" saca el numero, que es el valor del chip de calzado', () => {
    const tokens = getNormalizedFilterTokens('10-US');
    assert.ok(tokens.includes('10-US'));
    assert.ok(tokens.includes('10'));
  });

  it('ya NO inyecta tallas EU: esa tabla vive solo en CALZADO_US_EU', () => {
    const tokens = getNormalizedFilterTokens('10-US');
    assert.equal(tokens.includes('42'), false);
    assert.equal(tokens.includes('43'), false);
  });

  it('devuelve lista vacia sin tallas', () => {
    assert.deepEqual(getNormalizedFilterTokens(''), []);
    assert.deepEqual(getNormalizedFilterTokens(null), []);
  });
});

describe('matchesSize — REGRESION del bug de subcadena', () => {
  // Medido en produccion el 2026-09-03: filtrar Cascos+L devolvia 17 resultados
  // y 9 eran cascos SOLO XL, porque se comparaba con .includes() sobre un string.
  it('XL NO matchea el filtro L', () => {
    assert.equal(matchesSize('XL', ['L']), false);
  });

  it('XXL NO matchea el filtro XL', () => {
    assert.equal(matchesSize('XXL', ['XL']), false);
  });

  it('YM (talla de niño) NO matchea el filtro M de adulto', () => {
    assert.equal(matchesSize('YM', ['M']), false);
  });

  it('L SI matchea el filtro L', () => {
    assert.equal(matchesSize('L', ['L']), true);
  });

  it('M/L/XL matchea L', () => {
    assert.equal(matchesSize('M/L/XL', ['L']), true);
  });

  it('sin tallas seleccionadas pasa todo', () => {
    assert.equal(matchesSize('XL', []), true);
    assert.equal(matchesSize('', []), true);
  });

  it('un producto sin tallas no matchea un filtro activo', () => {
    assert.equal(matchesSize('', ['M']), false);
  });

  it('el chip "Unica" matchea el producto "Única" del CMS', () => {
    assert.equal(matchesSize('Única', ['Unica']), true);
  });

  it('"Consultar" no es una talla y no matchea nada', () => {
    assert.equal(matchesSize('Consultar', ['M']), false);
    assert.equal(matchesSize('Consultar', ['Unica']), false);
  });

  it('una bota 10-US matchea el chip US 10', () => {
    assert.equal(matchesSize('10-US', ['10']), true);
  });

  it('una bota 10-US NO matchea el chip US 9', () => {
    assert.equal(matchesSize('10-US', ['9']), false);
  });

  // 🔴 REGRESION DEL BUG QUE REPORTO MAURO (2026-09-04).
  // BOTAS PVC IMPERMEABLES GRIS DAKAR estan cargadas como "7/8/9/10/11/12",
  // numeros pelados sin "-US" — el unico par del catalogo asi. Con los chips
  // en EU (38..46) no aparecia en NINGUNO: un "Top Ventas" que se evaporaba
  // apenas el cliente filtraba por talla. Con los chips en US entra sola, sin
  // tocarle el dato al producto.
  it('la DAKAR ("7/8/9/10/11/12", sin unidad) entra a los chips US', () => {
    const dakar = '7/8/9/10/11/12';
    ['7','8','9','10','11','12'].forEach(chip => {
      assert.equal(matchesSize(dakar, [chip]), true, 'deberia matchear el chip ' + chip);
    });
  });

  it('la DAKAR y una bota "-US" caen en el MISMO chip', () => {
    assert.equal(matchesSize('7/8/9/10/11/12', ['10']), true);
    assert.equal(matchesSize('10-US', ['10']), true);
  });

  it('el 38 dejo de ser un chip de calzado: no lo matchea nadie', () => {
    // Los chips 38, 45 y 46 devolvian CERO SIEMPRE porque ningun producto esta
    // cargado en EU. Ahora los chips son 7..13 y todos son alcanzables.
    assert.equal(matchesSize('10-US', ['38']), false);
    assert.equal(matchesSize('7/8/9/10/11/12', ['38']), false);
  });
});

// Estas son las formas REALES que trae el catalogo (contadas en produccion el
// 2026-09-03). Si el matcheo por token se hiciera "a lo bruto", estas se rompen.
describe('matchesSize — tallas compuestas del catalogo real', () => {
  it('un uniforme 36-XL matchea el chip XL (son 4 productos)', () => {
    assert.equal(matchesSize('36-XL', ['XL']), true);
  });

  it('un uniforme 36-XL tambien matchea el chip numerico 36', () => {
    assert.equal(matchesSize('36-XL', ['36']), true);
  });

  it('un uniforme 36-XL NO matchea el chip L', () => {
    assert.equal(matchesSize('36-XL', ['L']), false);
  });

  it('un uniforme 32-M matchea M (son 15 productos)', () => {
    assert.equal(matchesSize('32-M', ['M']), true);
  });

  it('un uniforme de niño 26-YL matchea YL', () => {
    assert.equal(matchesSize('26-YL', ['YL']), true);
  });

  it('26-YL NO matchea el L de adulto', () => {
    assert.equal(matchesSize('26-YL', ['L']), false);
  });

  it('una proteccion SM matchea S y M', () => {
    assert.equal(matchesSize('SM', ['S']), true);
    assert.equal(matchesSize('SM', ['M']), true);
  });

  it('una proteccion LXL matchea L y XL', () => {
    assert.equal(matchesSize('LXL', ['L']), true);
    assert.equal(matchesSize('LXL', ['XL']), true);
  });

  it('LXL NO matchea S', () => {
    assert.equal(matchesSize('LXL', ['S']), false);
  });
});

describe('getSizeTokenRank', () => {
  it('ordena las letras de menor a mayor', () => {
    assert.ok(getSizeTokenRank('XS') < getSizeTokenRank('S'));
    assert.ok(getSizeTokenRank('S') < getSizeTokenRank('M'));
    assert.ok(getSizeTokenRank('M') < getSizeTokenRank('L'));
    assert.ok(getSizeTokenRank('L') < getSizeTokenRank('XL'));
    assert.ok(getSizeTokenRank('XL') < getSizeTokenRank('XXL'));
  });

  it('pone las tallas de niño antes que las de adulto', () => {
    assert.ok(getSizeTokenRank('YXL') < getSizeTokenRank('XS'));
  });

  it('ordena las numericas entre si', () => {
    assert.ok(getSizeTokenRank('38') < getSizeTokenRank('42'));
  });

  it('manda Única y lo desconocido al final', () => {
    assert.ok(getSizeTokenRank('UNICA') > getSizeTokenRank('46'));
    assert.equal(getSizeTokenRank('PORAHI'), SIZE_RANK_UNKNOWN);
    assert.equal(getSizeTokenRank(''), SIZE_RANK_UNKNOWN);
  });

  it('no toma por talla lo que solo EMPIEZA con un numero', () => {
    // Con parseInt, "2.5L" (una maleta) y "SPORT 7" (un accesorio) entraban como
    // talla 2 y 7 y se colaban en la lista de chips.
    assert.equal(getSizeTokenRank('2.5L'), SIZE_RANK_UNKNOWN);
    assert.equal(getSizeTokenRank('SPORT 7'), SIZE_RANK_UNKNOWN);
  });

  it('reconoce la forma 10-US de las botas', () => {
    assert.equal(getSizeTokenRank('10-US'), getSizeTokenRank('10'));
    // La DAKAR (numero pelado) ordena igual que su equivalente con unidad.
    assert.equal(getSizeTokenRank('9'), getSizeTokenRank('9-US'));
  });
});

describe('getCardSizeRank', () => {
  it('sin seleccion usa la talla mas chica de la card', () => {
    assert.equal(getCardSizeRank('M/L/XL', []), getSizeTokenRank('M'));
  });

  it('con seleccion usa la mas chica de las SELECCIONADAS', () => {
    // Con S+L marcadas, una card S/M/L tiene que agruparse con las S.
    assert.equal(getCardSizeRank('S/M/L', ['L']), getSizeTokenRank('L'));
    assert.equal(getCardSizeRank('S/M/L', ['S', 'L']), getSizeTokenRank('S'));
  });

  it('una card sin tallas queda al final', () => {
    assert.equal(getCardSizeRank('', []), SIZE_RANK_UNKNOWN);
  });
});
