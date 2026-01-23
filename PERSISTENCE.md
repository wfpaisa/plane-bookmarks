# Sistema de Persistencia - Guía de Uso

## Descripción

El sistema de persistencia permite guardar y cargar los bookmarks automáticamente usando un servidor backend con almacenamiento en archivos JSON.

## Arquitectura

- **Frontend**: React + Vite
- **Backend**: Express.js
- **Almacenamiento**: Archivo JSON (`server/data/bookmarks.json`)

## Instalación

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
bun install
```

## Desarrollo

### Iniciar servidor y cliente simultáneamente

```bash
bun run dev
```

Este comando inicia:

- **Backend**: `http://localhost:3001`
- **Frontend**: `http://localhost:5173`

### Iniciar solo el cliente (frontend)

```bash
bun run dev:client
```

### Iniciar solo el servidor (backend)

```bash
bun run server
```

## API Endpoints

### GET /api/bookmarks

Obtiene todos los bookmarks almacenados.

**Respuesta:**

```json
[
  {
    "id": "1",
    "name": "Mi Bookmark",
    "url": "https://example.com",
    "children": []
  }
]
```

### POST /api/bookmarks

Guarda todos los bookmarks (reemplaza el contenido completo).

**Body:**

```json
[
  {
    "id": "1",
    "name": "Mi Bookmark",
    "url": "https://example.com"
  }
]
```

### PUT /api/bookmarks

Actualiza/sincroniza todos los bookmarks.

**Body:** Mismo formato que POST

### DELETE /api/bookmarks

Elimina todos los bookmarks.

### GET /api/health

Verifica el estado del servidor.

**Respuesta:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-22T..."
}
```

## Funcionamiento

1. **Carga inicial**: Al abrir la aplicación, se cargan los bookmarks desde el servidor
2. **Sincronización automática**: Cada cambio (crear, mover, renombrar, eliminar) se sincroniza automáticamente con el servidor
3. **Modo offline**: Si el servidor no está disponible, la aplicación funciona en modo local y muestra una advertencia

## Archivo de Datos

Los bookmarks se almacenan en:

```
server/data/bookmarks.json
```

Este archivo se crea automáticamente la primera vez que guardas datos.

## Variables de Entorno

Puedes configurar la URL de la API en el archivo `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## Características

✅ Persistencia automática de todos los cambios  
✅ Sincronización en tiempo real  
✅ Detección de conexión con el servidor  
✅ Modo offline con datos locales  
✅ API REST completa  
✅ Almacenamiento en archivo JSON  
✅ Soporte para archivos grandes (hasta 50MB)

## Solución de Problemas

### El servidor no inicia

- Verifica que el puerto 3001 esté libre
- Revisa los logs en la terminal

### Los cambios no se guardan

- Verifica que el servidor esté ejecutándose
- Revisa la consola del navegador para errores
- Comprueba que existe la carpeta `server/data`

### Error de CORS

- Verifica que el servidor tenga CORS habilitado (ya está configurado)
- Comprueba la URL de la API en `.env`

### Error "PayloadTooLargeError"

Si recibes este error al importar archivos grandes:

- El servidor está configurado para aceptar hasta 50MB
- Si necesitas más espacio, edita `server/server.ts` y aumenta el valor en `express.json({ limit: '50mb' })`
- Considera dividir archivos muy grandes en múltiples importaciones
