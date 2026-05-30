import { useState, useEffect, useMemo, useCallback } from "react";
import type { BookmarkItem } from "../types/bookmark";
import { bookmarkAPI } from "../services/bookmarkAPI";
import { socketService } from "../services/socket";
import {
  removeNodes,
  findNodes,
  insertNodes,
  updateNode,
  collectTags,
} from "../utils/treeOperations";

/**
 * Hook principal que encapsula toda la lógica de estado y mutación de bookmarks.
 * Centraliza: carga inicial desde servidor, sincronización WebSocket,
 * operaciones CRUD sobre el árbol, y cálculo de tags.
 * Se extrae de App.tsx para mantener el componente raíz como layout puro.
 */
export function useBookmarks() {
  const [data, setData] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);

  /** Lista de tags únicos extraídos del árbol, ordenados alfabéticamente. */
  const allTags = useMemo(() => collectTags(data), [data]);

  /**
   * Carga inicial: verifica conexión al servidor y obtiene los bookmarks.
   * Si el servidor está vacío, no envía datos seed (el array vacío es válido).
   * Si no hay conexión, se queda con el array vacío como fallback offline.
   */
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const isConnected = await bookmarkAPI.healthCheck();
        setServerConnected(isConnected);

        if (isConnected) {
          const response = await bookmarkAPI.getAll();
          if (response.data && response.data.length > 0) {
            setData(response.data);
          }
        }
      } catch (error) {
        console.error("Error al cargar bookmarks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  /**
   * Conexión WebSocket para sincronización en tiempo real entre clientes.
   * Escucha el evento 'bookmarks:updated' que se emite cuando otro cliente
   * modifica los datos, manteniendo todos los clientes sincronizados.
   */
  useEffect(() => {
    if (!serverConnected) return;

    socketService.connect();

    const handleBookmarksUpdate = (payload: { data: BookmarkItem[] }) => {
      setData(payload.data);
    };

    socketService.onBookmarksUpdated(handleBookmarksUpdate);

    return () => {
      socketService.offBookmarksUpdated(handleBookmarksUpdate);
    };
  }, [serverConnected]);

  /**
   * Envía los datos actualizados al servidor.
   * Prioriza WebSocket si está conectado; si no, usa HTTP como fallback.
   * Se invoca después de cada mutación local para persistir los cambios.
   */
  const syncWithServer = useCallback(
    async (newData: BookmarkItem[]) => {
      if (!serverConnected) return;
      try {
        const socket = socketService.getSocket();
        if (socket?.connected) {
          await socketService.updateBookmarks(newData);
        } else {
          await bookmarkAPI.updateAll(newData);
        }
      } catch (error) {
        console.error("Error al sincronizar con el servidor:", error);
      }
    },
    [serverConnected],
  );

  /**
   * Aplica una mutación al estado local y sincroniza con el servidor.
   * Patrón centralizado que evita repetir setData + syncWithServer en cada handler.
   */
  const applyAndSync = useCallback(
    (newData: BookmarkItem[]) => {
      setData(newData);
      syncWithServer(newData);
    },
    [syncWithServer],
  );

  /**
   * Importa datos externos (desde archivo HTML/JSON) reemplazando el árbol completo.
   * Se usa tanto para importación de Chrome como para restauración de backups JSON.
   */
  const handleDataImport = useCallback(
    (newData: BookmarkItem[]) => applyAndSync(newData),
    [applyAndSync],
  );

  /**
   * Mueve nodos dentro del árbol (drag & drop).
   * Extrae los nodos arrastrados, los elimina de su posición original
   * y los inserta en la nueva ubicación indicada por parentId e index.
   */
  const handleMove = useCallback(
    ({
      dragIds,
      parentId,
      index,
    }: {
      dragIds: string[];
      parentId: string | null;
      index: number;
    }) => {
      const draggedNodes = findNodes(data, dragIds);
      const withoutDragged = removeNodes(data, dragIds);
      const result = insertNodes(withoutDragged, parentId, index, draggedNodes);
      applyAndSync(result);
    },
    [data, applyAndSync],
  );

  /**
   * Crea un nuevo bookmark o carpeta en la posición indicada.
   * El tipo 'internal' crea carpeta (con children=[]), 'leaf' crea bookmark vacío.
   * Retorna el ID generado para que react-arborist pueda enfocar el nodo nuevo.
   */
  const handleCreate = useCallback(
    ({
      parentId,
      index,
      type,
    }: {
      parentId: string | null;
      index: number;
      type: "leaf" | "internal";
    }) => {
      const newId = Date.now().toString();
      const newItem: BookmarkItem = {
        id: newId,
        name: type === "internal" ? "Nueva Carpeta" : "",
        ...(type === "internal" && { children: [] }),
      };

      const newData = insertNodes(data, parentId, index, [newItem]);
      applyAndSync(newData);
      return { id: newId };
    },
    [data, applyAndSync],
  );

  /**
   * Renombra un nodo existente por su ID.
   * Se invoca cuando el usuario confirma el cambio de nombre en el input inline.
   */
  const handleRename = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      const newData = updateNode(data, id, (item) => ({ ...item, name }));
      applyAndSync(newData);
    },
    [data, applyAndSync],
  );

  /**
   * Actualiza todos los campos de un bookmark (nombre, URL, tags, icono).
   * Se invoca desde el BookmarkModal cuando el usuario guarda cambios completos.
   */
  const handleUpdate = useCallback(
    (id: string, updatedItem: BookmarkItem) => {
      const newData = updateNode(data, id, () => updatedItem);
      applyAndSync(newData);
    },
    [data, applyAndSync],
  );

  /**
   * Elimina nodos del árbol después de confirmación del usuario.
   * Soporta eliminación múltiple (selección multi-nodo de react-arborist).
   */
  const handleDelete = useCallback(
    ({ ids }: { ids: string[] }) => {
      const confirmed = window.confirm(
        `¿Estás seguro de que quieres eliminar ${ids.length} elemento(s)?`,
      );
      if (!confirmed) return;

      const newData = removeNodes(data, ids);
      applyAndSync(newData);
    },
    [data, applyAndSync],
  );

  /**
   * Persiste el estado abierto/cerrado de una carpeta.
   * Se sincroniza con el servidor para que al recargar la página
   * las carpetas mantengan su estado de expansión.
   */
  const handleToggle = useCallback(
    (id: string) => {
      const newData = updateNode(data, id, (item) => ({
        ...item,
        isOpen: !item.isOpen,
      }));
      applyAndSync(newData);
    },
    [data, applyAndSync],
  );

  return {
    data,
    isLoading,
    serverConnected,
    allTags,
    handleDataImport,
    handleMove,
    handleCreate,
    handleRename,
    handleUpdate,
    handleDelete,
    handleToggle,
  };
}
