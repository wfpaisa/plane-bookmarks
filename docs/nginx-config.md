# Configuración de Nginx para Plane Bookmark

## Opción 1: Nginx Proxy Manager (GUI)

### Host Configuration

**Domain Names:**
```
local-book.wfelipe.com
# o el dominio que estés usando
```

**Scheme:** `http`
**Forward Hostname / IP:** `localhost` (o la IP del servidor)
**Forward Port:** `5173` (puerto del frontend Vite)

**Custom locations:**

1. **Location: `/api`**
   - Scheme: `http`
   - Forward Hostname/IP: `localhost`
   - Forward Port: `3001`
   - ✅ Block Common Exploits
   - ✅ Websockets Support (NO necesario para /api)

2. **Location: `/socket.io/`**
   - Scheme: `http`
   - Forward Hostname/IP: `localhost`
   - Forward Port: `3001`
   - ✅ Block Common Exploits
   - ✅ **Websockets Support** (IMPORTANTE!)

**SSL:**
- ✅ Force SSL (si usas HTTPS)
- ✅ HTTP/2 Support
- Certificado: Let's Encrypt o tu certificado

---

## Opción 2: Nginx Config Manual

### Archivo: `/etc/nginx/sites-available/plane-bookmark`

```nginx
# Upstream para el backend
upstream backend {
    server 127.0.0.1:3001;
    keepalive 64;
}

# Upstream para el frontend
upstream frontend {
    server 127.0.0.1:5173;
    keepalive 64;
}

server {
    listen 80;
    server_name local-book.wfelipe.com;
    
    # Redirigir a HTTPS (opcional)
    # return 301 https://$server_name$request_uri;
    
    # ============================================
    # API Backend (HTTP)
    # ============================================
    location /api/ {
        proxy_pass http://backend;
        
        # Headers esenciales
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # ============================================
    # WebSocket (Socket.IO)
    # ============================================
    location /socket.io/ {
        proxy_pass http://backend;
        
        # Headers esenciales
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Headers específicos para WebSocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts más largos para WebSocket
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        
        # Buffer settings
        proxy_buffering off;
    }
    
    # ============================================
    # Frontend (React)
    # ============================================
    location / {
        proxy_pass http://frontend;
        
        # Headers esenciales
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Para Vite HMR (Hot Module Replacement)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Configuración HTTPS (opcional)
server {
    listen 443 ssl http2;
    server_name local-book.wfelipe.com;
    
    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/local-book.wfelipe.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/local-book.wfelipe.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Usar las mismas locations de arriba
    # (copiar las secciones /api/, /socket.io/, y / del bloque anterior)
}
```

### Activar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/plane-bookmark /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Opción 3: Caddy (Más simple)

### Archivo: `Caddyfile`

```caddy
local-book.wfelipe.com {
    # Frontend
    reverse_proxy localhost:5173
    
    # API Backend
    reverse_proxy /api/* localhost:3001
    
    # WebSocket
    reverse_proxy /socket.io/* localhost:3001
}
```

### Iniciar Caddy:
```bash
caddy run --config Caddyfile
```

---

## Verificación

### 1. Verificar que el backend está corriendo:
```bash
curl http://localhost:3001/api/health
# Debería responder: {"status":"ok","timestamp":"..."}
```

### 2. Verificar que el proxy funciona:
```bash
curl https://local-book.wfelipe.com/api/health
# Debería responder: {"status":"ok","timestamp":"..."}
```

### 3. Verificar WebSocket en el navegador:
Abre la consola del navegador y deberías ver:
```
🔌 Iniciando conexión WebSocket a: https://local-book.wfelipe.com
✅ WebSocket conectado exitosamente
   Transport: websocket
```

---

## Troubleshooting

### Error: "WebSocket connection failed"

**Causa:** Nginx no tiene configurado el upgrade de WebSocket

**Solución:** Asegúrate de tener estas líneas en la location `/socket.io/`:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Error: "CORS policy blocked"

**Causa:** El servidor backend no está permitiendo el origen

**Solución:** El servidor ya tiene CORS abierto (`origin: "*"`), pero si usas HTTPS en el proxy y HTTP en el backend, asegúrate de configurar el header:
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```

### Error: "Connection timeout"

**Causa:** El backend no está corriendo o no es accesible

**Solución:** 
```bash
# Verificar que el backend está corriendo
ps aux | grep node
netstat -tulpn | grep 3001

# Reiniciar el backend
cd /path/to/plane-bookmark-react
bun run server
```
