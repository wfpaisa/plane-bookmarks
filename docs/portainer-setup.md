# Configuración de Portainer para Plane Bookmark

## 🐳 Configuración del Stack en Portainer

### Stack Configuration

**Name:** `plane-bookmark`

**Build method:** `Repository`

**Repository URL:** Tu URL del repositorio Git

**Repository reference:** `refs/heads/main` (o tu rama)

**Compose path:** `docker-compose.yml`

---

## ⚙️ Variables de Entorno (Environment variables)

### Variables REQUERIDAS:

```yaml
# NO configurar VITE_SOCKET_URL
# El sistema detectará automáticamente el dominio

# API URL - usar ruta relativa
VITE_API_URL=/api

# Environment
NODE_ENV=production
```

### ⚠️ Variables que NO debes configurar:

```yaml
# ❌ NO CONFIGURAR ESTAS:
# VITE_SOCKET_URL=http://localhost:3001
# VITE_SOCKET_URL=...

# El WebSocket se conectará automáticamente al mismo dominio
# que el navegador esté visitando
```

---

## 🔧 Configuración de Nginx Proxy Manager

### Setup para contenedor Docker:

1. **Obtener la IP del servidor Docker:**
```bash
# SSH al servidor
hostname -I
# Ejemplo: 192.168.1.100
```

2. **En Nginx Proxy Manager:**

**Proxy Host:**
```
Domain Names: local-book.wfelipe.com
Scheme: http
Forward Hostname/IP: 192.168.1.100  ← IP del servidor Docker
Forward Port: 5173
☑ Block Common Exploits
☑ Websockets Support
```

**Custom Location: `/api`**
```
Location: /api
Scheme: http
Forward Hostname/IP: 192.168.1.100
Forward Port: 3001
```

**Custom Location: `/socket.io/`**
```
Location: /socket.io/
Scheme: http
Forward Hostname/IP: 192.168.1.100
Forward Port: 3001

Custom config:
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_http_version 1.1;
proxy_connect_timeout 7d;
proxy_send_timeout 7d;
proxy_read_timeout 7d;
proxy_buffering off;
```

**SSL:**
```
☑ Force SSL
☑ HTTP/2 Support
☑ Request a new SSL Certificate
Email: tu-email@ejemplo.com
```

---

## 📋 Portainer Stack Completo (docker-compose.yml)

```yaml
version: "3.8"

services:
  plane-bookmark:
    image: plane-bookmark:latest
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5173:5173"  # Frontend
      - "3001:3001"  # Backend + WebSocket
    volumes:
      - bookmark-data:/usr/src/app/server/data
    environment:
      - VITE_API_URL=/api
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  bookmark-data:
    driver: local
```

---

## 🚀 Deployment Steps

### 1. Crear Stack en Portainer

1. Accede a Portainer
2. Stacks → Add Stack
3. Name: `plane-bookmark`
4. Build method: `Repository`
5. Repository URL: `tu-repo-url`
6. Compose path: `docker-compose.yml`

### 2. Configurar Variables de Entorno

En la sección "Environment variables":

```
VITE_API_URL=/api
NODE_ENV=production
```

**⚠️ NO agregues `VITE_SOCKET_URL`**

### 3. Deploy

- Click "Deploy the stack"
- Espera a que se construya la imagen
- Verifica que el contenedor esté "Running"

### 4. Verificar Puertos

En Portainer → Containers → plane-bookmark → Published ports:

```
0.0.0.0:5173 → 5173/tcp
0.0.0.0:3001 → 3001/tcp
```

### 5. Configurar Nginx Proxy Manager

Sigue la configuración de arriba usando la IP del servidor Docker.

---

## ✅ Verificación

### 1. Verificar que el contenedor está corriendo:

```bash
docker ps | grep plane-bookmark
```

### 2. Verificar logs del contenedor:

En Portainer → Containers → plane-bookmark → Logs

Deberías ver:
```
🚀 Servidor ejecutándose en http://0.0.0.0:3001
🔌 WebSocket habilitado
```

### 3. Verificar desde el navegador:

Abre `https://local-book.wfelipe.com` y en la consola (F12):

```
🚀 Plane Bookmark v1.0.1
🔌 Iniciando conexión WebSocket a: https://local-book.wfelipe.com
✅ WebSocket conectado exitosamente
   Transport: websocket
```

---

## 🐛 Troubleshooting

### Problema: Sigue conectándose a localhost:3001

**Causa:** La variable `VITE_SOCKET_URL` está configurada en Portainer

**Solución:**
1. Portainer → Stacks → plane-bookmark → Editor
2. Eliminar línea: `- VITE_SOCKET_URL=...`
3. Click "Update the stack"
4. Rebuild: Click "Pull and redeploy"

### Problema: Cannot connect to backend

**Causa:** Nginx no puede alcanzar el contenedor

**Solución:**
1. Verifica que los puertos 5173 y 3001 estén publicados
2. Verifica que uses la IP correcta del servidor Docker
3. Prueba: `curl http://IP-SERVIDOR:3001/api/health`

### Problema: WebSocket connection failed

**Causa:** Nginx no tiene configurado el upgrade de WebSocket

**Solución:**
1. Verifica la Custom Location `/socket.io/`
2. Asegúrate que tiene el custom config de WebSocket
3. Verifica que termine en `/` → `/socket.io/`

---

## 📊 Arquitectura en Docker

```
Internet
    │
    ▼
Nginx Proxy Manager (NPM)
    │ (https://local-book.wfelipe.com)
    │
    ├─→ / → Servidor Docker:5173 (Frontend)
    │
    ├─→ /api → Servidor Docker:3001 (API)
    │
    └─→ /socket.io/ → Servidor Docker:3001 (WebSocket)
            │
            ▼
        Docker Container (plane-bookmark)
            │
            ├─→ Frontend (Vite) :5173
            └─→ Backend (Express + Socket.IO) :3001
                    │
                    ▼
                Volume: bookmark-data
                    └─→ bookmarks.json
```

---

## 🔄 Actualizar la Aplicación

### Método 1: Pull and redeploy (recomendado)

1. Push cambios a tu repositorio Git
2. Portainer → Stacks → plane-bookmark
3. Click "Pull and redeploy"
4. Espera a que termine

### Método 2: Recreate

1. Portainer → Stacks → plane-bookmark
2. Click "⋮" → "Recreate"
3. Confirma

### Método 3: Manual

```bash
# SSH al servidor Docker
cd /path/to/portainer/data/compose/XX  # XX es el ID del stack

# Pull latest changes
git pull

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

## 💾 Backup de Datos

Los bookmarks se guardan en un volumen Docker:

```bash
# Ver volumen
docker volume ls | grep bookmark

# Backup
docker run --rm -v plane-bookmark_bookmark-data:/data -v $(pwd):/backup ubuntu tar czf /backup/bookmarks-backup.tar.gz /data

# Restore
docker run --rm -v plane-bookmark_bookmark-data:/data -v $(pwd):/backup ubuntu tar xzf /backup/bookmarks-backup.tar.gz -C /
```

---

## 📝 Checklist Final

- [ ] Stack creado en Portainer
- [ ] Variables de entorno correctas (sin VITE_SOCKET_URL)
- [ ] Contenedor running
- [ ] Puertos 5173 y 3001 publicados
- [ ] Nginx Proxy Manager configurado
- [ ] Custom location /api creada
- [ ] Custom location /socket.io/ creada con config
- [ ] SSL configurado
- [ ] WebSocket conecta exitosamente
- [ ] Sin errores en consola del navegador
- [ ] Bookmarks se guardan correctamente

---

## 🎉 Listo!

Si todos los checks están ✅, tu aplicación debería funcionar correctamente.

La consola del navegador debería mostrar:
```
🔌 Iniciando conexión WebSocket a: https://local-book.wfelipe.com
✅ WebSocket conectado exitosamente
   Transport: websocket
```

¡Sin errores de `localhost:3001`! 🎊
