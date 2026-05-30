---
description: Contexto completo del proyecto Plane Bookmark para asistir con código, arquitectura y decisiones de diseño
applyTo: "**/*.{ts,tsx,css,json}"
---

# Plane Bookmark — Contexto del Proyecto

## Qué es

Gestor de marcadores web con interfaz de árbol (tipo explorador de archivos). Permite organizar bookmarks en carpetas anidadas, buscar por nombre o tags, importar/exportar, y sincronizar en tiempo real entre múltiples clientes via WebSocket.

## Stack Técnico

- **Frontend:** React 19 + TypeScript + Vite
- **Árbol:** `react-arborist` v3.4.3 (virtualizado, drag & drop, inline editing)
- **Iconos:** `@iconify/react` (set Solar)
- **Backend:** Express 5 + Socket.io 4 (Bun runtime)
- **Imagen:** `sharp` para procesar favicons a 32x32 PNG base64
- **Persistencia:** Archivo JSON plano (`server/data/bookmarks.json`)

## Arquitectura

```
src/
├── App.tsx              — Layout raíz, estado UI (search, sidebar)
├── hooks/
│   ├── useBookmarks.ts  — Hook principal: estado, CRUD, WebSocket sync
│   └── useBookmarkStats.ts — Estadísticas del árbol (total, carpetas, mensual)
├── utils/
│   ├── treeOperations.ts — Funciones puras de manipulación de árbol
│   └── bookmarkParser.ts — Parser de HTML de Chrome/Firefox a BookmarkItem[]
├── services/
│   ├── bookmarkAPI.ts    — Cliente REST (GET/POST/PUT/DELETE /api/bookmarks)
│   └── socket.ts         — Servicio WebSocket singleton (Socket.io)
├── contexts/
│   └── BookmarkContext.ts — Contexto para pasar onUpdate a nodos del árbol
├── components/
│   ├── MainContent/      — Búsqueda, toolbar, Tree de react-arborist
│   ├── Sidebar/          — Stats, tags clickeables, atajos de teclado
│   ├── TreeNode/         — Nodo del árbol (render, drag, selección, edición)
│   ├── BookmarkModal/    — Modal formulario (nombre, URL, tags, favicon)
│   ├── BookmarkImporter/ — Import HTML/JSON, export JSON, delete all
│   └── DropCursor/       — Indicador visual de drop en drag & drop
├── types/
│   └── bookmark.ts       — Tipo BookmarkItem
└── data/
    └── bookmarks.ts      — Array vacío como fallback offline

server/
└── server.ts             — Express + Socket.io: CRUD, favicon proxy, WebSocket
```

## Modelo de Datos

```typescript
type BookmarkItem = {
  id: string; // Único, generado con Date.now().toString()
  name: string; // Nombre del bookmark o carpeta
  url?: string; // URL del bookmark (undefined para carpetas)
  addDate?: string; // Unix timestamp en segundos (string)
  icon?: string; // Favicon como data:image/png;base64,...
  tags?: string[]; // Tags para categorización y búsqueda
  children?: BookmarkItem[]; // Hijos (su existencia define carpeta)
  isOpen?: boolean; // Estado abierto/cerrado persistido
};
```

**Convención:** Si `children` existe → es carpeta. Si tiene `url` → es bookmark hoja.

## Flujo de Datos

1. `useBookmarks` carga datos del servidor al montar (`bookmarkAPI.getAll()`)
2. WebSocket se conecta para recibir cambios de otros clientes
3. Cada mutación (crear, mover, renombrar, eliminar, toggle):
   - Actualiza estado local (`setData`)
   - Envía al servidor via WebSocket (o HTTP fallback)
4. Otros clientes reciben el evento `bookmarks:updated` y actualizan su estado

## Patrones Clave

### Manipulación de Árbol

Todas las operaciones de árbol son **inmutables** y están en `src/utils/treeOperations.ts`:

- `removeNodes` — Eliminar nodos por IDs
- `findNodes` — Buscar nodos por IDs
- `insertNodes` — Insertar en posición (parentId + index)
- `updateNode` — Actualizar con función transformadora
- `collectTags` — Extraer tags únicos del árbol

### Hook `useBookmarks`

Patrón centralizado: cada handler usa `applyAndSync(newData)` que hace `setData + syncWithServer` en un paso.

### Contexto para Nodos

`BookmarkContext` provee `onUpdate` a los nodos del árbol virtualizado. react-arborist no permite props arbitrarias en nodos, por eso se usa Context.

### Búsqueda

Una sola función `searchMatch` en MainContent que opera en dos modos:

- **Normal:** busca en nombre + tags (OR)
- **Tag mode:** múltiples tags separados por coma (AND, match exacto)

## Convenciones de Código

- **Idioma UI:** Español
- **Comentarios:** JSDoc breve en cada función (qué hace + por qué existe)
- **Tipos:** No usar `any`. Preferir `unknown` si es necesario, o tipar correctamente
- **CSS:** Variables CSS globales en `index.css`, componente-específico en archivos `.css` junto al `.tsx`
- **Imports:** Barrel exports desde `components/index.ts`
- **Estado:** Estado de datos en hooks, estado de UI local en componentes
- **Sin librerías de estado global** (no Redux/Zustand): el hook + context es suficiente

## Comandos

```bash
bun run dev        # Inicia frontend (Vite) + backend (Express) concurrentemente
bun run server     # Solo backend en puerto 3001 con --watch
bun run build      # tsc -b && vite build
bun run lint       # ESLint
```

## API del Servidor

| Método | Endpoint               | Descripción                 |
| ------ | ---------------------- | --------------------------- |
| GET    | `/api/bookmarks`       | Obtener todo el árbol       |
| POST   | `/api/bookmarks`       | Reemplazar todo el árbol    |
| PUT    | `/api/bookmarks`       | Sincronizar/actualizar      |
| DELETE | `/api/bookmarks`       | Eliminar todo               |
| GET    | `/api/favicon?url=...` | Obtener favicon como base64 |
| GET    | `/api/health`          | Health check                |

**WebSocket Events:**

- `bookmarks:update` (client → server) — Enviar datos actualizados
- `bookmarks:updated` (server → clients) — Broadcast de cambios
- `bookmarks:saved` (server → sender) — Confirmación
- `bookmarks:error` (server → sender) — Error

## react-arborist — Referencia Rápida

El componente `<Tree>` recibe:

- `data` — Array de BookmarkItem
- `onCreate/onMove/onRename/onDelete` — Handlers CRUD
- `onToggle` — Cuando se abre/cierra una carpeta
- `initialOpenState` — Mapa `{id: boolean}` para estado inicial
- `searchTerm` + `searchMatch` — Filtrado

Cada nodo (`NodeRendererProps<BookmarkItem>`) tiene:

- `node.isLeaf / node.isInternal` — Tipo
- `node.isEditing / node.edit() / node.reset() / node.submit()` — Edición
- `node.isSelected / node.handleClick(e)` — Selección
- `node.toggle() / node.isOpen` — Expansión
- `node.data` — El BookmarkItem
- `dragHandle` — Ref para habilitar drag en un elemento
