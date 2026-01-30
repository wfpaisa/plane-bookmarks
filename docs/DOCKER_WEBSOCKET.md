# WebSocket Configuration for Docker

Para que los WebSockets funcionen correctamente en Docker:

## 1. Configuración de red

El docker-compose.yml está configurado para:

- Exponer puerto 5173 (Vite client)
- Exponer puerto 3001 (API + WebSocket)
- Ambos servicios en la misma red Docker

## 2. Variables de entorno

En el contenedor Docker:

```
VITE_SOCKET_URL=http://localhost:3001
```

Para acceso desde el host, usar:

```
VITE_SOCKET_URL=http://localhost:3001
```

Para acceso desde otros contenedores:

```
VITE_SOCKET_URL=http://plane-bookmark:3001
```

## 3. Vite Proxy

El archivo `vite.config.ts` incluye:

- Proxy para `/api` → http://localhost:3001
- Proxy para `/socket.io` → http://localhost:3001 con `ws: true`

## 4. Socket.IO CORS

El servidor está configurado con:

```typescript
cors: {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}
```

## 5. Persistencia de datos

Los bookmarks se guardan en `./server/data` que está montado como volumen.

## Comandos útiles

Construir y ejecutar:

```bash
docker-compose up --build
```

Ver logs:

```bash
docker-compose logs -f
```

Reiniciar:

```bash
docker-compose restart
```

Detener:

```bash
docker-compose down
```
