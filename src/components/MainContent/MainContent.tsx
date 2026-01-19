import { MdViewModule, MdFilterList } from "react-icons/md";
import { Tree, TreeApi } from "react-arborist";
import { type BookmarkItem } from "../../data/bookmarks";
import { TreeNode } from "../TreeNode";
import { DropCursor } from "../DropCursor";
import { useCallback, useState } from "react";
import "./MainContent.css";

interface MainContentProps {
  data: BookmarkItem[];
  searchTerm: string;
}

export function MainContent({ data, searchTerm }: MainContentProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      setDimensions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    }
  }, []);

  const globalTree = (tree?: TreeApi<BookmarkItem> | null) => {
    // @ts-ignore
    window.tree = tree;
  };

  return (
    <div className="main-content">
      <div className="content-header">
        <div className="header-left">
          <h1>Explorador de Bookmarks</h1>
          <p className="header-subtitle">
            Organiza y gestiona tus recursos de forma eficiente
          </p>
        </div>
        <div className="header-actions">
          <div className="chip active">
            <MdViewModule size={14} />
            <span>Vista árbol</span>
          </div>
          <div className="chip">
            <MdFilterList size={14} />
            <span>Filtros</span>
          </div>
        </div>
      </div>

      <div className="tree-container">
        <div ref={containerRef} className="tree-wrapper">
          {dimensions.width > 0 && dimensions.height > 0 && (
            <Tree
              ref={globalTree}
              initialData={data}
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
