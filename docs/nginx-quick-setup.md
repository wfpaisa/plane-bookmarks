# 🚀 Guía Rápida: Nginx Proxy Manager

## Configuración en 3 minutos

### 1️⃣ Crear Proxy Host

**Proxy Hosts → Add Proxy Host**

```
Domain Names: local-book.XXX.com
Scheme: http
Forward IP: localhost
Forward Port: 5173
☑ Block Common Exploits
☑ Websockets Support
```

---

### 2️⃣ Agregar Location del API

**Tab: Custom Locations → Add location**

```
Location: /api
Scheme: http
Forward IP: localhost
Forward Port: 3001
```

✓ **Guardar esta location**

---

### 3️⃣ Agregar Location del WebSocket

**Add location (de nuevo)**

```
Location: /socket.io/   ← ¡Con "/" al final!
Scheme: http
Forward IP: localhost
Forward Port: 3001
```

✓ **Guardar esta location**

---

### 4️⃣ SSL (Opcional)

**Tab: SSL**

```
☑ Request a new SSL Certificate
☑ Force SSL
☑ HTTP/2 Support
Email: tu-email@ejemplo.com
☑ I Agree to Let's Encrypt ToS
```

---

### 5️⃣ Guardar

**Click "Save" (botón azul)**

---

## ✅ Verificar

Abre la consola del navegador (F12) en tu dominio:

```
https://local-book.XXX.com
```

**Deberías ver:**

```
✅ WebSocket conectado exitosamente
   Transport: websocket
```

---

## ⚠️ Si no funciona

### WebSocket falla?

1. ✓ La location es `/socket.io/` (con `/` al final)
2. ✓ El custom config está copiado correctamente
3. ✓ El backend está corriendo: `npm run server`

### API falla?

1. ✓ La location `/api` está creada
2. ✓ Prueba: `curl https://tu-dominio.com/api/health`

---

## 🎯 Estructura Final

```
local-book.XXX.com (puerto 5173)
├── /api → localhost:3001
└── /socket.io/ → localhost:3001 (WebSocket)
```

**¡Listo!** 🎉
