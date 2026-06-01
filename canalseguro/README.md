# 🛡️ CanalSeguro

**Canal de denuncia ciudadana anónima y cifrada.**

CanalSeguro es una aplicación web prototipo (SPA) concebida como un canal de denuncia
ciudadana que permite reportar irregularidades relacionadas con **corrupción**,
**minería ilegal**, **crimen organizado** y **abuso de autoridad**, garantizando el
anonimato del denunciante mediante la ausencia de datos de identificación, la
supresión de metadatos en los archivos adjuntos y la emisión de un código de
seguimiento irrecuperable.

Inspirada en plataformas de denuncia segura como **SecureDrop** y **GlobaLeaks**, está
construida con **HTML5, CSS3 y JavaScript nativo**, sin dependencias de terceros.

---

## ✨ Características

- **Formulario de denuncia en tres pasos** — categoría, descripción y revisión previa.
- **Carga de evidencia con arrastrar y soltar** y validación de tamaño (máx. 25 MB).
- **Supresión de metadatos** — las imágenes se reprocesan en el navegador para eliminar
  datos EXIF (ubicación GPS, dispositivo, fecha).
- **Código de seguimiento único e irrecuperable** generado con una fuente criptográfica,
  con copiado al portapapeles compatible con móviles.
- **Consulta de estado** por código.
- **Preguntas frecuentes** con acordeón accesible.
- **Indicador de seguridad de la conexión** con recomendación del Navegador Tor.
- **Modo de alto contraste** y navegación por teclado (accesibilidad).
- **Diseño responsivo** con variables CSS para una identidad visual centralizada.

---

## 🗂️ Estructura del proyecto

```
canalseguro/
├── index.html              # Estructura de la SPA y todas las vistas
├── assets/
│   ├── css/
│   │   └── styles.css      # Estilos, variables e identidad visual + alto contraste
│   └── js/
│       └── app.js          # Lógica: enrutado, formulario, metadatos, consulta, etc.
├── .nojekyll               # Evita el procesamiento Jekyll en GitHub Pages
├── LICENSE                 # Licencia MIT
└── README.md
```

---

## 📋 Historias de usuario implementadas

| ID      | Historia                                        | Estado |
|---------|-------------------------------------------------|--------|
| HU-001  | Enviar denuncia anónima                         | ✅     |
| HU-002  | Adjuntar evidencia con supresión de metadatos   | ✅     |
| HU-003  | Obtener código de seguimiento único             | ✅     |
| HU-004  | Consultar estado de la denuncia                 | ✅     |
| HU-005  | Revisar la denuncia antes de enviarla           | ✅     |
| HU-006  | Acceder a secciones informativas (FAQ)          | ✅     |
| HU-007  | Indicador de seguridad de la conexión           | ✅     |
| HU-008  | Accesibilidad y alto contraste                  | ✅     |
| HU-009  | Despliegue público accesible (GitHub Pages)     | ✅     |

Correcciones incorporadas: validación de categoría obligatoria, copiado en móviles
(BUG-02), cierre de la sección previa del acordeón (BUG-03) y validación del tamaño
máximo de archivo (BUG-04).

---

## 🚀 Ejecución local

No requiere compilación. Basta con servir la carpeta con cualquier servidor estático:

```bash
# Opción 1: Python
python3 -m http.server 8000

# Opción 2: Node
npx serve .
```

Luego abre `http://localhost:8000` en el navegador.

---

## 🌐 Despliegue en GitHub Pages

1. En GitHub: **Settings → Pages**.
2. En *Build and deployment*, selecciona **Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)`.
4. Guarda. El sitio quedará disponible en `https://<usuario>.github.io/canalseguro/`.

> El archivo `.nojekyll` evita que GitHub Pages procese el sitio con Jekyll.

---

## 🔒 Nota sobre el prototipo

Esta es una demostración funcional con fines académicos. El cifrado del lado del
servidor y la recepción real de denuncias forman parte del *backlog* del proyecto; en
esta versión las denuncias se guardan únicamente en el **almacenamiento local del
navegador** (`localStorage`) para demostrar el flujo de extremo a extremo (envío →
código → consulta de estado).

---

## 🧭 Metodología

Desarrollado de forma individual aplicando un enfoque ágil **Kanban** (con prácticas
puntuales de Scrum). El trabajo se gestionó con un tablero Kanban con límites de WIP,
una bitácora diaria reflejada en los mensajes de commit (Conventional Commits) y
seguimiento de incidencias mediante **GitHub Issues**.

---

## 📄 Licencia

Distribuido bajo licencia **MIT**. Consulta el archivo [`LICENSE`](LICENSE).
