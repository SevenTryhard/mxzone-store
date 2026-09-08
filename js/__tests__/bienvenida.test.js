const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// El cartel de bienvenida toca el DOM, asi que no se puede requerir entero.
// Se extraen las piezas que deciden COSAS —cuando mostrarlo y como se guarda—
// que son las que, si fallan, molestan a un cliente real.
const source = fs.readFileSync(path.join(__dirname, '..', 'bienvenida.js'), 'utf8');

function extractFunction(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('No se encontro la funcion ' + name + ' en bienvenida.js');
  let depth = 0, started = false;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') { depth++; started = true; }
    else if (src[i] === '}') {
      depth--;
      if (started && depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('Llaves sin cerrar en ' + name);
}

eval(extractFunction(source, 'debeMostrarse'));

describe('cuando se muestra el cartel', () => {
  it('a alguien que nunca lo vio: SI', () => {
    assert.equal(debeMostrarse(null), true);
    assert.equal(debeMostrarse(undefined), true);
  });

  it('a quien ya contesto: NO', () => {
    assert.equal(debeMostrarse({ ropa: 'M', bota: null, marca: [] }), false);
  });

  it('a quien lo SALTEO: tampoco', () => {
    // Insistirle a alguien que ya dijo que no es la forma mas rapida de gastar
    // la paciencia que el cliente trae al entrar.
    assert.equal(debeMostrarse({ salteado: true, fecha: 1 }), false);
  });

  it('a quien contesto sin elegir nada: tampoco', () => {
    // Apreto "Ver mi tienda" sin marcar. Contesto igual.
    assert.equal(debeMostrarse({ ropa: null, bota: null, marca: [], fecha: 1 }), false);
  });
});

describe('el guardado no puede romper la tienda', () => {
  // En incognito o con las cookies bloqueadas, localStorage TIRA al escribir.
  // Un cartel de bienvenida no puede ser el motivo de que no cargue la tienda.
  const conStorageRoto = new Function('localStorage', `
    ${extractFunction(source, 'leerPerfil').replace("var CLAVE = 'mxzone_perfil_v1';", '')}
    ${extractFunction(source, 'guardarPerfil')}
    var CLAVE = 'mxzone_perfil_v1';
    var log = function () {};
    return { leerPerfil: leerPerfil, guardarPerfil: guardarPerfil };
  `);

  const roto = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
  };

  it('leer con el almacenamiento bloqueado devuelve null, no explota', () => {
    const api = conStorageRoto(roto);
    assert.doesNotThrow(() => api.leerPerfil());
    assert.equal(api.leerPerfil(), null);
  });

  it('guardar con el almacenamiento bloqueado devuelve false, no explota', () => {
    const api = conStorageRoto(roto);
    assert.doesNotThrow(() => api.guardarPerfil({ ropa: 'M' }));
    assert.equal(api.guardarPerfil({ ropa: 'M' }), false);
  });

  it('un perfil con JSON corrupto no explota', () => {
    const api = conStorageRoto({ getItem: () => '{roto', setItem: () => {} });
    assert.doesNotThrow(() => api.leerPerfil());
    assert.equal(api.leerPerfil(), null);
  });

  it('guardar y leer de vuelta conserva lo elegido', () => {
    let guardado = null;
    const api = conStorageRoto({ getItem: () => guardado, setItem: (k, v) => { guardado = v; } });
    assert.equal(api.guardarPerfil({ ropa: 'M', bota: '10', marca: ['fox'] }), true);
    assert.deepEqual(api.leerPerfil(), { ropa: 'M', bota: '10', marca: ['fox'] });
  });
});

describe('las preguntas que hace', () => {
  it('NO pregunta presupuesto', () => {
    // La tienda no tiene filtro de precio: no existe #minPrice en shop.html.
    // Preguntar algo que no se puede aplicar es pedirle trabajo al cliente a
    // cambio de nada. Si algun dia se agrega el filtro, se revive la pregunta.
    assert.ok(!/presupuesto/i.test(source.replace(/\/\*[\s\S]*?\*\//g, '')),
      'aparecio "presupuesto" fuera de los comentarios: la tienda todavia no puede filtrar por precio');
  });

  it('NO pregunta color', () => {
    // 10 de 250 productos tienen color cargado.
    const sinComentarios = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.ok(!/data-grupo="color"/.test(sinComentarios));
  });

  it('las marcas que ofrece existen como chips en la tienda', () => {
    const shop = fs.readFileSync(path.join(__dirname, '..', '..', 'shop.html'), 'utf8');
    const slugs = [...source.matchAll(/\{ slug: '([a-z-]+)'/g)].map(m => m[1]);
    assert.ok(slugs.length >= 5, 'esperaba al menos 5 marcas, hay ' + slugs.length);
    slugs.forEach(slug => {
      assert.ok(shop.includes('data-brand="' + slug + '"'),
        'la marca "' + slug + '" no tiene chip en shop.html: al elegirla no pasaria nada');
    });
  });
});

describe('esta enchufado donde corresponde', () => {
  it('shop.html carga el script', () => {
    const shop = fs.readFileSync(path.join(__dirname, '..', '..', 'shop.html'), 'utf8');
    assert.ok(/js\/bienvenida\.js\?t=\d{12}/.test(shop), 'falta el <script> en shop.html');
  });

  it('el script de cache conoce el archivo', () => {
    // Sin esto su ?t= nunca se actualiza y los navegadores sirven la version
    // vieja para siempre. Ya paso con product-detail.js y promotions.js.
    const bump = fs.readFileSync(path.join(__dirname, '..', '..', 'bump-cache-timestamp.ps1'), 'utf8');
    assert.ok(bump.includes("'js/bienvenida.js'"),
      'bienvenida.js no esta en la lista $assets de bump-cache-timestamp.ps1');
  });
});
