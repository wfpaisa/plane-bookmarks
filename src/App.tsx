import "./App.css";
import { bookmarksData, type BookmarkItem } from "./data/bookmarks";
import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { useBookmarkStats } from "./hooks/useBookmarkStats";
import { bookmarkAPI } from "./services/bookmarkAPI";

function App() {
  const [term, setTerm] = useState("");
  const [data, setData] = useState<BookmarkItem[]>(bookmarksData);
  const [isLoading, setIsLoading] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);
  const stats = useBookmarkStats(data);

  // Cargar bookmarks del servidor al iniciar
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const isConnected = await bookmarkAPI.healthCheck();
        setServerConnected(isConnected);

        if (isConnected) {
          const serverData = await bookmarkAPI.getAll();
          // Si el servidor tiene datos, usarlos; sino usar datos por defecto
          if (serverData && serverData.length > 0) {
            setData(serverData);
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

  // Sincronizar con el servidor cuando los datos cambian
  const syncWithServer = async (newData: BookmarkItem[]) => {
    if (serverConnected) {
      try {
        await bookmarkAPI.updateAll(newData);
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
          item.children = removeNodes(item.children, ids);
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
      name: type === "internal" ? "Nueva Carpeta" : "Nuevo Item",
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

  const handleDelete = ({ ids }: { ids: string[] }) => {
    const deleteNodes = (items: BookmarkItem[]): BookmarkItem[] => {
      return items.reduce((acc, item) => {
        if (ids.includes(item.id)) {
          return acc;
        }
        if (item.children) {
          item.children = deleteNodes(item.children);
        }
        return [...acc, item];
      }, [] as BookmarkItem[]);
    };

    const newData = deleteNodes(data);
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
      <Sidebar stats={stats} />
      <MainContent
        data={data}
        searchTerm={term}
        onTermChange={setTerm}
        onDataImport={handleDataImport}
        onCreate={handleCreate}
        onMove={handleMove}
        onRename={handleRename}
        onDelete={handleDelete}
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
