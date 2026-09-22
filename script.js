(function(){
  "use strict";

  /* =========================================================
     CONFIGURACIÓN — cambia estos valores y listo
     ========================================================= */
  var CONFIG = {
    // WhatsApp (código de país + número, solo dígitos)
    waPrincipal:   "18097426135",
    waSecundario:  "18492869867",
    telPrincipal:  "(809) 742-6135",
    telSecundario: "(849) 286-9867",

    // Instagram
    instagram: "https://www.instagram.com/d.los.compas.refrigeracion?stkn=MXpjcXFjM3dxeGZx",

    // Recargos del cotizador
    precioElectricidad: 500          // punto de electricidad
  };

  var SALUDO = "Hola The Compas Refrigeración 👋 Quiero pedir una cita para mi aire acondicionado. ¿Cuándo tienen disponibilidad?";

  /* ===== Utilidades ===== */
  var fmt = new Intl.NumberFormat("es-DO");
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function waLink(numero, texto){
    return "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto);
  }
  function abrirFuera(el){ el.target = "_blank"; el.rel = "noopener"; }

  /* ===== Contactos visibles: una sola fuente de verdad (CONFIG) ===== */
  $$('[data-tel="principal"]').forEach(function(el){ el.textContent = CONFIG.telPrincipal; });
  $$('[data-tel="secundario"]').forEach(function(el){ el.textContent = CONFIG.telSecundario; });
  $("#year").textContent = new Date().getFullYear();

  $$('[data-wa="principal"]').forEach(function(el){ el.href = waLink(CONFIG.waPrincipal, SALUDO); abrirFuera(el); });
  $$('[data-wa="secundario"]').forEach(function(el){ el.href = waLink(CONFIG.waSecundario, SALUDO); abrirFuera(el); });
  $$('[data-ig]').forEach(function(el){ el.href = CONFIG.instagram; abrirFuera(el); });

  /* =========================================================
     COTIZADOR
     ========================================================= */
  var MODOS = {
    instalacion: {
      grupo: "tipo-instalacion",
      legendTipo: "¿Qué tipo de instalación necesitas?",
      electricidad: true,
      accion: "una instalación",
      regalo: true
    },
    mantenimiento: {
      grupo: "tipo-mantenimiento",
      legendTipo: "¿Qué plan de mantenimiento necesitas?",
      electricidad: false,
      accion: "un mantenimiento",
      regalo: false
    }
  };
  var modoActual = "instalacion";

  var chkElec  = $("#elec");
  var outTotal = $("#total");
  var lineas   = $("#lineas");
  var btnWa    = $("#waCotiza");
  var stepElec = $("#stepElec");
  var tipoLegend = $("#tipoLegend");
  var giftline   = $("#giftline");
  var optsInstalacion   = $("#opts-instalacion");
  var optsMantenimiento = $("#opts-mantenimiento");
  var totalAnterior = 0;

  function tipoSeleccionado(){
    var r = $('input[name="' + MODOS[modoActual].grupo + '"]:checked');
    return { precio: parseInt(r.value,10), nombre: r.dataset.nombre };
  }

  function aplicarModo(modo){
    if(!MODOS[modo]) return;
    modoActual = modo;
    var m = MODOS[modo];

    $$(".modeBtn").forEach(function(b){
      var activo = b.dataset.modo === modo;
      b.classList.toggle("is-active", activo);
      b.setAttribute("aria-pressed", activo ? "true" : "false");
    });

    optsInstalacion.hidden   = modo !== "instalacion";
    optsMantenimiento.hidden = modo !== "mantenimiento";

    tipoLegend.textContent = m.legendTipo;

    stepElec.hidden = !m.electricidad;
    if(!m.electricidad){ chkElec.checked = false; }

    calcular();
  }

  function fila(texto, valor, gratis){
    var li = document.createElement("li");
    if(gratis) li.className = "free";
    var a = document.createElement("span"); a.textContent = texto;
    var b = document.createElement("span"); b.textContent = valor;
    li.appendChild(a); li.appendChild(b);
    return li;
  }

  function animarTotal(desde, hasta){
    if(reduce || desde === hasta){ outTotal.textContent = fmt.format(hasta); return; }
    var inicio = null, dur = 380;
    function paso(t){
      if(!inicio) inicio = t;
      var p = Math.min((t - inicio) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      outTotal.textContent = fmt.format(Math.round(desde + (hasta - desde) * e));
      if(p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  function calcular(){
    var m       = MODOS[modoActual];
    var tipo    = tipoSeleccionado();
    var extraElec = (m.electricidad && chkElec.checked) ? CONFIG.precioElectricidad : 0;
    var total = tipo.precio + extraElec;

    /* Desglose visible */
    lineas.textContent = "";
    lineas.appendChild(fila(tipo.nombre, "RD$ " + fmt.format(tipo.precio)));

    if(m.electricidad && extraElec > 0){
      lineas.appendChild(fila("Punto de electricidad", "RD$ " + fmt.format(extraElec)));
    }
    if(m.regalo){
      lineas.appendChild(fila("Verificación de tu equipo A/A", "Gratis", true));
    }
    giftline.hidden = !m.regalo;

    animarTotal(totalAnterior, total);
    totalAnterior = total;

    /* Mensaje de WhatsApp con el desglose */
    var msg = [
      "Hola The Compas Refrigeración 👋",
      "Quiero agendar " + m.accion + " con esta cotización:",
      "",
      "• Tipo: " + tipo.nombre + " — RD$ " + fmt.format(tipo.precio)
    ];
    if(m.electricidad){
      msg.push("• Punto de electricidad: " + (extraElec ? "Sí (+RD$ " + fmt.format(extraElec) + ")" : "No"));
    }
    msg.push("");
    msg.push("TOTAL ESTIMADO: RD$ " + fmt.format(total));
    if(m.regalo){
      msg.push("🎁 Incluye la verificación gratis de mi equipo A/A.");
    }
    msg.push("");
    msg.push("¿Cuándo tienen disponibilidad?");

    btnWa.href = waLink(CONFIG.waPrincipal, msg.join("\n"));
  }

  /* ===== Botones de cada tarjeta: fijan modo + plan exacto en el cotizador ===== */
  $$('[data-wa="tier"]').forEach(function(el){
    el.addEventListener("click", function(e){
      e.preventDefault();
      var targetId = el.dataset.target;
      var modoTarget = el.dataset.modo;

      if(modoTarget){
        aplicarModo(modoTarget);
      }

      var radio = document.getElementById(targetId);
      if(radio){
        radio.checked = true;
      }

      calcular();

      var cotizadorSection = $("#cotizador");
      if(cotizadorSection){
        cotizadorSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  /* ===== Selector Instalación / Mantenimiento ===== */
  $$(".modeBtn").forEach(function(b){
    b.addEventListener("click", function(){ aplicarModo(b.dataset.modo); });
  });

  /* ===== Eventos ===== */
  $$('input[name="tipo-instalacion"]').forEach(function(r){ r.addEventListener("change", calcular); });
  $$('input[name="tipo-mantenimiento"]').forEach(function(r){ r.addEventListener("change", calcular); });
  chkElec.addEventListener("change", calcular);
  $("#cotizador-form").addEventListener("submit", function(e){ e.preventDefault(); });

  calcular();
})();