/**
 * MXZONE — Cartel de bienvenida al catalogo.
 *
 * Aparece UNA sola vez, solo para quien nunca lo contesto, al entrar a la
 * tienda. Pregunta la talla y las marcas, y con eso la tienda deja de ser un
 * catalogo de 250 productos y pasa a mostrarle a cada uno lo suyo.
 *
 * ---------------------------------------------------------------------------
 * POR QUE PREGUNTA ESTO Y NO OTRA COSA
 * ---------------------------------------------------------------------------
 * Se midio el catalogo antes de escribir nada (2026-09-08):
 *
 *   - PRESUPUESTO quedo AFUERA. No porque no sirva: porque la tienda NO TIENE
 *     filtro de precio. No esta escondido, no existe en shop.html —`main.js`
 *     busca #minPrice y encuentra null—. Preguntar un presupuesto que despues
 *     no se puede aplicar es pedirle trabajo al cliente a cambio de nada.
 *     Las bandas ya estan medidas para cuando el filtro exista: hasta 150k
 *     (81 productos), 150k-400k (65), 400k-900k (68), mas de 900k (35).
 *
 *   - COLOR quedo afuera por lo mismo: 10 de 250 productos tienen color
 *     cargado. Se puede deducir del nombre en el 44% de los casos, pero eso es
 *     otra tanda.
 *
 *   - MARCA entra, pero SUMA en vez de restar: el 27% del catalogo no tiene
 *     marca cargada. Si filtrara duro, 67 productos serian invisibles para
 *     todo el que conteste.
 *
 * ---------------------------------------------------------------------------
 * LA RESTRICCION QUE DEFINE EL DISENO
 * ---------------------------------------------------------------------------
 * Una talla SOLO significa algo dentro de una categoria: no existe un casco
 * talla 42 ni una bota talla S. Por eso en /shop, sin categoria elegida, la
 * tienda no muestra ni un chip de talla — dice "Elegi una categoria primero".
 *
 * O sea que este cartel NO PUEDE dejar el filtro de talla puesto al cerrarse.
 * Lo que hace es recordarla y marcarla sola en el momento en que el cliente
 * entra a una categoria, que es cuando esa talla recien existe. Se avisa
 * cuando pasa, y se puede desmarcar con un clic.
 */
(function () {
  'use strict';

  var CLAVE = 'mxzone_perfil_v1';
  var log = (typeof mxLog === 'function') ? mxLog : function () {};

  // ── Guardado ──────────────────────────────────────────────────────────────
  // Todo va en try/catch: en incognito o con las cookies bloqueadas,
  // localStorage TIRA al escribir. Un cartel de bienvenida no puede ser el
  // motivo de que la tienda no cargue.
  function leerPerfil() {
    try {
      var crudo = localStorage.getItem(CLAVE);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) {
      return null;
    }
  }

  function guardarPerfil(perfil) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(perfil));
      return true;
    } catch (e) {
      log('[bienvenida] no se pudo guardar el perfil:', e && e.message);
      return false;
    }
  }

  /**
   * Si corresponde mostrar el cartel.
   *
   * Se muestra una sola vez por navegador. "Ahora no" TAMBIEN cuenta como
   * contestado: insistirle a alguien que ya dijo que no es exactamente la
   * forma de gastar la paciencia que el cliente trae al entrar.
   */
  function debeMostrarse(perfil) {
    return !perfil;
  }

  // ── Las preguntas ─────────────────────────────────────────────────────────
  // Tres filas cortas y una opcional. Un cartel de bienvenida compite con las
  // ganas de ver productos: cada pregunta de mas es gente que cierra.
  var TALLAS_ROPA = ['S', 'M', 'L', 'XL', 'XXL'];
  var TALLAS_BOTA = ['7', '8', '9', '10', '11', '12', '13'];
  var MARCAS = [
    { slug: 'fly', label: 'Fly' },
    { slug: 'fox', label: 'Fox' },
    { slug: 'alpinestars', label: 'Alpinestars' },
    { slug: 'acerbis', label: 'Acerbis' },
    { slug: 'leatt', label: 'Leatt' }
  ];

  function chips(nombre, valores, etiqueta) {
    return valores.map(function (v) {
      var texto = etiqueta ? etiqueta(v) : v;
      return '<button type="button" class="bv-chip" data-grupo="' + nombre +
             '" data-valor="' + v + '">' + texto + '</button>';
    }).join('');
  }

  function plantilla() {
    return '' +
      '<div class="bv-panel" role="dialog" aria-modal="true" aria-labelledby="bvTitulo">' +
        '<button type="button" class="bv-cerrar" aria-label="Cerrar">&times;</button>' +

        '<h2 class="bv-titulo" id="bvTitulo">Te armamos la tienda a tu medida</h2>' +
        '<p class="bv-bajada">Dos toques y ves lo tuyo primero. Podes saltearlo.</p>' +

        '<div class="bv-grupo">' +
          '<span class="bv-label">Tu talla de ropa</span>' +
          '<div class="bv-chips">' + chips('ropa', TALLAS_ROPA) + '</div>' +
        '</div>' +

        '<div class="bv-grupo">' +
          '<span class="bv-label">Tu numero de bota</span>' +
          '<div class="bv-chips">' + chips('bota', TALLAS_BOTA, function (n) { return n + ' US'; }) + '</div>' +
        '</div>' +

        '<div class="bv-grupo">' +
          '<span class="bv-label">Marcas que te gustan <em>(opcional)</em></span>' +
          '<div class="bv-chips">' +
            MARCAS.map(function (m) {
              return '<button type="button" class="bv-chip" data-grupo="marca" data-valor="' +
                     m.slug + '">' + m.label + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<div class="bv-acciones">' +
          '<button type="button" class="bv-btn-primario" id="bvListo">Ver mi tienda</button>' +
          '<button type="button" class="bv-btn-fantasma" id="bvSaltar">Ahora no</button>' +
        '</div>' +
      '</div>';
  }

  // ── Aplicar lo contestado ─────────────────────────────────────────────────

  /**
   * Las marcas SI se pueden aplicar al toque: sus chips existen en /shop sin
   * necesidad de elegir categoria. Se usan los mismos botones que usaria el
   * cliente a mano, asi que no hace falta duplicar nada de la logica del filtro.
   */
  function aplicarMarcas(marcas) {
    if (!marcas || !marcas.length) return 0;
    var aplicadas = 0;
    marcas.forEach(function (slug) {
      var chip = document.querySelector('.brand-chip[data-brand="' + slug + '"]');
      if (chip && !chip.classList.contains('active')) {
        chip.click();
        aplicadas++;
      }
    });
    return aplicadas;
  }

  /**
   * PISO DE RESULTADOS — 2026-09-08.
   *
   * La talla y la marca se multiplican: Fox + Jerseys + talla M da UN producto
   * sobre 288. Medido en produccion, no en teoria. Un cliente nuevo contesta un
   * cuestionario amable y aterriza en una tienda vacia — se va, y con razon.
   *
   * Cuando eso pasa se suelta la MARCA y se queda la TALLA, en ese orden y no
   * al reves: la talla es una restriccion real —no te podes poner la que no es—
   * y la marca es un gusto. Antes de dejarlo sin nada, se le muestran otras
   * marcas en su talla.
   *
   * El piso es 4 porque abajo de eso la grilla ni siquiera llena una fila.
   */
  var PISO_DE_RESULTADOS = 4;

  function visibles() {
    var todas = document.querySelectorAll('.product-card');
    var n = 0;
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].style.display !== 'none') n++;
    }
    return n;
  }

  function aflojarSiQuedoVacio(talla) {
    setTimeout(function () {
      var quedan = visibles();

      var marcasActivas = document.querySelectorAll('.brand-chip.active:not([data-brand="all"])');
      if (quedan >= PISO_DE_RESULTADOS || !marcasActivas.length) {
        if (typeof showNotification === 'function') {
          showNotification('Filtramos por tu talla ' + talla + '. Tocala de nuevo para ver todas.', 'info');
        }
        return;
      }

      var todas = document.querySelector('.brand-chip[data-brand="all"]');
      if (todas) todas.click();

      if (typeof showNotification === 'function') {
        showNotification('Casi no hay talla ' + talla + ' de tus marcas. Te mostramos todas las marcas en tu talla.', 'info');
      }
      log('[bienvenida] piso de resultados: quedaban ' + quedan + ', se solto el filtro de marca');
    }, 400);
  }

  /**
   * La talla se marca sola CUANDO aparecen los chips, no antes: recien existen
   * al elegir una categoria. Se vigila el contenedor en vez de engancharse a la
   * funcion que los dibuja, para no acoplarse a main.js.
   *
   * Se aplica UNA vez por carga de pagina y solo si el cliente no marco ninguna
   * talla el mismo. Insistir en cada cambio de categoria seria pelearle al
   * cliente por el control de su propio filtro.
   */
  function vigilarTallas(perfil) {
    var contenedor = document.getElementById('sizeFilterContainer');
    if (!contenedor || !window.MutationObserver) return;
    if (!perfil || (!perfil.ropa && !perfil.bota)) return;

    var yaAplicada = false;

    function intentar() {
      if (yaAplicada) return;

      var chipsTalla = contenedor.querySelectorAll('.size-chip');
      if (!chipsTalla.length) return;
      if (contenedor.querySelector('.size-chip.active')) return; // el cliente ya eligio

      var candidatas = [perfil.ropa, perfil.bota].filter(Boolean);
      for (var i = 0; i < chipsTalla.length; i++) {
        var chip = chipsTalla[i];
        var valor = String(chip.dataset.size || '').trim().toUpperCase();
        if (candidatas.indexOf(valor) !== -1) {
          yaAplicada = true;
          chip.click();
          aflojarSiQuedoVacio(valor);
          return;
        }
      }
    }

    new MutationObserver(intentar).observe(contenedor, { childList: true });
    intentar();
  }

  // ── El cartel ─────────────────────────────────────────────────────────────
  function mostrar() {
    var capa = document.createElement('div');
    capa.className = 'bv-capa';
    capa.innerHTML = plantilla();
    document.body.appendChild(capa);

    // Un frame despues, para que la transicion de entrada corra.
    requestAnimationFrame(function () { capa.classList.add('bv-visible'); });

    var elegido = { ropa: null, bota: null, marca: [] };

    capa.addEventListener('click', function (e) {
      var chip = e.target.closest('.bv-chip');
      if (!chip) return;

      var grupo = chip.dataset.grupo;
      var valor = chip.dataset.valor;

      if (grupo === 'marca') {
        // Multiple: son preferencias, no una eleccion excluyente.
        chip.classList.toggle('bv-activo');
        var i = elegido.marca.indexOf(valor);
        if (i === -1) elegido.marca.push(valor); else elegido.marca.splice(i, 1);
        return;
      }

      // Talla: una sola por grupo, y volver a tocarla la desmarca — si no, no
      // hay forma de arrepentirse sin recargar.
      var hermanos = capa.querySelectorAll('.bv-chip[data-grupo="' + grupo + '"]');
      var estaba = chip.classList.contains('bv-activo');
      hermanos.forEach(function (h) { h.classList.remove('bv-activo'); });
      if (!estaba) {
        chip.classList.add('bv-activo');
        elegido[grupo] = valor;
      } else {
        elegido[grupo] = null;
      }
    });

    function cerrar(perfil) {
      guardarPerfil(perfil);
      capa.classList.remove('bv-visible');
      document.body.classList.remove('bv-abierto');
      setTimeout(function () { capa.remove(); }, 300);
      return perfil;
    }

    function saltar() {
      // Se guarda igual, con `salteado`, para no volver a molestar.
      cerrar({ salteado: true, fecha: Date.now() });
    }

    capa.querySelector('#bvSaltar').addEventListener('click', saltar);
    capa.querySelector('.bv-cerrar').addEventListener('click', saltar);
    capa.addEventListener('click', function (e) { if (e.target === capa) saltar(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && document.body.contains(capa)) { saltar(); document.removeEventListener('keydown', esc); }
    });

    capa.querySelector('#bvListo').addEventListener('click', function () {
      var perfil = {
        ropa: elegido.ropa,
        bota: elegido.bota,
        marca: elegido.marca,
        fecha: Date.now()
      };
      cerrar(perfil);

      var marcasAplicadas = aplicarMarcas(perfil.marca);
      vigilarTallas(perfil);

      if (typeof showNotification === 'function') {
        if (perfil.ropa || perfil.bota) {
          showNotification('Listo. Al entrar a una categoria te marcamos tu talla.', 'success');
        } else if (marcasAplicadas) {
          showNotification('Listo, filtramos por tus marcas.', 'success');
        }
      }
    });

    document.body.classList.add('bv-abierto');
  }

  // ── Arranque ──────────────────────────────────────────────────────────────
  function iniciar() {
    if (!document.getElementById('productsGrid')) return;  // solo en la tienda

    var perfil = leerPerfil();

    if (!debeMostrarse(perfil)) {
      // Ya contesto en otra visita: no se muestra nada, pero su talla se sigue
      // usando. Ese es el pago de haber contestado.
      if (perfil && !perfil.salteado) vigilarTallas(perfil);
      return;
    }

    // Se espera a que la grilla tenga productos: un cartel sobre una pagina
    // todavia vacia se lee como un anuncio, no como una ayuda.
    var intentos = 0;
    var esperar = setInterval(function () {
      intentos++;
      if (document.querySelectorAll('.product-card').length > 0) {
        clearInterval(esperar);
        setTimeout(mostrar, 600);
      } else if (intentos > 40) {
        clearInterval(esperar);  // 8s sin productos: algo anda mal, no se molesta
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  // Para las pruebas y para poder reabrirlo a mano desde la consola.
  window.MXZONE_BIENVENIDA = {
    leerPerfil: leerPerfil,
    guardarPerfil: guardarPerfil,
    debeMostrarse: debeMostrarse,
    mostrar: mostrar,
    CLAVE: CLAVE
  };
})();
