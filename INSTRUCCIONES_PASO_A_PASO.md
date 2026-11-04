# 📖 GUÍA SENCILLA: PROYECTOR LBC (IGLESIA CUADRANGULAR LAS BRISAS)
### Cómo usar el programa, cargar tu Biblia, canciones, karaoke y crear tu archivo .exe

¡Hola! No te preocupes si no eres programador. El programa ya está funcionando en tu computadora y aquí te explicamos cada punto de forma sencilla y directa:

---

## 1. 📖 ¿POR QUÉ GÉNESIS TENÍA POCOS VERSÍCULOS Y CÓMO CARGAR TUS ARCHIVOS COMPLETOS?
- Inicialmente el programa traía un texto de ejemplo reducido (placeholder) para que no pesara la descarga.
- **¡Ahora ya tienes Génesis 1 (31 versículos) y Génesis 2 (25 versículos) completos incorporados!**
- **Cómo cargar tus 66 libros completos:**
  1. En la pestaña **"Biblia (66 Libros)"**, arriba en la barra superior verás un botón azul que dice:
     **`📂 Cargar Carpeta data/biblia (66 Libros)`**
  2. Haz clic en él y selecciona tu carpeta `data/biblia` (o la carpeta `versiones/rv1960`).
  3. El programa leerá los 66 archivos JSON a la vez y los guardará en la base de datos interna de tu computador (**IndexedDB**).
  4. ¡Listo! Quedarán guardados para siempre en tu computador, incluso si cierras y vuelves a abrir la aplicación.

---

## 2. 🔢 CAPÍTULOS 49 Y 50 (SOLUCIÓN DEL BORDE TAPADO)
- Ya corregimos el espaciado y la barra de desplazamiento en la columna de capítulos. Ahora tiene margen inferior amplio (`pb-24`), de modo que los capítulos 49 y 50 de Génesis (y el 150 de Salmos) se pueden ver y pulsar cómodamente sin chocar contra el borde.
- Además, movimos el botón de importar a la parte superior para que nunca más se superponga con el pie de página.

---

## 3. 🖥️ ¿POR QUÉ LA VENTANA DE PROYECCIÓN ESTABA EN BLANCO Y CÓMO FUNCIONA AHORA?
- Anteriormente la pantalla de proyección (`display.html`) se quedaba en negro esperando que el operador seleccionara una canción o versículo.
- **¡Ahora ya no se ve en blanco!** Cuando abres el proyector sin ninguna letra seleccionada, muestra una elegante **Pantalla de Espera (Standby)** con:
  - El logo y nombre de la **Iglesia Cristiana Cuadrangular Las Brisas**.
  - El versículo lema: *"Jesucristo es el mismo ayer, y hoy, y por los siglos" — Hebreos 13:8*.
  - Indicador verde de conexión activa.
- Al tocar cualquier versículo o estrofa en el panel de control, la pantalla cambia instantáneamente al texto proyectado con fondo dinámico.

---

## 4. 🔘 ¿PARA QUÉ SIRVEN LOS BOTONES VISIBLES?
- **Blackout (Tecla B / F5 / Botón Ojito):** 
  Significa "Apagón de Pantalla". Pone el proyector totalmente en negro. Es fundamental durante el culto: cuando el pastor comienza a predicar, o en un momento solemne de oración o ministración donde la congregación debe concentrarse sin distracciones de texto o luces en la pared. Al presionar **B** se apaga; al volver a presionar **B** regresa lo que estabas proyectando.
- **Limpiar (Tecla C / F4):** 
  Quita el texto de la pantalla pero mantiene el fondo visual o animación. Se usa mucho cuando termina una canción y hay un solo musical o una pausa antes de la siguiente estrofa.
- **Descargar ZIP:** 
  Servía para descargar el código a tu PC. Ahora en la pestaña **"Ajustes"** puedes desactivar la casilla *"Mostrar botón Descargar ZIP en la cabecera"* y desaparecerá de la barra superior.

---

## 5. 🎵 CANCIONES Y CANCIONEROS (Corario.json y Mi Cancionero.json)
- El programa ya incluye más de 300 canciones pre-cargadas.
- **Para cargar tus archivos propios:** Ve a la pestaña **"Canciones"** y pulsa el botón azul **`+ Cargar JSON`**. Selecciona tu archivo `Corario.json` o `Mi Cancionero.json`. El programa los integra al instante con el buscador en tiempo real.
- **Para crear alabanzas nuevas:** Pulsa el botón dorado **`+ Nueva`**, escribe el título, pega la letra y presiona *Guardar*. Se agregará a tu repertorio local sin necesidad de editar archivos JSON a mano.

---

## 6. 🎤 ¿CÓMO FUNCIONA EL MÓDULO DE KARAOKE?
- Ve a la pestaña **"Karaoke"**:
  1. Tienes un reproductor de audio completo con botones de **Reproducir**, **Pausa**, **Detener**, barra de tiempo y volumen.
  2. Puedes pulsar **`Cargar MP3/WAV`** para reproducir pistas instrumentales que tengas en tu computadora.
  3. A la derecha verás las estrofas de la alabanza seleccionada. Haz clic en cualquier estrofa o pulsa el botón **`Siguiente Estrofa ➡`** para proyectar la letra en vivo sincronizada con la música.

---

## 7. ⚙️ ¿QUÉ HACE LA PESTAÑA DE AJUSTES?
Ahora tienes control total de la apariencia:
- **Tipografía de Pantalla:** Puedes cambiar la fuente entre Segoe UI, Montserrat, Inter, Roboto, Merriweather (Serif Bíblica eclesiástica) y Arial.
- **Tamaño y Color de Letra:** Control de tamaño con barra deslizante y paleta de colores (Blanco Puro, Dorado Cálido, Amarillo Suave, Celeste Cielo).
- **Sombra de Texto:** Activar o desactivar sombra negra profunda para que las letras se lean perfectamente sobre cualquier fondo.
- **Alineación:** Centrada o alineada a la izquierda.
- **Tema del Operador:** Cambiar entre Modo Oscuro (Azul Noche Cuadrangular) y Modo Claro.
- **Nombre de la Iglesia:** Personalizar el texto que aparece en la cabecera y en la pantalla de espera.
- **Copia de Respaldo:** Botón para descargar un archivo de copia de seguridad con todas tus canciones modificadas.

---

## 8. 🖼️ AJUSTE DE FONDOS Y LOGOS (SIN DEFORMAR NI CORTAR)
- En la pestaña **"Fondos"**, cuando subas una imagen propia (como el logo Cuadrangular):
  - **Ajuste de Imagen:** Selecciona **🎯 Completa (No cortar)** para que el logo se vea entero en el centro sin que se le corten los bordes. Si tienes una foto panorámica, usa **📐 Rellenar Pantalla**.
  - **Filtro Oscuro para Letras:** Si tu fondo tiene colores claros o blancos, activa el filtro en **45% (Óptimo)** para que las letras blancas de alabanza o Biblia resalten con total nitidez.

---

## 9. 🎬 REPRODUCTOR DE YOUTUBE (SIN ERROR 153)
- El reproductor de YouTube ahora incluye autorización de origen y cabeceras seguras para reproducir videos sin el Error 153.
- Si un video tiene restricciones de reproducción impuestas por su autor o tu red local, cuentas con el enlace directo **`Abrir directamente en YouTube`** para lanzarlo al instante.

---

## ⚡ CÓMO CREAR TU ARCHIVO INSTALADOR .EXE FINAL:
1. En la carpeta del proyecto, haz doble clic en el archivo:
   **`3-CREAR-INSTALADOR-EXE.bat`**
2. Windows compilará el programa y en 1-2 minutos creará tu archivo ejecutable `.exe` dentro de la carpeta `dist-electron` listo para instalar en el computador del templo.

---
*Proyector LBC • Creado por: **LuftmandMauricio** (Personal Branding) • Iglesia Cristiana Cuadrangular Las Brisas*
