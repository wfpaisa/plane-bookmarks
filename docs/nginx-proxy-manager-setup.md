# Guía Paso a Paso: Configurar Nginx Proxy Manager para Plane Bookmark

## 📋 Requisitos previos

- ✅ Nginx Proxy Manager instalado y funcionando
- ✅ Servidor backend corriendo en puerto 3001 (`npm run server` o `bun run server`)
- ✅ Frontend corriendo en puerto 5173 (`npm run dev:client`)
- ✅ Dominio configurado (ejemplo: `local-book.XXX.com`)

---

## 🚀 Configuración Paso a Paso

### Paso 1: Crear Proxy Host Principal

1. **Accede a Nginx Proxy Manager**
   - URL: `http://tu-ip:81` (puerto por defecto)
   - Login con tus credenciales

2. **Ir a "Proxy Hosts"**
   - Click en "Proxy Hosts" en el menú lateral
   - Click en "Add Proxy Host"

3. **Configuración del Host Principal:**

   **Pestaña "Details":**

   ```
   Domain Names:
   ┌─────────────────────────────────────────┐
   │ local-book.XXX.com                  │
   └─────────────────────────────────────────┘

   Scheme: http  ▼

   Forward Hostname / IP:
   ┌─────────────────────────────────────────┐
   │ localhost                                │
   └─────────────────────────────────────────┘

   Forward Port:
   ┌─────────────────────────────────────────┐
   │ 5173                                     │
   └─────────────────────────────────────────┘

   ☐ Cache Assets
   ☑ Block Common Exploits
   ☑ Websockets Support  ← IMPORTANTE para Vite HMR
   ```

   **⚠️ NO guardes todavía, falta configurar las Custom Locations**

---

### Paso 2: Agregar Custom Location para API

4. **Click en la pestaña "Custom Locations"**

5. **Click en "Add location" (primer botón)**

6. **Configurar la location del API:**

   ```
   Define location:
   ┌─────────────────────────────────────────┐
   │ /api                                     │
   └─────────────────────────────────────────┘

   Scheme: http  ▼

   Forward Hostname / IP:
   ┌─────────────────────────────────────────┐
   │ localhost                                │
   └─────────────────────────────────────────┘

   Forward Port:
   ┌─────────────────────────────────────────┐
   │ 3001                                     │
   └─────────────────────────────────────────┘

   Advanced ▼
   Custom config (opcional - dejar vacío por ahora)
   ```

7. **Click en el ícono de "✓" (guardar) para esta location**

---

### Paso 3: Agregar Custom Location para WebSocket

8. **Click en "Add location" de nuevo (segundo botón)**

9. **Configurar la location del WebSocket:**

   ```
   Define location:
   ┌─────────────────────────────────────────┐
   │ /socket.io/                              │  ← ¡IMPORTANTE! Incluir el "/" final
   └─────────────────────────────────────────┘

   Scheme: http  ▼

   Forward Hostname / IP:
   ┌─────────────────────────────────────────┐
   │ localhost                                │
   └─────────────────────────────────────────┘

   Forward Port:
   ┌─────────────────────────────────────────┐
   │ 3001                                     │
   └─────────────────────────────────────────┘

   Advanced ▼
   Custom config:
   ┌─────────────────────────────────────────┐
   │ proxy_set_header Upgrade $http_upgrade; │
   │ proxy_set_header Connection "upgrade";  │
   │ proxy_http_version 1.1;                 │
   │                                          │
   │ # Timeouts largos para WebSocket        │
   │ proxy_connect_timeout 7d;               │
   │ proxy_send_timeout 7d;                  │
   │ proxy_read_timeout 7d;                  │
   │                                          │
   │ # Sin buffering                         │
   │ proxy_buffering off;                    │
   └─────────────────────────────────────────┘
   ```

10. **Click en el ícono de "✓" (guardar) para esta location**

---

### Paso 4: Configurar SSL (Opcional pero recomendado)

11. **Click en la pestaña "SSL"**

12. **Configuración SSL:**

    **Opción A: Con Let's Encrypt (recomendado):**

    ```
    SSL Certificate: Request a new SSL Certificate  ▼

    ☑ Force SSL
    ☑ HTTP/2 Support
    ☑ HSTS Enabled
    ☐ HSTS Subdomains

    Email Address for Let's Encrypt:
    ┌─────────────────────────────────────────┐
    │ tu-email@ejemplo.com                    │
    └─────────────────────────────────────────┘

    ☑ I Agree to the Let's Encrypt Terms of Service
    ```

    **Opción B: Sin SSL (solo para desarrollo local):**

    ```
    SSL Certificate: None  ▼

    ☐ Force SSL
    ☐ HTTP/2 Support
    ```

---

### Paso 5: Guardar y Verificar

13. **Click en "Save"** (botón azul en la parte superior derecha)

14. **Espera a que se apliquen los cambios** (unos segundos)

15. **Verificar en la lista de Proxy Hosts:**
    - Deberías ver tu dominio con estado "Online" (luz verde)
    - Si hay error (luz roja), revisa los logs

---

## ✅ Verificación de la Configuración

### Test 1: Verificar el Frontend

```bash
# Abrir en el navegador:
https://local-book.XXX.com
```

**Resultado esperado:** La aplicación carga correctamente

---

### Test 2: Verificar el API

```bash
curl https://local-book.XXX.com/api/health
```

**Resultado esperado:**

```json
{ "status": "ok", "timestamp": "2024-02-02T..." }
```

---

### Test 3: Verificar WebSocket

Abre la consola del navegador (F12) en `https://local-book.XXX.com`

**Resultado esperado:**

```
🚀 Plane Bookmark v1.0.0
📦 Build: 2024-02-02T...
🌐 Environment: development
🔗 Development mode
🔌 Iniciando conexión WebSocket a: https://local-book.XXX.com
✅ WebSocket conectado exitosamente
   Transport: websocket
```

---

## 🔧 Configuración Avanzada (Opcional)

### Custom Config Adicional para el Host Principal

Si necesitas más configuración, puedes agregar en la pestaña "Advanced" del host principal:

```nginx
# Headers de seguridad adicionales
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;

# Logs más detallados (útil para debugging)
access_log /data/logs/plane-bookmark-access.log proxy;
error_log /data/logs/plane-bookmark-error.log warn;

# Timeout para el frontend
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

---

## 🐛 Troubleshooting

### Problema 1: "502 Bad Gateway"

**Causa:** El backend no está corriendo o no es accesible

**Solución:**

```bash
# Verificar que el backend está corriendo
ps aux | grep node
netstat -tulpn | grep 3001

# Reiniciar el backend
cd /path/to/plane-bookmark-react
npm run server
# o
bun run server
```

---

### Problema 2: "WebSocket connection failed"

**Causa:** La configuración de WebSocket no está correcta

**Solución:**

1. Verifica que la location `/socket.io/` tiene el "/" final
2. Verifica que el custom config está correctamente copiado
3. Verifica que el backend está corriendo en puerto 3001

**Para verificar manualmente:**

```bash
# Verificar que el puerto 3001 está escuchando
curl http://localhost:3001/api/health

# Ver logs del backend
# Los logs deberían mostrar:
# 🚀 Servidor ejecutándose en http://0.0.0.0:3001
# 🔌 WebSocket habilitado
```

---

### Problema 3: "Mixed Content" (contenido mixto HTTP/HTTPS)

**Causa:** El frontend está en HTTPS pero intenta conectarse a WebSocket HTTP

**Solución:**

1. Asegúrate de haber activado "Force SSL" en Nginx Proxy Manager
2. Verifica que el certificado SSL está correctamente configurado
3. El código ya maneja esto automáticamente detectando el protocolo

---

### Problema 4: El frontend carga pero no hay datos

**Causa:** El API no está siendo redirigido correctamente

**Solución:**

1. Verifica que la location `/api` está configurada
2. Prueba manualmente: `curl https://tu-dominio.com/api/health`
3. Revisa los logs del backend

**Ver logs en tiempo real:**

```bash
# En una terminal, correr el backend con logs visibles:
npm run server

# Deberías ver requests entrando:
# GET /api/health
# GET /api/bookmarks
```

---

### Problema 5: "Failed to fetch" o CORS errors

**Causa:** Configuración de CORS en el backend

**Solución:**
El backend ya tiene CORS configurado correctamente (`cors: { origin: "*" }`), pero si ves errores:

1. Verifica que el backend está usando el puerto correcto
2. Revisa los headers en las developer tools del navegador
3. Asegúrate que no hay otro servicio corriendo en el puerto 3001

---

## 📊 Resumen de Puertos

| Servicio            | Puerto | URL                             |
| ------------------- | ------ | ------------------------------- |
| Frontend (Vite)     | 5173   | `http://localhost:5173`         |
| Backend (Express)   | 3001   | `http://localhost:3001`         |
| WebSocket           | 3001   | `ws://localhost:3001/socket.io` |
| Nginx Proxy Manager | 81     | `http://localhost:81`           |
| Dominio público     | 80/443 | `https://local-book.XXX.com`    |

---

## 📝 Checklist Final

Antes de considerar que todo está funcionando, verifica:

- [ ] El frontend carga en el dominio
- [ ] La consola muestra "✅ WebSocket conectado exitosamente"
- [ ] Puedes crear/editar/eliminar bookmarks
- [ ] Los cambios se guardan correctamente
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores 502/504 al navegar
- [ ] El API responde: `curl https://tu-dominio.com/api/health`

---

## 🎉 Configuración Completa

Si todos los checks están ✅, tu configuración está completa!

La estructura final en Nginx Proxy Manager debería verse así:

```
Proxy Hosts
└── local-book.XXX.com
    ├── Details
    │   ├── Domain: local-book.XXX.com
    │   ├── Forward to: localhost:5173
    │   └── Websockets Support: ✓
    ├── Custom Locations
    │   ├── /api → localhost:3001
    │   └── /socket.io/ → localhost:3001 (con custom config)
    └── SSL
        └── Let's Encrypt (Forzar SSL)
```

---

## 📞 ¿Necesitas ayuda?

Si sigues teniendo problemas:

1. Revisa los logs del backend: `npm run server` (verás los requests en tiempo real)
2. Revisa la consola del navegador (F12)
3. Revisa los logs de Nginx: En Nginx Proxy Manager → Proxy Hosts → ⋮ → View Logs
4. Comparte los mensajes de error específicos

¡Éxito! 🚀
