# Arquitectura de Plane Bookmark

## 📐 Diagrama de Conexión

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Navegador (https://local-book.XXX.com)       │    │
│  │                                                     │    │
│  │  ┌──────────────────┐    ┌───────────────────┐   │    │
│  │  │  React Frontend  │    │  WebSocket Client │   │    │
│  │  │   (Puerto 5173)  │    │   (Socket.IO)     │   │    │
│  │  └──────────────────┘    └───────────────────┘   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NGINX PROXY MANAGER (Puerto 80/443)           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routing Rules:                                       │  │
│  │                                                        │  │
│  │  /          → localhost:5173  (Frontend)             │  │
│  │  /api       → localhost:3001  (API)                  │  │
│  │  /socket.io → localhost:3001  (WebSocket)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌───────────────────────┐   ┌───────────────────────┐
│   Frontend Server     │   │   Backend Server      │
│   (Vite Dev Server)   │   │   (Express + Socket)  │
│                       │   │                       │
│   localhost:5173      │   │   localhost:3001      │
│                       │   │                       │
│   - React App         │   │   - REST API          │
│   - Hot Reload        │   │   - WebSocket         │
│   - Static Files      │   │   - File Storage      │
└───────────────────────┘   └───────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │  Data Storage         │
                          │  server/data/         │
                          │  bookmarks.json       │
                          └───────────────────────┘
```

---

## 🔄 Flujo de Datos

### 1. Carga Inicial de la Aplicación

```
Usuario → https://local-book.XXX.com
    │
    ▼
Nginx Proxy Manager
    │
    ├─→ / → localhost:5173 → React App
    │
    └─→ /api/bookmarks → localhost:3001 → Express API
            │
            ▼
        bookmarks.json → Datos → React State
```

### 2. Conexión WebSocket

```
React App
    │
    │ socketService.connect()
    ▼
wss://local-book.XXX.com/socket.io
    │
    ▼
Nginx Proxy Manager
    │ (con WebSocket upgrade)
    ▼
ws://localhost:3001/socket.io
    │
    ▼
Socket.IO Server (Express)
    │
    ▼
✅ Conexión establecida
```

### 3. Actualización de Bookmarks (Tiempo Real)

```
Usuario edita bookmark en Cliente A
    │
    ▼
React App (Cliente A)
    │
    │ socketService.updateBookmarks(data)
    ▼
WebSocket → Backend
    │
    ├─→ Guardar en bookmarks.json
    │
    └─→ Broadcast a otros clientes
            │
            ▼
    WebSocket → Cliente B, Cliente C, etc.
            │
            ▼
    React State actualizado automáticamente
```

---

## 🔌 Configuración de Conexiones

### Desarrollo Local (localhost)

```javascript
// Frontend: http://localhost:5173
// Backend:  http://localhost:3001
// WebSocket: ws://localhost:3001/socket.io

const socketUrl = "http://localhost:3001";
// Conexión directa sin proxy
```

### Producción con Dominio Custom

```javascript
// Frontend: https://local-book.XXX.com
// Backend:  https://local-book.XXX.com/api
// WebSocket: wss://local-book.XXX.com/socket.io

const socketUrl = "https://local-book.XXX.com";
// Todo pasa por Nginx Proxy Manager
```

---

## 📊 Puertos y Servicios

| Componente          | Puerto | Protocolo | Acceso   |
| ------------------- | ------ | --------- | -------- |
| Frontend (Vite)     | 5173   | HTTP      | Interno  |
| Backend (Express)   | 3001   | HTTP + WS | Interno  |
| Nginx Proxy Manager | 81     | HTTP      | Admin UI |
| Nginx HTTP          | 80     | HTTP      | Público  |
| Nginx HTTPS         | 443    | HTTPS     | Público  |

---

## 🔐 Seguridad y CORS

### Backend Configuration

```javascript
// server/server.ts
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Acepta cualquier origen
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors()); // Habilita CORS para API REST
```

### Frontend Detection

```javascript
// src/services/socket.ts
const getSocketUrl = () => {
  if (hostname === "localhost") {
    return "http://localhost:3001"; // Desarrollo
  }
  return window.location.origin; // Producción
};
```

---

## 🚨 Puntos Críticos

### ⚠️ WebSocket requiere configuración especial

```nginx
# En Nginx Proxy Manager → Custom Location → /socket.io/
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_http_version 1.1;
```

**Sin estos headers, el WebSocket fallará con:**

```
❌ WebSocket connection to 'wss://...' failed
```

### ⚠️ El path debe terminar en /

```
✅ CORRECTO:   /socket.io/
❌ INCORRECTO: /socket.io
```

Sin el `/` final, Socket.IO no matchea correctamente la ruta.

---

## 🧪 Testing de Conexión

### Test 1: Frontend accesible

```bash
curl https://local-book.XXX.com
# Debe devolver HTML
```

### Test 2: API accesible

```bash
curl https://local-book.XXX.com/api/health
# Debe devolver: {"status":"ok","timestamp":"..."}
```

### Test 3: WebSocket (desde navegador)

```javascript
// Consola del navegador:
const socket = io("https://local-book.XXX.com");
socket.on("connect", () => console.log("✅ Conectado"));
```

---

## 📝 Checklist de Configuración

- [ ] Frontend corriendo en localhost:5173
- [ ] Backend corriendo en localhost:3001
- [ ] Nginx Proxy Manager configurado
- [ ] Domain apunta al servidor
- [ ] Location /api creada
- [ ] Location /socket.io/ creada con config WebSocket
- [ ] SSL configurado (opcional)
- [ ] Variable VITE_SOCKET_URL NO configurada (o comentada)
- [ ] WebSocket conecta exitosamente
- [ ] Sin errores en consola del navegador

---

## 🆘 Debugging

### Ver logs del Backend en tiempo real:

```bash
npm run server
# o
bun run server

# Deberías ver:
# 🚀 Servidor ejecutándose en http://0.0.0.0:3001
# 🔌 WebSocket habilitado
# ✅ Cliente conectado: [socket-id]
```

### Ver logs del Frontend:

```bash
# En consola del navegador (F12):
# 🔌 Iniciando conexión WebSocket a: ...
# ✅ WebSocket conectado exitosamente
```

### Ver logs de Nginx:

```
Nginx Proxy Manager → Proxy Hosts → ⋮ (menú) → View Logs
```

---

## 🎯 Arquitectura Recomendada para Producción

```
Internet
    │
    ▼
Cloudflare / CDN (opcional)
    │
    ▼
Nginx Proxy Manager / Traefik / Caddy
    │
    ├─→ Frontend (React build estático)
    │   └─→ nginx:80 sirviendo /dist
    │
    └─→ Backend (Express + Socket.IO)
        └─→ PM2 process manager
            └─→ Node.js en puerto 3001
                └─→ bookmarks.json con backup automático
```

---

## 📚 Referencias

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Nginx WebSocket Proxying](http://nginx.org/en/docs/http/websocket.html)
- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html#server-proxy)
