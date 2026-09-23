# Despliegue en GitHub Pages - ACADEMIX

Esta carpeta (`proyectohtml`) contiene la versión estática compilada (HTML5, JS y CSS con rutas relativas `./`) lista para desplegar en GitHub Pages o cualquier servicio de hosting estático (Netlify, Vercel, Firebase Hosting, etc.).

## Estructura de archivos
- `index.html`: Punto de entrada principal HTML de la aplicación.
- `404.html`: Respaldo para rutas y navegación directa en GitHub Pages.
- `.nojekyll`: Desactiva el motor Jekyll en GitHub para permitir la carga sin restricciones de todos los activos.
- `assets/`: Estilos CSS, lógica JavaScript empaquetada e iconos/imágenes.

---

## Cómo desplegar en GitHub

### Opción A: Desplegar subiendo el contenido a un repositorio nuevo
1. Crea un repositorio público o privado en GitHub (ejemplo: `academix`).
2. Abre la terminal en la carpeta `proyectohtml`:
   ```bash
   cd proyectohtml
   git init
   git add .
   git commit -m "Despliegue inicial de ACADEMIX en HTML"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/academix.git
   git push -u origin main
   ```
3. En GitHub, ve a tu repositorio:
   - Haz clic en **Settings** (Configuración) > **Pages**.
   - En **Build and deployment** > **Source**, elige **Deploy from a branch**.
   - Selecciona la rama `main` y la carpeta `/ (root)`.
   - Haz clic en **Save**.
4. ¡Listo! Tu sitio estará publicado en: `https://TU_USUARIO.github.io/academix/`

---

### Opción B: Desplegar desde el repositorio principal existente usando GitHub Pages
Si ya tienes este proyecto en Git y quieres publicar únicamente la carpeta `proyectohtml`:
```bash
git add proyectohtml -f
git commit -m "Compilación HTML en carpeta proyectohtml"
git subtree push --prefix proyectohtml origin gh-pages
```
En **Settings** > **Pages** de GitHub, selecciona la rama `gh-pages` y `/ (root)`.

---

## Cómo volver a compilar
Si realizas modificaciones al código y necesitas regenerar esta carpeta:
```bash
npm run build:html
```
