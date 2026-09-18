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
    precioPiso: 500,                  // por cada piso adicional
    precioElectricidad: 500,          // punto de electricidad
    pisoMax: 15
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

  /* ===== Botones de cada tarjeta: precargan el cotizador ===== */
  $$('[data-wa="tier"]').forEach(function(el){
    el.addEventListener("click", function(){
      var radio = $('input[name="tipo"][value="'+ el.dataset.precio +'"]');
      if(radio){ radio.checked = true; calcular(); }
    });
  });

  /* =========================================================
     COTIZADOR
     ========================================================= */
  var piso = 1;
  var elOut    = $("#pisoOut");
  var btnMenos = $("#pisoMenos");
  var btnMas   = $("#pisoMas");
  var chkElec  = $("#elec");
  var outTotal = $("#total");
  var lineas   = $("#lineas");
  var btnWa    = $("#waCotiza");
  var totalAnterior = 0;

  function tipoSeleccionado(){
    var r = $('input[name="tipo"]:checked');
    return { precio: parseInt(r.value,10), nombre: r.dataset.nombre };
  }

  function renderPiso(){
    elOut.textContent = "Piso " + piso;
    btnMenos.disabled = piso <= 1;
    btnMas.disabled   = piso >= CONFIG.pisoMax;
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
    var tipo    = tipoSeleccionado();
    var niveles = piso - 1;
    var extraPiso = niveles * CONFIG.precioPiso;
    var extraElec = chkElec.checked ? CONFIG.precioElectricidad : 0;
    var total = tipo.precio + extraPiso + extraElec;

    /* Desglose visible */
    lineas.textContent = "";
    lineas.appendChild(fila(tipo.nombre, "RD$ " + fmt.format(tipo.precio)));
    if(niveles > 0){
      lineas.appendChild(fila("Piso " + piso + " (" + niveles + " nivel" + (niveles>1?"es":"") + " adicional" + (niveles>1?"es":"") + ")", "RD$ " + fmt.format(extraPiso)));
    }else{
      lineas.appendChild(fila("Piso 1 (sin recargo)", "RD$ 0"));
    }
    if(extraElec > 0){
      lineas.appendChild(fila("Punto de electricidad", "RD$ " + fmt.format(extraElec)));
    }
    lineas.appendChild(fila("Verificación de tu equipo A/A", "Gratis", true));

    animarTotal(totalAnterior, total);
    totalAnterior = total;

    /* Mensaje de WhatsApp con el desglose */
    var msg = [
      "Hola The Compas Refrigeración 👋",
      "Quiero agendar una instalación con esta cotización:",
      "",
      "• Tipo: " + tipo.nombre + " — RD$ " + fmt.format(tipo.precio),
      "• Piso: " + piso + (niveles > 0 ? " (+RD$ " + fmt.format(extraPiso) + " por " + niveles + " nivel" + (niveles>1?"es":"") + ")" : " (sin recargo)"),
      "• Punto de electricidad: " + (extraElec ? "Sí (+RD$ " + fmt.format(extraElec) + ")" : "No"),
      "",
      "TOTAL ESTIMADO: RD$ " + fmt.format(total),
      "🎁 Incluye la verificación gratis de mi equipo A/A.",
      "",
      "¿Cuándo tienen disponibilidad?"
    ].join("\n");
    btnWa.href = waLink(CONFIG.waPrincipal, msg);
  }

  /* ===== Eventos ===== */
  btnMenos.addEventListener("click", function(){ if(piso > 1){ piso--; renderPiso(); calcular(); } });
  btnMas.addEventListener("click",   function(){ if(piso < CONFIG.pisoMax){ piso++; renderPiso(); calcular(); } });
  $$('input[name="tipo"]').forEach(function(r){ r.addEventListener("change", calcular); });
  chkElec.addEventListener("change", calcular);
  $("#cotizador-form").addEventListener("submit", function(e){ e.preventDefault(); });

  renderPiso();
  calcular();
})();
