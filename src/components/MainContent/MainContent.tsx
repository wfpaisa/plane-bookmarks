import { Tree, TreeApi, NodeApi } from "react-arborist";
import type { BookmarkItem } from "../../types/bookmark";
import { TreeNode } from "../TreeNode";
import { DropCursor } from "../DropCursor";
import { BookmarkImporter } from "../BookmarkImporter";
import { BookmarkContext } from "../../contexts/BookmarkContext";
import { useCallback, useState, useRef, useMemo } from "react";
import "./MainContent.css";
import { Icon } from "@iconify/react";

interface MainContentProps {
  data: BookmarkItem[];
  searchTerm: string;
  onTermChange: (term: string) => void;
  onDataImport?: (newData: BookmarkItem[]) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  tagSearchEnabled?: boolean;
  onCreate?: (args: {
    parentId: string | null;
    index: number;
    type: "leaf" | "internal";
  }) => { id: string } | null;
  onMove?: (args: {
    dragIds: string[];
    parentId: string | null;
    index: number;
  }) => void;
  onRename?: (args: { id: string; name: string }) => void;
  onDelete?: (args: { ids: string[] }) => void;
  onToggle?: (id: string) => void;
  onUpdate?: (id: string, data: BookmarkItem) => void;
}

/**
 * Área principal que contiene la barra de búsqueda, controles de árbol,
 * importador y el componente Tree de react-arborist.
 * Recibe los datos y handlers de mutación desde App vía props.
 */
export function MainContent({
  data,
  searchTerm,
  onTermChange,
  onDataImport,
  onToggleSidebar,
  tagSearchEnabled,
  onCreate,
  onMove,
  onRename,
  onDelete,
  onToggle,
  onUpdate,
}: MainContentProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isTagSearch, setIsTagSearch] = useState(tagSearchEnabled ?? false);
  const treeRef = useRef<TreeApi<BookmarkItem> | null>(null);

  // Sincronizar isTagSearch cuando el prop cambia desde el sidebar (click en tag)
  if (tagSearchEnabled && !isTagSearch) {
    setIsTagSearch(true);
  }

  /** Mide el contenedor del árbol para pasarle dimensiones exactas a react-arborist. */
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      setDimensions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    }
  }, []);

  /**
   * Función de búsqueda unificada que filtra nodos por nombre+tags o solo por tags,
   * según el modo activo. En modo tags, soporta múltiples tags separados por coma
   * y exige que el nodo tenga todos los tags buscados (AND).
   */
  const searchMatch = useCallback(
    (node: NodeApi<BookmarkItem>, term: string) => {
      if (isTagSearch) {
        const searchTags = term
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t);
        return searchTags.every(
          (searchTag) =>
            node.data.tags?.some(
              (tag: string) => tag.toLowerCase() === searchTag,
            ) ?? false,
        );
      }

      const lowerTerm = term.toLowerCase();
      const nameMatch = node.data.name.toLowerCase().includes(lowerTerm);
      const tagMatch =
        node.data.tags?.some((tag: string) =>
          tag.toLowerCase().includes(lowerTerm),
        ) ?? false;
      return nameMatch || tagMatch;
    },
    [isTagSearch],
  );

  /**
   * Construye el mapa de estado abierto/cerrado UNA SOLA VEZ desde los datos iniciales.
   * El lazy initializer de useState solo se ejecuta en el primer render.
   * MainContent se monta después de isLoading, así que data ya tiene los datos reales.
   * Después de eso, react-arborist gestiona el estado abierto/cerrado internamente
   * via su store Redux.
   */
  const [initialOpenState] = useState(() => {
    const openState: Record<string, boolean> = {};
    const buildOpenState = (items: BookmarkItem[]) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          openState[item.id] = item.isOpen ?? false;
          buildOpenState(item.children);
        }
      });
    };
    buildOpenState(data);
    return openState;
  });

  /** Valor estable del contexto para evitar re-renders innecesarios de consumidores. */
  const contextValue = useMemo(() => ({ onUpdate }), [onUpdate]);

  return (
    <div className="main-content">
      <div className="content-header">
        <div className="header-center">
          <div className="search-wrapper">
            <Icon
              icon={
                isTagSearch
                  ? "solar:bookmark-linear"
                  : "solar:minimalistic-magnifer-linear"
              }
              height={18}
              width={18}
              className="search-icon"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onTermChange(e.currentTarget.value)}
              placeholder={
                isTagSearch
                  ? "Buscar por tags (ej: ai,db)"
                  : "Buscar bookmarks..."
              }
              className={`search-input ${isTagSearch ? "tag-search" : ""}`}
            />
            <label className="tag-search-label">
              <input
                type="checkbox"
                checked={isTagSearch}
                onChange={(e) => setIsTagSearch(e.target.checked)}
              />
              Tags
            </label>

            <Icon
              icon="solar:close-circle-linear"
              height={18}
              width={18}
              onClick={() => {
                onTermChange("");
                setIsTagSearch(false);
              }}
              className="clear-search-button"
            />
          </div>
        </div>
        <div className="header-actions">
          {onToggleSidebar && (
            <div
              className="chip toggle-sidebar"
              onClick={onToggleSidebar}
              title="Toggle Sidebar"
            >
              <Icon
                icon="solar:sidebar-minimalistic-linear"
                height={16}
                width={16}
              />
            </div>
          )}
          <div
            className="chip"
            onClick={() => treeRef.current?.closeAll()}
            title="Colapsar"
          >
            <Icon icon="solar:minimize-linear" height={16} width={16} />
          </div>
          <div
            className="chip"
            onClick={() => treeRef.current?.openAll()}
            title="Expandir"
          >
            <Icon icon="solar:maximize-linear" height={16} width={16} />
          </div>
          {onDataImport && <BookmarkImporter onImport={onDataImport} />}
        </div>
      </div>

      <div className="tree-container">
        <div ref={containerRef} className="tree-wrapper">
          {dimensions.width > 0 && dimensions.height > 0 && (
            <BookmarkContext.Provider value={contextValue}>
              <Tree
                ref={treeRef}
                data={data}
                onCreate={onCreate}
                onMove={onMove}
                onRename={onRename}
                onDelete={onDelete}
                onToggle={onToggle}
                initialOpenState={initialOpenState}
                openByDefault={false}
                width={dimensions.width}
                height={dimensions.height}
                rowHeight={48}
                renderCursor={DropCursor}
                searchTerm={searchTerm}
                searchMatch={searchMatch}
                paddingBottom={12}
                indent={48}
              >
                {TreeNode}
              </Tree>
            </BookmarkContext.Provider>
          )}
        </div>
      </div>
    </div>
  );
}
