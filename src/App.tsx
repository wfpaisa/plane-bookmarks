import "./App.css";
import { bookmarksData } from "./data/bookmarks";
import type { BookmarkItem } from "./types/bookmark";
import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { useBookmarkStats } from "./hooks/useBookmarkStats";
import { bookmarkAPI } from "./services/bookmarkAPI";
import { socketService } from "./services/socket";

function App() {
  const [term, setTerm] = useState("");
  const [tagSearchEnabled, setTagSearchEnabled] = useState(false);
  const [data, setData] = useState<BookmarkItem[]>(bookmarksData);
  const [isLoading, setIsLoading] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stats = useBookmarkStats(data);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    const collectTags = (items: BookmarkItem[]) => {
      items.forEach((item) => {
        if (item.tags) {
          item.tags.forEach((tag) => tagsSet.add(tag));
        }
        if (item.children) {
          collectTags(item.children);
        }
      });
    };
    collectTags(data);
    return Array.from(tagsSet).sort();
  }, [data]);

  // Cargar bookmarks del servidor al iniciar
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const isConnected = await bookmarkAPI.healthCheck();
        setServerConnected(isConnected);

        if (isConnected) {
          const response = await bookmarkAPI.getAll();
          // Si el servidor tiene datos, usarlos; sino usar datos por defecto
          if (response.data && response.data.length > 0) {
            setData(response.data);
          } else {
            // Si el servidor está vacío, guardar datos iniciales
            await bookmarkAPI.saveAll(bookmarksData);
            setData(bookmarksData);
          }
        }
      } catch (error) {
        console.error("Error al cargar bookmarks:", error);
        // Usar datos locales si hay error
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  // Conectar WebSocket y escuchar actualizaciones en tiempo real
  useEffect(() => {
    if (!serverConnected) return;

    socketService.connect();

    const handleBookmarksUpdate = (payload: { data: BookmarkItem[] }) => {
      console.log("🔄 Cambios recibidos de otro cliente");
      setData(payload.data);
    };

    socketService.onBookmarksUpdated(handleBookmarksUpdate);

    return () => {
      socketService.offBookmarksUpdated(handleBookmarksUpdate);
    };
  }, [serverConnected]);

  // Sincronizar con el servidor cuando los datos cambian
  const syncWithServer = async (newData: BookmarkItem[]) => {
    if (serverConnected) {
      try {
        const socket = socketService.getSocket();
        if (socket && socket.connected) {
          // Usar WebSocket si está conectado
          await socketService.updateBookmarks(newData);
        } else {
          // Fallback a HTTP si WebSocket no está disponible
          await bookmarkAPI.updateAll(newData);
        }
      } catch (error) {
        console.error("Error al sincronizar con el servidor:", error);
      }
    }
  };

  const handleDataImport = (newData: BookmarkItem[]) => {
    setData(newData);
    syncWithServer(newData);
  };

  const handleMove = ({
    dragIds,
    parentId,
    index,
  }: {
    dragIds: string[];
    parentId: string | null;
    index: number;
  }) => {
    const newData = [...data];

    // Función recursiva para encontrar y remover nodos
    const removeNodes = (
      items: BookmarkItem[],
      ids: string[],
    ): BookmarkItem[] => {
      return items.reduce((acc, item) => {
        if (ids.includes(item.id)) {
          return acc;
        }
        if (item.children) {
          return [...acc, { ...item, children: removeNodes(item.children, ids) }];
        }
        return [...acc, item];
      }, [] as BookmarkItem[]);
    };

    // Función recursiva para encontrar nodos por IDs
    const findNodes = (
      items: BookmarkItem[],
      ids: string[],
    ): BookmarkItem[] => {
      const found: BookmarkItem[] = [];
      const search = (items: BookmarkItem[]) => {
        items.forEach((item) => {
          if (ids.includes(item.id)) {
            found.push(item);
          }
          if (item.children) {
            search(item.children);
          }
        });
      };
      search(items);
      return found;
    };

    // Función recursiva para insertar nodos
    const insertNodes = (
      items: BookmarkItem[],
      parentId: string | null,
      index: number,
      nodes: BookmarkItem[],
    ): BookmarkItem[] => {
      if (parentId === null) {
        const result = [...items];
        result.splice(index, 0, ...nodes);
        return result;
      }

      return items.map((item) => {
        if (item.id === parentId) {
          const children = item.children || [];
          const newChildren = [...children];
          newChildren.splice(index, 0, ...nodes);
          return { ...item, children: newChildren };
        }
        if (item.children) {
          return {
            ...item,
            children: insertNodes(item.children, parentId, index, nodes),
          };
        }
        return item;
      });
    };

    const draggedNodes = findNodes(newData, dragIds);
    const withoutDragged = removeNodes(newData, dragIds);
    const result = insertNodes(withoutDragged, parentId, index, draggedNodes);

    setData(result);
    syncWithServer(result);
  };

  const handleCreate = ({
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

    const insertNode = (items: BookmarkItem[]): BookmarkItem[] => {
      if (parentId === null) {
        const result = [...items];
        result.splice(index, 0, newItem);
        return result;
      }

      return items.map((item) => {
        if (item.id === parentId) {
          const children = item.children || [];
          const newChildren = [...children];
          newChildren.splice(index, 0, newItem);
          return { ...item, children: newChildren };
        }
        if (item.children) {
          return { ...item, children: insertNode(item.children) };
        }
        return item;
      });
    };

    const newData = insertNode(data);
    setData(newData);
    syncWithServer(newData);
    return { id: newId };
  };

  const handleRename = ({ id, name }: { id: string; name: string }) => {
    const renameNode = (items: BookmarkItem[]): BookmarkItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, name };
        }
        if (item.children) {
          return { ...item, children: renameNode(item.children) };
        }
        return item;
      });
    };

    const newData = renameNode(data);
    setData(newData);
    syncWithServer(newData);
  };

  const handleUpdate = (id: string, updatedItem: BookmarkItem) => {
    const updateNode = (items: BookmarkItem[]): BookmarkItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return updatedItem;
        }
        if (item.children) {
          return { ...item, children: updateNode(item.children) };
        }
        return item;
      });
    };

    const newData = updateNode(data);
    setData(newData);
    syncWithServer(newData);
  };

  const handleDelete = ({ ids }: { ids: string[] }) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar ${ids.length} elemento(s)?`,
    );
    if (!confirmed) return;

    const deleteNodes = (items: BookmarkItem[]): BookmarkItem[] => {
      return items.reduce((acc, item) => {
        if (ids.includes(item.id)) {
          return acc;
        }
        if (item.children) {
          return [...acc, { ...item, children: deleteNodes(item.children) }];
        }
        return [...acc, item];
      }, [] as BookmarkItem[]);
    };

    const newData = deleteNodes(data);
    setData(newData);
    syncWithServer(newData);
  };

  const handleTagClick = (tag: string) => {
    if (term.trim() === "") {
      setTerm(tag);
    } else {
      setTerm(term + "," + tag);
    }
    setTagSearchEnabled(true);
  };

  const handleToggle = (id: string) => {
    const toggleNode = (items: BookmarkItem[]): BookmarkItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, isOpen: !item.isOpen };
        }
        if (item.children) {
          return { ...item, children: toggleNode(item.children) };
        }
        return item;
      });
    };

    const newData = toggleNode(data);
    setData(newData);
    syncWithServer(newData);
  };

  if (isLoading) {
    return (
      <div
        className="app-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
        }}
      >
        Cargando bookmarks...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        stats={stats}
        tags={allTags}
        sidebarOpen={sidebarOpen}
        onTagClick={handleTagClick}
      />
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <MainContent
        data={data}
        searchTerm={term}
        onTermChange={setTerm}
        onDataImport={handleDataImport}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onCreate={handleCreate}
        onMove={handleMove}
        onRename={handleRename}
        onDelete={handleDelete}
        onToggle={handleToggle}
        onUpdate={handleUpdate}
        tagSearchEnabled={tagSearchEnabled}
      />
      {!serverConnected && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#ff9800",
            color: "white",
            padding: "10px 15px",
            borderRadius: "5px",
            fontSize: "0.9rem",
          }}
        >
          ⚠️ Modo sin conexión - Los cambios no se guardarán
        </div>
      )}
    </div>
  );
}

export default App;
