/* =========================================================
   CanalSeguro — Lógica de la aplicación (JavaScript nativo)
   Sin dependencias de terceros.

   Funcionalidades implementadas (historias de usuario):
   - HU-001  Enviar denuncia anónima sin datos personales.
   - HU-002  Adjuntar evidencia con supresión de metadatos (EXIF) en imágenes.
   - HU-003  Generar un código de seguimiento único e irrecuperable.
   - HU-004  Consultar el estado de una denuncia por código.
   - HU-005  Revisar la denuncia antes de enviarla.
   - HU-006  Acceder a secciones informativas (FAQ con acordeón).
   - HU-007  Indicador de seguridad de la conexión (recomendación de Tor).
   - HU-008  Accesibilidad: modo de alto contraste y navegación por teclado.
   - BUG-02  Copiado del código al portapapeles compatible con móviles.
   - BUG-03  El acordeón cierra la sección previamente abierta.
   - BUG-04  Validación del tamaño máximo de archivo adjunto (25 MB).
   ========================================================= */

(function () {
  "use strict";

  const TAMANO_MAXIMO = 25 * 1024 * 1024; // 25 MB (BUG-04)
  const CLAVE_DENUNCIAS = "canalseguro:denuncias";
  const CLAVE_CONTRASTE = "canalseguro:altocontraste";

  /* ----------------------------------------------------------
     Utilidades
     ---------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function formatearTamano(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // Genera un código irrecuperable usando una fuente criptográfica.
  function generarCodigoSeguimiento() {
    const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos
    const bloques = [];
    const aleatorios = new Uint32Array(12);
    (window.crypto || window.msCrypto).getRandomValues(aleatorios);
    for (let b = 0; b < 3; b++) {
      let bloque = "";
      for (let i = 0; i < 4; i++) {
        bloque += alfabeto[aleatorios[b * 4 + i] % alfabeto.length];
      }
      bloques.push(bloque);
    }
    return "CS-" + bloques.join("-");
  }

  function leerDenuncias() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_DENUNCIAS)) || {};
    } catch (e) {
      return {};
    }
  }

  function guardarDenuncia(codigo, datos) {
    const todas = leerDenuncias();
    todas[codigo] = datos;
    try {
      localStorage.setItem(CLAVE_DENUNCIAS, JSON.stringify(todas));
    } catch (e) {
      /* almacenamiento no disponible: el flujo continúa igualmente */
    }
  }

  /* ----------------------------------------------------------
     Enrutado simple por secciones (SPA sin recargas)
     ---------------------------------------------------------- */
  const vistas = $$(".view");
  const enlacesNav = $$("[data-route]");

  function mostrarVista(nombre) {
    let encontrada = false;
    vistas.forEach((vista) => {
      const activa = vista.dataset.view === nombre;
      vista.hidden = !activa;
      if (activa) encontrada = true;
    });
    if (!encontrada) {
      // Ruta desconocida: volver al inicio.
      nombre = "inicio";
      vistas.forEach((v) => (v.hidden = v.dataset.view !== "inicio"));
    }
    // Resaltar el enlace de navegación activo.
    $$(".nav-list a").forEach((a) => {
      a.classList.toggle("is-active", a.dataset.route === nombre);
    });
    // Cerrar el menú móvil si estaba abierto.
    cerrarMenuMovil();
    // Llevar el foco al contenido principal para lectores de pantalla.
    const main = $("#main");
    if (main) main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function rutaActual() {
    return (location.hash || "#inicio").replace("#", "");
  }

  window.addEventListener("hashchange", () => mostrarVista(rutaActual()));

  /* ----------------------------------------------------------
     Menú móvil
     ---------------------------------------------------------- */
  const navToggle = $("#nav-toggle");
  const navList = $("#nav-list");

  function cerrarMenuMovil() {
    if (!navList) return;
    navList.classList.remove("is-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const abierto = navList.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(abierto));
    });
  }

  /* ----------------------------------------------------------
     Modo de alto contraste (HU-008)
     ---------------------------------------------------------- */
  const contrastToggle = $("#contrast-toggle");

  function aplicarContraste(activo) {
    document.body.classList.toggle("high-contrast", activo);
    if (contrastToggle) contrastToggle.setAttribute("aria-pressed", String(activo));
  }

  if (contrastToggle) {
    const guardado = localStorage.getItem(CLAVE_CONTRASTE) === "1";
    aplicarContraste(guardado);
    contrastToggle.addEventListener("click", () => {
      const activo = !document.body.classList.contains("high-contrast");
      aplicarContraste(activo);
      try {
        localStorage.setItem(CLAVE_CONTRASTE, activo ? "1" : "0");
      } catch (e) {}
    });
  }

  /* ----------------------------------------------------------
     Indicador de seguridad de la conexión (HU-007)
     ---------------------------------------------------------- */
  (function inicializarBannerSeguridad() {
    const banner = $("#security-banner");
    const texto = $("#security-banner__text");
    const boton = $("#security-banner__more");
    const tips = $("#security-tips");
    if (!banner || !texto) return;

    const esLocal = ["localhost", "127.0.0.1", ""].includes(location.hostname);
    const seguro = location.protocol === "https:" || esLocal;
    const esTor = location.hostname.endsWith(".onion");

    if (esTor) {
      banner.classList.add("is-secure");
      texto.innerHTML = "Conexión a través de Tor detectada. Tu anonimato de red está reforzado.";
    } else if (seguro) {
      banner.classList.add("is-secure");
      texto.innerHTML =
        "Conexión segura (cifrada). Para máximo anonimato, usa el <strong>Navegador Tor</strong>.";
    } else {
      banner.classList.add("is-insecure");
      texto.innerHTML =
        "⚠️ Conexión <strong>no segura</strong>. Verifica que la dirección use <strong>https://</strong> antes de denunciar.";
    }

    if (boton && tips) {
      boton.addEventListener("click", () => {
        const visible = !tips.hidden;
        tips.hidden = visible;
        boton.setAttribute("aria-expanded", String(!visible));
      });
    }
  })();

  /* ----------------------------------------------------------
     Acordeón de preguntas frecuentes (HU-006, BUG-03)
     ---------------------------------------------------------- */
  (function inicializarAcordeon() {
    const acordeon = $("#accordion");
    if (!acordeon) return;
    const triggers = $$(".accordion__trigger", acordeon);

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const expandido = trigger.getAttribute("aria-expanded") === "true";
        // BUG-03: cerrar cualquier sección abierta previamente.
        triggers.forEach((otro) => {
          otro.setAttribute("aria-expanded", "false");
          const panel = document.getElementById(otro.getAttribute("aria-controls"));
          if (panel) panel.hidden = true;
        });
        // Alternar la sección pulsada.
        if (!expandido) {
          trigger.setAttribute("aria-expanded", "true");
          const panel = document.getElementById(trigger.getAttribute("aria-controls"));
          if (panel) panel.hidden = false;
        }
      });
    });
  })();

  /* ----------------------------------------------------------
     Supresión de metadatos en imágenes (HU-002)
     Reprocesa la imagen mediante un canvas, lo que descarta los
     metadatos EXIF (ubicación GPS, dispositivo, fecha, etc.).
     ---------------------------------------------------------- */
  function suprimirMetadatosImagen(archivo) {
    return new Promise((resolve) => {
      if (!archivo.type.startsWith("image/")) {
        // Para archivos no-imagen no se procesan EXIF en el cliente.
        resolve({ limpio: false, nombre: archivo.name, tipo: archivo.type, tamano: archivo.size });
        return;
      }
      const url = URL.createObjectURL(archivo);
      const img = new Image();
      img.onload = function () {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          // El nuevo blob carece de metadatos EXIF.
          canvas.toBlob(
            function (blob) {
              URL.revokeObjectURL(url);
              resolve({
                limpio: true,
                nombre: archivo.name,
                tipo: archivo.type,
                tamano: blob ? blob.size : archivo.size,
              });
            },
            archivo.type === "image/png" ? "image/png" : "image/jpeg",
            0.92
          );
        } catch (e) {
          URL.revokeObjectURL(url);
          resolve({ limpio: false, nombre: archivo.name, tipo: archivo.type, tamano: archivo.size });
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve({ limpio: false, nombre: archivo.name, tipo: archivo.type, tamano: archivo.size });
      };
      img.src = url;
    });
  }

  /* ----------------------------------------------------------
     Formulario de denuncia en tres pasos (HU-001, HU-005)
     ---------------------------------------------------------- */
  (function inicializarFormulario() {
    const form = $("#report-form");
    if (!form) return;

    const pasos = $$(".form-step", form);
    const itemsStepper = $$(".stepper__item");
    const dropzone = $("#dropzone");
    const fileInput = $("#file-input");
    const fileList = $("#file-list");
    const errorFile = $("#error-file");
    const descripcion = $("#descripcion");
    const descCount = $("#desc-count");
    const confirmation = $("#confirmation");

    let pasoActual = 1;
    let adjuntos = []; // { nombre, tipo, tamano, limpio }

    /* --- Navegación entre pasos --- */
    function irAPaso(n) {
      pasoActual = n;
      pasos.forEach((p) => {
        const activo = Number(p.dataset.step) === n;
        p.classList.toggle("is-active", activo);
        p.hidden = !activo;
      });
      itemsStepper.forEach((it) => {
        const num = Number(it.dataset.step);
        it.classList.toggle("is-active", num === n);
        it.classList.toggle("is-done", num < n);
      });
      if (n === 3) rellenarRevision();
    }

    function validarPaso(n) {
      if (n === 1) {
        const elegida = form.querySelector('input[name="categoria"]:checked');
        toggleError("#error-categoria", !elegida);
        return !!elegida;
      }
      if (n === 2) {
        const valido = descripcion.value.trim().length >= 30;
        toggleError("#error-descripcion", !valido);
        descripcion.setAttribute("aria-invalid", String(!valido));
        if (!valido) descripcion.focus();
        return valido;
      }
      return true;
    }

    function toggleError(sel, mostrar, mensaje) {
      const el = $(sel);
      if (!el) return;
      el.hidden = !mostrar;
      if (mensaje) el.textContent = mensaje;
    }

    form.addEventListener("click", (e) => {
      const accion = e.target.closest("[data-action]");
      if (!accion) return;
      const tipo = accion.dataset.action;
      if (tipo === "next") {
        if (validarPaso(pasoActual)) irAPaso(pasoActual + 1);
      } else if (tipo === "prev") {
        irAPaso(pasoActual - 1);
      }
    });

    /* --- Contador de caracteres --- */
    if (descripcion && descCount) {
      descripcion.addEventListener("input", () => {
        descCount.textContent = descripcion.value.length + " caracteres";
        if (descripcion.value.trim().length >= 30) {
          $("#error-descripcion").hidden = true;
          descripcion.setAttribute("aria-invalid", "false");
        }
      });
    }

    /* --- Carga de archivos: clic, teclado y arrastrar/soltar --- */
    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      dropzone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInput.click();
        }
      });
      ["dragenter", "dragover"].forEach((ev) =>
        dropzone.addEventListener(ev, (e) => {
          e.preventDefault();
          dropzone.classList.add("is-dragover");
        })
      );
      ["dragleave", "drop"].forEach((ev) =>
        dropzone.addEventListener(ev, (e) => {
          e.preventDefault();
          dropzone.classList.remove("is-dragover");
        })
      );
      dropzone.addEventListener("drop", (e) => {
        if (e.dataTransfer && e.dataTransfer.files) procesarArchivos(e.dataTransfer.files);
      });
      fileInput.addEventListener("change", () => {
        procesarArchivos(fileInput.files);
        fileInput.value = "";
      });
    }

    async function procesarArchivos(lista) {
      errorFile.hidden = true;
      for (const archivo of Array.from(lista)) {
        // BUG-04: validación de tamaño máximo (25 MB).
        if (archivo.size > TAMANO_MAXIMO) {
          toggleError(
            "#error-file",
            true,
            `«${archivo.name}» supera el límite de 25 MB (${formatearTamano(archivo.size)}). No se adjuntó.`
          );
          continue;
        }
        const procesado = await suprimirMetadatosImagen(archivo);
        adjuntos.push(procesado);
      }
      renderizarAdjuntos();
    }

    function renderizarAdjuntos() {
      fileList.innerHTML = "";
      adjuntos.forEach((a, indice) => {
        const li = document.createElement("li");
        li.className = "file-item";
        const esImg = (a.tipo || "").startsWith("image/");
        li.innerHTML = `
          <span class="file-item__icon" aria-hidden="true">${esImg ? "🖼️" : "📄"}</span>
          <span class="file-item__info">
            <span class="file-item__name">${escaparHtml(a.nombre)}</span>
            <span class="file-item__meta">
              ${formatearTamano(a.tamano)}
              ${a.limpio ? '· <span class="file-item__clean">metadatos eliminados ✓</span>' : ""}
            </span>
          </span>
          <button type="button" class="file-item__remove" aria-label="Quitar ${escaparHtml(a.nombre)}">✕</button>
        `;
        li.querySelector(".file-item__remove").addEventListener("click", () => {
          adjuntos.splice(indice, 1);
          renderizarAdjuntos();
        });
        fileList.appendChild(li);
      });
    }

    /* --- Revisión previa (HU-005) --- */
    function rellenarRevision() {
      const cat = form.querySelector('input[name="categoria"]:checked');
      $("#review-categoria").textContent = cat ? cat.value : "—";
      $("#review-descripcion").textContent = descripcion.value.trim() || "—";
      $("#review-ubicacion").textContent = $("#ubicacion").value.trim() || "No especificada";
      $("#review-evidencia").textContent = adjuntos.length
        ? adjuntos.map((a) => a.nombre).join(", ")
        : "Sin archivos";
    }

    /* --- Envío de la denuncia (HU-001, HU-003) --- */
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const confirma = $("#confirma");
      if (!confirma.checked) {
        $("#error-confirma").hidden = false;
        return;
      }
      $("#error-confirma").hidden = true;

      const cat = form.querySelector('input[name="categoria"]:checked');
      const codigo = generarCodigoSeguimiento();

      guardarDenuncia(codigo, {
        codigo,
        categoria: cat ? cat.value : "",
        descripcion: descripcion.value.trim(),
        ubicacion: $("#ubicacion").value.trim(),
        adjuntos: adjuntos.map((a) => ({ nombre: a.nombre, tamano: a.tamano, limpio: a.limpio })),
        estado: "Recibida",
        fecha: new Date().toISOString(),
      });

      // Mostrar la confirmación con el código.
      form.hidden = true;
      $("#stepper").hidden = true;
      $("#tracking-code").textContent = codigo;
      confirmation.hidden = false;
      confirmation.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* --- Copiar código al portapapeles (HU-003, BUG-02 móviles) --- */
    const copyBtn = $("#copy-code");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const codigo = $("#tracking-code").textContent.trim();
        const feedback = $("#copy-feedback");
        const ok = await copiarAlPortapapeles(codigo);
        feedback.textContent = ok ? "✓ Código copiado al portapapeles" : "Selecciona y copia el código manualmente";
        setTimeout(() => (feedback.textContent = ""), 4000);
      });
    }

    /* --- Nueva denuncia --- */
    const nuevaBtn = $("#new-report");
    if (nuevaBtn) {
      nuevaBtn.addEventListener("click", () => {
        form.reset();
        adjuntos = [];
        renderizarAdjuntos();
        if (descCount) descCount.textContent = "0 caracteres";
        irAPaso(1);
        form.hidden = false;
        $("#stepper").hidden = false;
        confirmation.hidden = true;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  })();

  /* ----------------------------------------------------------
     Copiado compatible con móviles (BUG-02)
     Usa la API de Portapapeles cuando está disponible y recurre
     a una selección + execCommand como alternativa en navegadores
     móviles o contextos no seguros.
     ---------------------------------------------------------- */
  async function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(texto);
        return true;
      } catch (e) {
        /* continúa con la alternativa */
      }
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, texto.length); // necesario en iOS
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* ----------------------------------------------------------
     Consulta de estado por código (HU-004)
     ---------------------------------------------------------- */
  (function inicializarConsulta() {
    const form = $("#track-form");
    if (!form) return;
    const input = $("#track-input");
    const resultado = $("#track-result");

    const etiquetasEstado = {
      Recibida: "status-pill--recibida",
      "En revisión": "status-pill--revision",
      Cerrada: "status-pill--cerrada",
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const codigo = input.value.trim().toUpperCase();
      if (!codigo) {
        input.focus();
        return;
      }
      const denuncias = leerDenuncias();
      const d = denuncias[codigo];

      if (!d) {
        // BUG / mejora: mensaje claro de código no encontrado.
        resultado.innerHTML = `
          <div class="track-empty" role="alert">
            No encontramos ninguna denuncia con el código <strong>${escaparHtml(codigo)}</strong>.
            Verifica que lo hayas escrito exactamente como lo recibiste (incluidos los guiones).
            Recuerda que el código es irrecuperable y solo existe en el dispositivo donde se generó.
          </div>`;
        return;
      }

      const claseEstado = etiquetasEstado[d.estado] || "status-pill--recibida";
      const fecha = new Date(d.fecha);
      const fechaTxt = isNaN(fecha) ? "—" : fecha.toLocaleString("es-CO");
      const adjuntosTxt = d.adjuntos && d.adjuntos.length
        ? d.adjuntos.map((a) => escaparHtml(a.nombre)).join(", ")
        : "Sin archivos";

      resultado.innerHTML = `
        <div class="status-card">
          <div class="status-card__head">
            <h2 style="margin:0;">Denuncia ${escaparHtml(codigo)}</h2>
            <span class="status-pill ${claseEstado}">● ${escaparHtml(d.estado)}</span>
          </div>
          <dl>
            <div class="review__row"><dt>Categoría</dt><dd>${escaparHtml(d.categoria)}</dd></div>
            <div class="review__row"><dt>Fecha de envío</dt><dd>${fechaTxt}</dd></div>
            <div class="review__row"><dt>Ubicación</dt><dd>${escaparHtml(d.ubicacion || "No especificada")}</dd></div>
            <div class="review__row"><dt>Evidencia</dt><dd>${adjuntosTxt}</dd></div>
            <div class="review__row"><dt>Descripción</dt><dd class="review__desc">${escaparHtml(d.descripcion)}</dd></div>
          </dl>
        </div>`;
    });
  })();

  /* ----------------------------------------------------------
     Escapado de HTML para evitar inyección al renderizar datos
     ---------------------------------------------------------- */
  function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  /* ----------------------------------------------------------
     Arranque
     ---------------------------------------------------------- */
  mostrarVista(rutaActual());
})();
