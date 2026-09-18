# ACADEMIX SENA - Proyecto HTML5 Standalone para GitHub

Este directorio contiene la versión **100% HTML5, CSS y JavaScript** de **ACADEMIX SENA**, lista para ser subida y desplegada directamente en **GitHub Pages**, servidores web Apache/Nginx, o cualquier servicio de hosting estático (Netlify, Vercel, Firebase Hosting, etc.) sin necesidad de compilar ni instalar dependencias de Node.js.

---

## 🚀 Cómo subir y desplegar en GitHub Pages

### Opción 1: Crear un nuevo repositorio en GitHub
1. Abre tu terminal o cliente Git.
2. Entra a esta carpeta `proyectohtml`:
   ```bash
   cd proyectohtml
   git init
   git add .
   git commit -m "Initial commit - Academix SENA HTML"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```
3. En GitHub, ve a tu repositorio › **Settings** › **Pages**.
4. En **Build and deployment** › **Source**, selecciona `Deploy from a branch`.
5. En **Branch**, selecciona `main` y la carpeta `/ (root)`. Haz clic en **Save**.
6. ¡Listo! En 1-2 minutos tu aplicación estará en línea en `https://TU_USUARIO.github.io/TU_REPOSITORIO/`.

### Opción 2: Dentro del repositorio principal existente
Si subes todo el proyecto a GitHub:
1. Ve a **Settings** › **Pages** en tu repositorio.
2. Puedes desplegar apuntando a la rama `main` y seleccionando la carpeta donde esté el proyecto.

---

## 🛠️ Características Incluidas en la Versión HTML

1. **Persistencia en la Nube con Supabase:**
   - Conexión directa a Supabase (PostgreSQL) usando la librería CDN `@supabase/supabase-js`.
   - Soporte para datos locales mediante `localStorage` en caso de modo sin conexión.
2. **Almacenamiento de Fotos en Supabase Storage:**
   - Bucket `perfiles` para fotos de perfil de instructores y aprendices.
3. **Módulos Formativos Completos:**
   - **Panel General:** Vista de ficha, métricas de asistencia, distribución de aprendices y RAPs.
   - **Cargar Información:** Importación masiva de aprendices y competencias vía archivos Excel (`.xlsx`) y CSV con SheetJS.
   - **Toma de Asistencia:** Estados (Presente, Injustificada, Justificada, Retardo, Excusado) con guardado y exportación.
   - **Calificaciones:** Evaluación cualitativa de RAPs (Aprobado / No Aprobado) y cálculo de avance formativo.
   - **Consultas & Reportes:** Filtros avanzados, descargas en Excel e historial.
   - **Llamados de Atención & Actas Oficiales:** Registro de actas disciplinarias y generador de formato oficial SENA imprimible / descargable en PDF.
   - **Vista de Aprendiz:** Portal individual con subida de foto de perfil y consulta de estado académico.

---

## ⚙️ Configuración de Supabase

El archivo `app.js` viene configurado con el proyecto de Supabase. Para habilitar el Storage y los permisos de base de datos:
1. Entra a tu proyecto en Supabase.
2. Ve a **Storage** › **New Bucket**, nómbralo `perfiles` y marca **Public bucket**.
3. En el **SQL Editor**, ejecuta el script SQL que se encuentra en el botón de Supabase de la app.
