import { Tree, TreeApi, NodeApi } from "react-arborist";
import type { BookmarkItem } from "../../types/bookmark";
import { TreeNode } from "../TreeNode";
import { DropCursor } from "../DropCursor";
import { BookmarkImporter } from "../BookmarkImporter";
import {
  useCallback,
  useState,
  useRef,
  useMemo,
  createContext,
  useEffect,
} from "react";
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

export const BookmarkContext = createContext<{
  onUpdate?: (id: string, data: BookmarkItem) => void;
}>({});

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
  const [isTagSearch, setIsTagSearch] = useState(false);
  const treeRef = useRef<TreeApi<BookmarkItem> | null>(null);

  useEffect(() => {
    if (tagSearchEnabled) {
      setIsTagSearch(true);
    }
  }, [tagSearchEnabled]);

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      setDimensions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    }
  }, []);

  const globalTree = (tree?: TreeApi<BookmarkItem> | null) => {
    treeRef.current = tree || null;
    // @ts-ignore
    window.tree = tree;
  };

  const handleCollapseAll = () => {
    treeRef.current?.closeAll();
  };

  const handleExpandAll = () => {
    treeRef.current?.openAll();
  };

  const handleImport = (newData: BookmarkItem[]) => {
    onDataImport?.(newData);
  };

  const defaultSearchMatch = (node: NodeApi<BookmarkItem>, term: string) => {
    const lowerTerm = term.toLowerCase();
    const hasName = node.data.name.toLowerCase().includes(lowerTerm);
    const hasTag = node.data.tags
      ? node.data.tags.some((tag: string) =>
          tag.toLowerCase().includes(lowerTerm),
        )
      : false;
    return hasName || hasTag;
  };

  const tagSearchMatch = (node: NodeApi<BookmarkItem>, term: string) => {
    const searchTags = term
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t);
    return searchTags.every((searchTag) =>
      node.data.tags
        ? node.data.tags.some((tag: string) => tag.toLowerCase() === searchTag)
        : false,
    );
  };

  // Crear initialOpenState desde los datos
  const initialOpenState = useMemo(() => {
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
  }, [data]);

  // Handler para toggle de carpetas
  const handleToggle = useCallback(
    (id: string) => {
      onToggle?.(id);
    },
    [onToggle],
  );

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
          <div className="chip" onClick={handleCollapseAll} title="Colapsar">
            <Icon icon="solar:minimize-linear" height={16} width={16} />
          </div>
          <div className="chip" onClick={handleExpandAll} title="Expandir">
            <Icon icon="solar:maximize-linear" height={16} width={16} />
          </div>
          <BookmarkImporter onImport={handleImport} />
        </div>
      </div>

      <div className="tree-container">
        <div ref={containerRef} className="tree-wrapper">
          {dimensions.width > 0 && dimensions.height > 0 && (
            <BookmarkContext.Provider value={{ onUpdate }}>
              <Tree
                ref={globalTree}
                data={data}
                onCreate={onCreate}
                onMove={onMove}
                onRename={onRename}
                onDelete={onDelete}
                onToggle={handleToggle}
                initialOpenState={initialOpenState}
                width={dimensions.width}
                height={dimensions.height}
                rowHeight={40}
                renderCursor={DropCursor}
                searchTerm={searchTerm}
                searchMatch={isTagSearch ? tagSearchMatch : defaultSearchMatch}
                paddingBottom={40}
                disableDrop={({ parentNode, dragNodes }) => {
                  if (
                    parentNode.data.name === "Categories" &&
                    dragNodes.some((drag) => drag.data.name === "Inbox")
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                }}
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
