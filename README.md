# Proyector LBC — Sistema de Proyección Eclesiástica ✝️👑🕊️🍷

**Desarrollado y Creado por:** **LuftmandMauricio**  
**Para:** **Iglesia Cristiana Cuadrangular — Barrio Las Brisas**  
**Versión:** 2.0.0 (Dual: Aplicación de Escritorio Offline + Web App PWA)

---

## 📖 Descripción del Proyecto

**Proyector LBC** es una plataforma profesional de software eclesiástico diseñada a la medida para la dirección de culto, proyección bíblica multiversión, cancioneros litúrgicos con buscador instantáneo, fondos dinámicos y transmisión en vivo para OBS Studio.

El sistema fue concebido por **LuftmandMauricio** con una arquitectura de doble ventana sincronizada en tiempo real mediante canales bidireccionales (`BroadcastChannel` y `localStorage`), garantizando que la audiencia solo vea texto limpio, sagrado y fondos litúrgicos, mientras el operador mantiene control total en su consola privada.

---

## 🌟 Características Principales

1. **Biblia Multiversión Completa (66 Libros Canónicos):**
   - Compatible con **Reina-Valera 1960 (RV1960)**, **Nueva Versión Internacional (NVI)**, **Nueva Traducción Viviente (NTV)**, **La Biblia de las Américas (LBLA)**, **Dios Habla Hoy (DHH)** y **Traducción en Lenguaje Actual (TLA)**.
   - Navegación rápida por Testamentos, Grupos (Pentateuco, Históricos, Evangelios, Epístolas, etc.).
   - Atajos de teclado: Flechas `←` y `→` para saltar de versículo al instante.
   - Etiqueta litúrgica clara en pantalla (ej: *Lucas 6:17 (RV1960)*).

2. **Cancionero Eclesiástico y Alabanza:**
   - Carga masiva de repertorios en formato JSON (más de 500 canciones de alabanza y adoración).
   - Buscador ultrarrápido por título, letra o frase clave.
   - Navegación estrofa por estrofa con un solo clic.
   - **Privacidad Litúrgica:** En las canciones se omite el título técnico o nombre de archivo en la pantalla del templo para una adoración limpia sin distracciones visuales.

3. **Fondos Visuales, Logos de la Iglesia y Bucles de Video (MP4):**
   - Selector de ajuste de imagen: **"🎯 Completa (No cortar)"** (`contain`) para preservar intacto el logo de los 4 símbolos cuadrangulares y banners de eventos; o **"📐 Rellenar Pantalla"** (`cover`).
   - Filtro Scrim oscuro ajustable (0%, 30%, 45%, 65%) con sombra tipográfica para lectura nítida de letras sobre cualquier color de fondo.
   - Soporte para videos MP4 en bucle continuo de adoración.

4. **Galería de Diapositivas y Eventos Especiales:**
   - Subida y gestión de afiches, anuncios, retiros espirituales y cultos especiales (ej. cultos infantiles, aniversarios).
   - Botón para eliminar afiches antiguos cuando finalice el evento.

5. **Modo Blackout (B) y Limpiar (C):**
   - Tecla **B (Blackout):** Fundido instantáneo a negro en el proyector sin perder el versículo o canción activa.
   - Tecla **C (Clear):** Oculta el texto y deja el fondo o logo de la iglesia visible.

6. **Integración con OBS Studio:**
   - Vista de transparencia (`/obs.html`) para superponer letras limpias sobre la cámara del templo en transmisiones en vivo (Facebook Live, YouTube Live).

---

## 📂 ¿Qué archivos se deben subir a GitHub y cuáles NO?

Para mantener tu repositorio limpio, profesional y seguro, sigue esta regla:

### ✅ SÍ se deben subir a GitHub (Archivos del Código Fuente):
- `src/` (Todo el código React, componentes, lógica de negocio y estilos).
- `public/` (Plantillas `display.html`, `obs.html`, logos de la iglesia, datos de canciones y biblias).
- `electron-main.js` (Configuración de la ventana doble para Windows/Mac).
- `package.json` y `package-lock.json` (Lista de dependencias y versiones exactas).
- `vite.config.ts` y `tsconfig.json` (Configuración del compilador).
- `index.html` (Entrada web del sistema).
- `.gitignore` (Reglas de exclusión de Git).
- `.env.example` (Plantilla de variables de entorno sin contraseñas).
- `1-INSTALAR-DEPENDENCIAS.bat`, `2-EJECUTAR-PROGRAMA.bat`, `3-CREAR-INSTALADOR-EXE.bat` (Lanzadores de Windows).
- `README.md` e `INSTRUCCIONES_PASO_A_PASO.md` (Documentación).

### ❌ NO se deben subir a GitHub (Están excluidos en `.gitignore`):
- `node_modules/` (Carpeta gigante de librerías; se genera sola con `npm install`).
- `dist/` o `dist-electron/` (Archivos compilados temporales).
- `*.zip` o `public/*.zip` (Archivos comprimidos binarios).
- `.env` (Cualquier archivo de configuración con credenciales privadas).

---

## 🚀 Cómo Ejecutar el Proyecto en una Computadora Local

### Prerrequisitos:
- Tener instalado [Node.js (LTS)](https://nodejs.org/).

### Pasos Rápidos (Windows con doble clic):
1. **Paso 1:** Haz doble clic en `1-INSTALAR-DEPENDENCIAS.bat` (Solo se hace la primera vez).
2. **Paso 2:** Haz doble clic en `2-EJECUTAR-PROGRAMA.bat`.  
   *¡Listo! Se abrirá automáticamente la aplicación.*
3. **Paso 3 (Opcional):** Si quieres generar el instalador de escritorio de Windows (`.exe`), haz doble clic en `3-CREAR-INSTALADOR-EXE.bat`.

---

## 🏛️ Recomendación para Presentar a la Auditoría y Liderazgo de la Iglesia

Cuando vayas a presentar este proyecto ante los pastores, junta directiva o auditoría de la Iglesia Cristiana Cuadrangular Las Brisas, **sigue esta estrategia en 3 niveles**:

1. **Nivel 1: Demostración Rápida Online (Para que ellos lo prueben ya mismo en sus celulares o laptops):**
   - Comparte el enlace de la aplicación web desplegada.
   - No tienen que instalar nada ni entender de programación. Pueden abrirlo desde cualquier navegador y ver que el sistema funciona inmediatamente.

2. **Nivel 2: Demostración en el Templo con Proyector Físico (Prueba Real):**
   - En la laptop del ministerio de alabanza y audiovisuales de la iglesia, ejecuta el programa o instala el archivo `.exe`.
   - Conecta el cable HDMI del proyector o pantalla del templo y presiona el botón amarillo **"🖥️ Proyector"**.
   - Muestra cómo la pantalla secundaria abre la proyección limpia y cómo tú cambias versículos y letras de canciones en tiempo real sin congelarse.

3. **Nivel 3: El Repositorio de GitHub (Para la Auditoría Técnica):**
   - GitHub servirá como tu **respaldo oficial de autoría** y prueba documental de desarrollo realizada por **LuftmandMauricio**.
   - Muestra este repositorio con su historial de commits, su código ordenado y la documentación paso a paso.

---

## 👤 Créditos y Marca Personal

- **Autor y Desarrollador Principal:** **LuftmandMauricio**
- **Institución:** Iglesia Cristiana Cuadrangular — Barrio Las Brisas
- **Licencia:** Apache 2.0 / Uso eclesiástico exclusivo
