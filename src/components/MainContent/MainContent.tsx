import { Tree, TreeApi } from "react-arborist";
import { type BookmarkItem } from "../../data/bookmarks";
import { TreeNode } from "../TreeNode";
import { DropCursor } from "../DropCursor";
import { BookmarkImporter } from "../BookmarkImporter";
import { useCallback, useState, useRef, useMemo } from "react";
import "./MainContent.css";
import { Icon } from "@iconify/react";

interface MainContentProps {
  data: BookmarkItem[];
  searchTerm: string;
  onTermChange: (term: string) => void;
  onDataImport?: (newData: BookmarkItem[]) => void;
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
}

export function MainContent({
  data,
  searchTerm,
  onTermChange,
  onDataImport,
  onCreate,
  onMove,
  onRename,
  onDelete,
  onToggle,
}: MainContentProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const treeRef = useRef<TreeApi<BookmarkItem> | null>(null);

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
              icon="solar:minimalistic-magnifer-linear"
              height={18}
              width={18}
              className="search-icon"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onTermChange(e.currentTarget.value)}
              placeholder="Buscar bookmarks..."
              className="search-input"
            />
          </div>
        </div>
        <div className="header-actions">
          <BookmarkImporter onImport={handleImport} />
          <div className="chip" onClick={handleCollapseAll}>
            <Icon icon="solar:minimize-linear" height={16} width={16} />
            <span>Colapsar</span>
          </div>
          <div className="chip" onClick={handleExpandAll}>
            <Icon icon="solar:maximize-linear" height={16} width={16} />
            <span>Expandir</span>
          </div>
        </div>
      </div>

      <div className="tree-container">
        <div ref={containerRef} className="tree-wrapper">
          {dimensions.width > 0 && dimensions.height > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
