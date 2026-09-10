/**
 * MXZONE — Panel de bienvenida al catalogo.
 *
 * Reescrito el 2026-09-10. La version anterior se apago el 2026-09-09 por dos
 * motivos que quedaron anotados en shop.html, y los dos eran el MISMO problema:
 *
 *     "preguntaba por MARCAS, que es un filtro que dejamos de ofrecer, y era
 *      sospechoso de ensuciar el link para compartir aplicando filtros por su
 *      cuenta."
 *
 * Aquella version FILTRABA: le hacia clic a los chips de marca del cliente. De
 * ahi salia todo lo demas. Filtrar por talla Y marca a la vez multiplica dos
 * restricciones, y estaba medido en produccion que "Fox + Jerseys + talla M"
 * dejaba UN producto sobre 288. Para tapar eso habia un piso de emergencia que
 * SOLTABA los filtros solos cuando la tienda quedaba vacia. Un cartel que pone
 * filtros que despues tiene que sacar no esta ayudando a nadie.
 *
 * ---------------------------------------------------------------------------
 * LA REGLA QUE DEFINE ESTA VERSION
 * ---------------------------------------------------------------------------
 * ESTE PANEL NO FILTRA. ORDENA.
 *
 * Nunca esconde un producto, nunca toca un chip, nunca escribe en la URL. Lo
 * unico que hace es guardar un perfil que `sortProducts()` en main.js lee para
 * subir lo que le sirve a ese cliente. Todo lo demas sigue ahi, abajo.
 *
 * Es de Seven, y su ejemplo es el que lo prueba: alguien elige talla M, y tres
 * semanas despues quiere comprarle un uniforme a la novia. Si el panel hubiera
 * FILTRADO, esa venta no existe y el cliente ni se entera de por que no
 * encuentra nada. Un filtro invisible que el cliente no sabe que puso es una
 * tienda que le miente.
 *
 * Consecuencia directa: el piso de emergencia ya no hace falta. No se puede
 * quedar sin resultados algo que nunca saca resultados.
 *
 * ---------------------------------------------------------------------------
 * CUANDO NO APARECE
 * ---------------------------------------------------------------------------
 * No le aparece NUNCA a quien llego con una intencion.
 *
 * Si el cliente entra con `?cat=botas&talla=42` —un link que le mandaron por
 * WhatsApp— ya contesto la pregunta al hacer clic. Preguntarle la talla ahi no
 * es un cartel mal programado: es el unico momento en que ofende.
 *
 * ---------------------------------------------------------------------------
 * LO QUE SE APRENDIO MIDIENDO EL CATALOGO (2026-09-08) Y SIGUE VALIENDO
 * ---------------------------------------------------------------------------
 *   - MARCA no se pregunta mas: es un filtro que la tienda dejo de ofrecer.
 *   - PRESUPUESTO si se pregunta, pero NO como filtro —la tienda no tiene
 *     filtro de precio, `main.js` busca #minPrice y encuentra null—. Se usa
 *     como senial de orden: lo que entra en su rango sube. Preguntar algo que
 *     despues no se puede aplicar seria pedirle trabajo al cliente a cambio de
 *     nada; aplicarlo ordenando si se puede, hoy, sin backend nuevo.
 *   - COLOR sigue afuera: 10 de 250 productos lo tienen cargado.
 *   - Una talla SOLO significa algo dentro de una categoria: no existe un casco
 *     talla 42 ni una bota talla S. Por eso se guardan por separado.
 */
(function () {
  'use strict';

  var CLAVE = 'mxzone_perfil_v2';
  var log = (typeof mxLog === 'function') ? mxLog : function () {};

  // ── Guardado ──────────────────────────────────────────────────────────────
  // Todo en try/catch: en incognito o con las cookies bloqueadas localStorage
  // TIRA al escribir. Un cartel de bienvenida no puede ser el motivo de que la
  // tienda no cargue.
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
    } catch (e) {
      log('[bienvenida] no se pudo guardar el perfil:', e && e.message);
    }
    // Aunque el guardado falle, la tienda tiene que ordenar en ESTA visita.
    window.MXZONE_PERFIL = perfil;
    if (typeof window.mxAplicarPrioridad === 'function') window.mxAplicarPrioridad();
  }

  /**
   * Si corresponde mostrarlo.
   *
   * Tres portones, y el del medio es el importante.
   */
  function debeMostrarse() {
    // 1. Ya contesto alguna vez. "Ahora no" TAMBIEN cuenta: insistirle a quien
    //    ya dijo que no es la forma mas rapida de gastar la paciencia que el
    //    cliente trae puesta al entrar.
    if (leerPerfil()) return false;

    // 2. LLEGO CON UNA INTENCION. Cualquier cosa en la URL que diga que este
    //    visitante no vino a mirar sino a buscar algo puntual.
    var p = new URLSearchParams(window.location.search);
    var seniales = ['cat', 'talla', 'marca', 'q', 'search', 'producto', 'slug', 'promo'];
    for (var i = 0; i < seniales.length; i++) {
      if (p.get(seniales[i])) return false;
    }

    // 3. Tiene que haber una tienda abajo. Si la grilla no existe, esto no es
    //    /shop y no hay nada que ordenar.
    return !!document.querySelector('.products-grid');
  }

  // ── Las preguntas ─────────────────────────────────────────────────────────
  var TALLAS = [
    { clave: 'casco',    etiqueta: 'Casco',    ico: 'cascos',       valores: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { clave: 'jersey',   etiqueta: 'Jersey',   ico: 'jersey',       valores: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { clave: 'pantalon', etiqueta: 'Pantalón', ico: 'uniformes',    valores: ['28', '30', '32', '34', '36', '38', '40'] },
    { clave: 'bota',     etiqueta: 'Botas',    ico: 'botas',        valores: ['38', '39', '40', '41', '42', '43', '44', '45'] }
  ];

  // Las bandas salen de medir el catalogo, no de numeros redondos inventados:
  // hasta 150k (81 productos), 150k-400k (65), 400k-900k (68), +900k (35).
  var PRESUPUESTOS = [
    { clave: 'bajo',  etiqueta: 'Hasta $150.000',       min: 0,       max: 150000 },
    { clave: 'medio', etiqueta: '$150.000 – $400.000',  min: 150000,  max: 400000 },
    { clave: 'alto',  etiqueta: '$400.000 – $900.000',  min: 400000,  max: 900000 },
    { clave: 'top',   etiqueta: 'Más de $900.000',      min: 900000,  max: Infinity },
    { clave: 'nose',  etiqueta: 'Todavía no sé',        min: 0,       max: Infinity }
  ];

  var INTERESES = [
    { clave: 'cascos', etiqueta: 'Cascos' },
    { clave: 'botas', etiqueta: 'Botas' },
    { clave: 'jersey', etiqueta: 'Jerseys' },
    { clave: 'uniformes', etiqueta: 'Uniformes' },
    { clave: 'protecciones', etiqueta: 'Protecciones' },
    { clave: 'guantes', etiqueta: 'Guantes' },
    { clave: 'gafas', etiqueta: 'Gafas' },
    { clave: 'todo', etiqueta: 'Todo el equipo' }
  ];

  // ── Estado del formulario ─────────────────────────────────────────────────
  var paso = 1;
  var TOTAL_PASOS = 3;
  var respuestas = { tallas: {}, presupuesto: null, intereses: [] };

  function ico(nombre) {
    return '<i class="ico" data-ico="' + nombre + '" aria-hidden="true"></i>';
  }

  function chips(grupo, valores, seleccionado) {
    return valores.map(function (v) {
      var valor = typeof v === 'string' ? v : v.clave;
      var texto = typeof v === 'string' ? v : v.etiqueta;
      var activo = Array.isArray(seleccionado)
        ? seleccionado.indexOf(valor) !== -1
        : seleccionado === valor;
      return '<button type="button" class="bv-chip' + (activo ? ' bv-chip-on' : '') +
             '" data-grupo="' + grupo + '" data-valor="' + valor + '">' + texto + '</button>';
    }).join('');
  }

  // ── Las pantallas ─────────────────────────────────────────────────────────

  function pantallaBienvenida() {
    return '' +
      '<div class="bv-columna-foto" aria-hidden="true"></div>' +
      '<div class="bv-columna-texto">' +
        '<p class="bv-paso">01 / 0' + TOTAL_PASOS + '</p>' +
        '<h2 class="bv-titulo" id="bvTitulo">Encontrá tu <em>equipo ideal</em></h2>' +
        '<p class="bv-bajada">Contanos tu talla y qué estás buscando, y ponemos lo tuyo ' +
          'primero. <strong>No se esconde nada</strong>: el catálogo completo sigue ahí.</p>' +
        '<p class="bv-nota">' + ico('alerta') + ' Son dos pasos y se contesta una sola vez.</p>' +
        '<div class="bv-acciones">' +
          '<button type="button" class="bv-btn bv-btn-primario" data-accion="siguiente">Continuar</button>' +
          '<button type="button" class="bv-btn bv-btn-fantasma" data-accion="saltar">Ahora no</button>' +
        '</div>' +
      '</div>';
  }

  function pantallaTallas() {
    var filas = TALLAS.map(function (t) {
      return '' +
        '<div class="bv-fila">' +
          '<span class="bv-fila-label">' + ico(t.ico) + ' ' + t.etiqueta + '</span>' +
          '<div class="bv-chips">' + chips('talla:' + t.clave, t.valores, respuestas.tallas[t.clave]) + '</div>' +
        '</div>';
    }).join('');

    return '' +
      '<div class="bv-columna-texto bv-ancho">' +
        '<p class="bv-paso">02 / 0' + TOTAL_PASOS + '</p>' +
        '<h2 class="bv-titulo" id="bvTitulo">¿Qué <em>talla</em> usás?</h2>' +
        '<p class="bv-bajada">Elegí las que sepas. Las que no, dejalas en blanco.</p>' +
        '<div class="bv-filas">' + filas + '</div>' +
        '<div class="bv-acciones">' +
          '<button type="button" class="bv-btn bv-btn-primario" data-accion="siguiente">Siguiente</button>' +
          '<button type="button" class="bv-btn bv-btn-fantasma" data-accion="siguiente">No sé / Omitir</button>' +
        '</div>' +
      '</div>';
  }

  function pantallaPresupuesto() {
    return '' +
      '<div class="bv-columna-texto bv-ancho">' +
        '<p class="bv-paso">03 / 0' + TOTAL_PASOS + '</p>' +
        '<h2 class="bv-titulo" id="bvTitulo">¿Cuánto querés <em>invertir</em>?</h2>' +
        '<p class="bv-bajada">Lo usamos para ordenar, no para esconder precios.</p>' +
        '<div class="bv-chips bv-chips-anchos">' + chips('presupuesto', PRESUPUESTOS, respuestas.presupuesto) + '</div>' +
        '<p class="bv-label">¿Qué estás buscando?</p>' +
        '<div class="bv-chips">' + chips('interes', INTERESES, respuestas.intereses) + '</div>' +
        '<div class="bv-acciones">' +
          '<button type="button" class="bv-btn bv-btn-primario" data-accion="terminar">Ver productos</button>' +
          '<button type="button" class="bv-btn bv-btn-fantasma" data-accion="saltar">Ahora no</button>' +
        '</div>' +
      '</div>';
  }

  function pantallaListo() {
    return '' +
      '<div class="bv-columna-texto bv-centrado">' +
        '<div class="bv-tilde">' + ico('explorar') + '</div>' +
        '<h2 class="bv-titulo" id="bvTitulo">¡Listo!</h2>' +
        '<p class="bv-bajada">Ordenamos la tienda con lo tuyo adelante. ' +
          '<strong>Todo el catálogo sigue disponible</strong> — nada quedó oculto.</p>' +
        '<div class="bv-acciones">' +
          '<button type="button" class="bv-btn bv-btn-primario" data-accion="cerrar">Ver mi tienda</button>' +
        '</div>' +
      '</div>';
  }

  function pantalla() {
    if (paso === 1) return pantallaBienvenida();
    if (paso === 2) return pantallaTallas();
    if (paso === 3) return pantallaPresupuesto();
    return pantallaListo();
  }

  // ── Montaje ───────────────────────────────────────────────────────────────

  function mostrar() {
    var capa = document.createElement('div');
    capa.className = 'bv-capa';
    capa.innerHTML =
      '<div class="bv-panel" role="dialog" aria-modal="true" aria-labelledby="bvTitulo">' +
        '<button type="button" class="bv-cerrar" aria-label="Cerrar" data-accion="saltar">&times;</button>' +
        '<div class="bv-progreso"><span class="bv-progreso-barra" style="width:33%"></span></div>' +
        '<div class="bv-cuerpo">' + pantalla() + '</div>' +
      '</div>';
    document.body.appendChild(capa);
    document.body.classList.add('bv-abierto');
    // La entrada animada SOLO si la pestania esta a la vista. Ver el comentario
    // de .bv-capa en styles.css: en segundo plano la animacion queda pausada en
    // el primer cuadro y el panel se vuelve invisible pero sigue tapando todo.
    if (!document.hidden) capa.classList.add('bv-anima');

    var cuerpo = capa.querySelector('.bv-cuerpo');
    var barra = capa.querySelector('.bv-progreso-barra');

    function repintar() {
      cuerpo.innerHTML = pantalla();
      var pct = paso > TOTAL_PASOS ? 100 : Math.round((paso / TOTAL_PASOS) * 100);
      barra.style.width = pct + '%';
      var foco = cuerpo.querySelector('.bv-btn-primario');
      if (foco) foco.focus();
    }

    function cerrar(perfil) {
      guardarPerfil(perfil);
      cerrarCapa();
    }

    // Sacar el panel de la pantalla. Se le agrega la clase para que se
    // desvanezca, pero el que lo SACA es el temporizador: si la animacion no
    // corre —pestania en segundo plano, o el sistema con las animaciones
    // apagadas— el panel se va igual. Nunca puede quedar tapando la tienda.
    function cerrarCapa() {
      capa.classList.add('bv-cerrando');
      document.body.classList.remove('bv-abierto');
      setTimeout(function () { if (capa.parentNode) capa.remove(); }, 260);
      document.removeEventListener('keydown', enEscape);
    }

    function enEscape(e) {
      if (e.key === 'Escape') cerrar({ contestado: false, en: Date.now() });
    }
    document.addEventListener('keydown', enEscape);

    capa.addEventListener('click', function (e) {
      // Clic afuera del panel = "ahora no". No se pierde nada: vuelve a
      // aparecer solo si nunca contesto, y esto cuenta como haber contestado.
      if (e.target === capa) { cerrar({ contestado: false, en: Date.now() }); return; }

      var chip = e.target.closest('.bv-chip');
      if (chip) {
        var grupo = chip.dataset.grupo;
        var valor = chip.dataset.valor;

        if (grupo === 'interes') {
          // Varios a la vez.
          var i = respuestas.intereses.indexOf(valor);
          if (i === -1) respuestas.intereses.push(valor);
          else respuestas.intereses.splice(i, 1);
          chip.classList.toggle('bv-chip-on');
          return;
        }

        // Uno solo por grupo, y volver a tocarlo lo desmarca: si no, quien se
        // equivoca de talla no tiene forma de arrepentirse.
        var hermanos = chip.parentElement.querySelectorAll('.bv-chip');
        var yaEstaba = chip.classList.contains('bv-chip-on');
        hermanos.forEach(function (h) { h.classList.remove('bv-chip-on'); });
        if (!yaEstaba) chip.classList.add('bv-chip-on');

        if (grupo === 'presupuesto') {
          respuestas.presupuesto = yaEstaba ? null : valor;
        } else if (grupo.indexOf('talla:') === 0) {
          var cual = grupo.slice(6);
          if (yaEstaba) delete respuestas.tallas[cual];
          else respuestas.tallas[cual] = valor;
        }
        return;
      }

      var boton = e.target.closest('[data-accion]');
      if (!boton) return;
      var accion = boton.dataset.accion;

      if (accion === 'saltar') { cerrar({ contestado: false, en: Date.now() }); return; }
      if (accion === 'cerrar') { cerrarCapa(); return; }
      if (accion === 'siguiente') { paso++; repintar(); return; }
      if (accion === 'terminar') {
        paso = TOTAL_PASOS + 1;
        // Se guarda ACA, no al cerrar: si el cliente cierra la pestania en la
        // pantalla de "listo", lo que contesto ya quedo puesto igual.
        cerrarGuardando();
        repintar();
      }
    });

    function cerrarGuardando() {
      guardarPerfil({
        contestado: true,
        en: Date.now(),
        tallas: respuestas.tallas,
        presupuesto: respuestas.presupuesto,
        intereses: respuestas.intereses
      });
    }
  }

  // ── Arranque ──────────────────────────────────────────────────────────────
  function arrancar() {
    // El perfil se publica SIEMPRE, aunque el panel no se muestre: quien ya
    // contesto tiene que seguir viendo la tienda ordenada a su medida.
    window.MXZONE_PERFIL = leerPerfil();

    if (!debeMostrarse()) return;

    // Se espera a que la tienda pinte. Un cartel que aparece sobre una pantalla
    // en blanco parece un error de carga, no una bienvenida.
    setTimeout(function () {
      if (debeMostrarse()) mostrar();
    }, 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }

  // Para poder probarlo sin borrar el navegador a mano.
  window.mxBienvenidaReset = function () {
    try { localStorage.removeItem(CLAVE); } catch (e) {}
    window.MXZONE_PERFIL = null;
    location.reload();
  };
})();
