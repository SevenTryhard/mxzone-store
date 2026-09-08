const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Tanda 2 del stock por talla (2026-09-08): que la tienda deje de vender lo que
// no esta. Se extraen las funciones REALES de products.js, no se reimplementan.
//
// Lo que se protege aca es plata en las dos direcciones:
//   - Vender una talla que no hay -> devolucion y un cliente perdido.
//   - Esconder algo que SI hay -> venta que no ocurre.
// El segundo error es el que casi nadie testea, y es el que apagaria un
// catalogo entero el dia que se enciende esto. Por eso `null` no agota.
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'products.js'), 'utf8');

function extractFunction(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('No se encontro la funcion ' + name + ' en products.js');

  let depth = 0;
  let started = false;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') { depth++; started = true; }
    else if (src[i] === '}') {
      depth--;
      if (started && depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('Llaves sin cerrar en ' + name);
}

eval([
  extractFunction(source, 'claveDeTalla'),
  extractFunction(source, 'mapaDeStockPorTalla'),
  extractFunction(source, 'hayStockDeTalla'),
  extractFunction(source, 'todasLasTallasAgotadas'),
].join('\n\n'));

describe('mapaDeStockPorTalla — de la lista del API a algo consultable', () => {
  it('arma el mapa con las tallas en mayuscula', () => {
    const m = mapaDeStockPorTalla([
      { talla: 's', stock: 3 },
      { talla: ' M ', stock: 0 },
      { talla: 'L', stock: null },
    ]);
    assert.deepEqual(m, { S: 3, M: 0, L: null });
  });

  it('aguanta lo que no es una lista', () => {
    assert.deepEqual(mapaDeStockPorTalla(undefined), {});
    assert.deepEqual(mapaDeStockPorTalla(null), {});
    assert.deepEqual(mapaDeStockPorTalla('S/M'), {});
  });

  it('descarta entradas rotas o sin talla', () => {
    assert.deepEqual(mapaDeStockPorTalla([null, { talla: '', stock: 5 }, { talla: 'S', stock: 1 }]), { S: 1 });
  });
});

describe('hayStockDeTalla — LA REGLA QUE NO SE PUEDE ROMPER', () => {
  it('SIN CONTAR (null) se vende, igual que antes de todo esto', () => {
    // Si esto se rompe, el dia que se llena la tabla el catalogo entero de un
    // comercio amanece agotado. Las 314 filas nacieron en null.
    assert.equal(hayStockDeTalla({ S: null }, 'S'), true);
    assert.equal(hayStockDeTalla({ S: undefined }, 'S'), true);
  });

  it('una talla SIN FILA todavia tambien se vende', () => {
    assert.equal(hayStockDeTalla({ S: 0 }, 'XXL'), true);
    assert.equal(hayStockDeTalla({}, 'S'), true);
  });

  it('sin mapa se comporta como antes', () => {
    assert.equal(hayStockDeTalla(null, 'S'), true);
    assert.equal(hayStockDeTalla(undefined, 'M'), true);
  });

  it('contada y hay: se vende', () => {
    assert.equal(hayStockDeTalla({ S: 3 }, 'S'), true);
    assert.equal(hayStockDeTalla({ S: 1 }, 'S'), true);
  });

  it('contada y NO hay: se bloquea', () => {
    assert.equal(hayStockDeTalla({ XXL: 0 }, 'XXL'), false);
    assert.equal(hayStockDeTalla({ XXL: -1 }, 'XXL'), false);
  });

  it('no importa la mayuscula ni el espacio al comparar', () => {
    assert.equal(hayStockDeTalla({ XXL: 0 }, 'xxl'), false);
    assert.equal(hayStockDeTalla({ XXL: 0 }, ' XXL '), false);
  });
});

describe('el caso que lo obligo — RODILLERA LEATT 3DF HYBRID', () => {
  it('con la unica unidad en S, la XL no se puede comprar', () => {
    // stock general = 1, tallas S/M/L/XL. Antes la tienda ofrecia las cuatro.
    const m = mapaDeStockPorTalla([
      { talla: 'S', stock: 1 },
      { talla: 'M', stock: 0 },
      { talla: 'L', stock: 0 },
      { talla: 'XL', stock: 0 },
    ]);
    assert.equal(hayStockDeTalla(m, 'S'), true);
    assert.equal(hayStockDeTalla(m, 'XL'), false);
    assert.equal(hayStockDeTalla(m, 'M'), false);
  });
});

describe('todasLasTallasAgotadas — esconder el producto entero', () => {
  const TALLAS = ['S', 'M', 'L', 'XL'];

  it('todas contadas en cero: agotado', () => {
    const m = mapaDeStockPorTalla(TALLAS.map(t => ({ talla: t, stock: 0 })));
    assert.equal(todasLasTallasAgotadas(m, TALLAS), true);
  });

  it('una sola con stock: NO agotado', () => {
    const m = mapaDeStockPorTalla([
      { talla: 'S', stock: 0 }, { talla: 'M', stock: 0 },
      { talla: 'L', stock: 0 }, { talla: 'XL', stock: 2 },
    ]);
    assert.equal(todasLasTallasAgotadas(m, TALLAS), false);
  });

  it('EL CASO DE HOY: todas sin contar, NO agotado', () => {
    // Las 314 filas de produccion estan asi. Esta linea es la que garantiza que
    // encender esto no esconda un solo producto hasta que alguien cuente.
    const m = mapaDeStockPorTalla(TALLAS.map(t => ({ talla: t, stock: null })));
    assert.equal(todasLasTallasAgotadas(m, TALLAS), false);
  });

  it('con UNA sola talla sin contar NO se afirma que este agotado', () => {
    const m = mapaDeStockPorTalla([
      { talla: 'S', stock: 0 }, { talla: 'M', stock: 0 },
      { talla: 'L', stock: 0 }, { talla: 'XL', stock: null },
    ]);
    assert.equal(todasLasTallasAgotadas(m, TALLAS), false);
  });

  it('si falta la fila de una talla, tampoco se afirma', () => {
    const m = mapaDeStockPorTalla([
      { talla: 'S', stock: 0 }, { talla: 'M', stock: 0 }, { talla: 'L', stock: 0 },
    ]);
    assert.equal(todasLasTallasAgotadas(m, TALLAS), false);
  });

  it('sin datos no se esconde nada', () => {
    assert.equal(todasLasTallasAgotadas({}, TALLAS), false);
    assert.equal(todasLasTallasAgotadas(null, TALLAS), false);
    assert.equal(todasLasTallasAgotadas({ S: 0 }, []), false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LA PRUEBA QUE FALTABA — 2026-09-08
// ═══════════════════════════════════════════════════════════════════════════
// Todo lo de arriba pasaba en verde con la tienda ROTA en produccion.
//
// Las cuatro funciones habian quedado declaradas ADENTRO de createProductCard,
// asi que `adaptProductFrom4ULAB` —que esta mas arriba en el archivo y corre
// antes— tiraba "todasLasTallasAgotadas is not defined" en CADA producto. El
// adaptador entero fallaba, la carga desde 4ULAB se iba por el catch y la
// tienda caia al catalogo viejo de respaldo: 22 jerseys en vez de 33.
//
// Probar las piezas sueltas no prueba que esten conectadas. Esta corre el
// adaptador de verdad, que es lo unico que lo habria cazado.
describe('adaptProductFrom4ULAB — que las piezas esten CONECTADAS', () => {
  const adaptador = new Function(
    extractFunction(source, 'claveDeTalla') + '\n' +
    extractFunction(source, 'mapaDeStockPorTalla') + '\n' +
    extractFunction(source, 'hayStockDeTalla') + '\n' +
    extractFunction(source, 'todasLasTallasAgotadas') + '\n' +
    extractFunction(source, 'adaptProductFrom4ULAB') + '\n' +
    'return adaptProductFrom4ULAB;'
  )();

  const PRODUCTO = {
    id: 1, name: 'JERSEY FOX 180 IMAGEPRINT ORNG', slug: 'jersey-fox-180',
    price: '189000', stock: 1, category: 'jersey',
    attributes: { tallas: ['S', 'M', 'XL'], marca: 'Fox' },
    images: ['a.jpg'],
  };

  it('no explota con un producto real del API', () => {
    assert.doesNotThrow(() => adaptador({ ...PRODUCTO, variantes: [] }));
  });

  it('no explota cuando el API NO manda variantes', () => {
    // Una tienda vieja, o el API antes de este cambio.
    assert.doesNotThrow(() => adaptador(PRODUCTO));
    assert.equal(adaptador(PRODUCTO).agotado, false);
  });

  it('EL CASO DE HOY: todas sin contar, el producto se sigue mostrando', () => {
    const r = adaptador({
      ...PRODUCTO,
      variantes: [{ talla: 'S', stock: null }, { talla: 'M', stock: null }, { talla: 'XL', stock: null }],
    });
    assert.equal(r.agotado, false, 'con todo sin contar NO se puede esconder');
  });

  it('con una talla contada y las otras no, se sigue mostrando', () => {
    const r = adaptador({
      ...PRODUCTO,
      variantes: [{ talla: 'S', stock: 0 }, { talla: 'M', stock: null }, { talla: 'XL', stock: null }],
    });
    assert.equal(r.agotado, false);
  });

  it('con TODAS contadas en cero, recien ahi se esconde', () => {
    const r = adaptador({
      ...PRODUCTO,
      variantes: [{ talla: 'S', stock: 0 }, { talla: 'M', stock: 0 }, { talla: 'XL', stock: 0 }],
    });
    assert.equal(r.agotado, true);
  });

  it('las variantes llegan al producto adaptado', () => {
    const r = adaptador({ ...PRODUCTO, variantes: [{ talla: 'S', stock: 2 }] });
    assert.deepEqual(r.variantes, [{ talla: 'S', stock: 2 }]);
  });
});
