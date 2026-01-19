import "./App.css";
import { bookmarksData, type BookmarkItem } from "./data/bookmarks";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { useBookmarkStats } from "./hooks/useBookmarkStats";

function App() {
  const [term, setTerm] = useState("");
  const [data, setData] = useState<BookmarkItem[]>(bookmarksData);
  const stats = useBookmarkStats(data);

  const handleDataImport = (newData: BookmarkItem[]) => {
    setData(newData);
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

    setData(renameNode(data));
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

    setData(deleteNodes(data));
  };

  return (
    <div className="app-container">
      <Sidebar term={term} onTermChange={setTerm} stats={stats} />
      <MainContent
        data={data}
        searchTerm={term}
        onDataImport={handleDataImport}
        onMove={handleMove}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default App;
