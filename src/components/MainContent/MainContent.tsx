import {
  MdViewModule,
  MdFilterList,
  MdUpload,
  MdUnfoldLess,
  MdUnfoldMore,
} from "react-icons/md";
import { Tree, TreeApi } from "react-arborist";
import { type BookmarkItem } from "../../data/bookmarks";
import { TreeNode } from "../TreeNode";
import { DropCursor } from "../DropCursor";
import { useCallback, useState, useRef } from "react";
import "./MainContent.css";

interface MainContentProps {
  data: BookmarkItem[];
  searchTerm: string;
  onDataImport?: (newData: BookmarkItem[]) => void;
}

export function MainContent({
  data,
  searchTerm,
  onDataImport,
}: MainContentProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const parseBookmarkHTML = (htmlContent: string): BookmarkItem[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    let idCounter = 1;

    const parseNode = (element: Element): BookmarkItem | null => {
      if (element.tagName === "A") {
        const href = element.getAttribute("HREF");
        const addDate = element.getAttribute("ADD_DATE");
        const icon = element.getAttribute("ICON");
        return {
          id: String(idCounter++),
          name: element.textContent || "Sin título",
          url: href || undefined,
          addDate: addDate || undefined,
          icon: icon || undefined,
        };
      }

      if (element.tagName === "H3") {
        const addDate = element.getAttribute("ADD_DATE");
        const icon = element.getAttribute("ICON");
        const item: BookmarkItem = {
          id: String(idCounter++),
          name: element.textContent || "Carpeta sin título",
          addDate: addDate || undefined,
          icon: icon || undefined,
          children: [],
        };

        // Buscar el siguiente DL que contiene los hijos
        let nextElement = element.nextElementSibling;
        while (nextElement && nextElement.tagName !== "DL") {
          nextElement = nextElement.nextElementSibling;
        }

        if (nextElement && nextElement.tagName === "DL") {
          const children = parseChildren(nextElement);
          if (children.length > 0) {
            item.children = children;
          }
        }

        return item;
      }

      return null;
    };

    const parseChildren = (dl: Element): BookmarkItem[] => {
      const items: BookmarkItem[] = [];
      const directChildren = Array.from(dl.children);

      for (const child of directChildren) {
        if (child.tagName === "DT") {
          const firstChild = child.firstElementChild;
          if (firstChild) {
            const parsed = parseNode(firstChild);
            if (parsed) {
              items.push(parsed);
            }
          }
        }
      }

      return items;
    };

    // Buscar el primer DL en el documento
    const rootDL = doc.querySelector("DL");
    if (rootDL) {
      return parseChildren(rootDL);
    }

    return [];
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const importedData = parseBookmarkHTML(content);
        if (importedData.length > 0 && onDataImport) {
          onDataImport(importedData);
        } else {
          alert("No se encontraron bookmarks en el archivo");
        }
      } catch (error) {
        console.error("Error al parsear el archivo:", error);
        alert(
          "Error al importar el archivo. Verifica que sea un archivo HTML válido de Chrome.",
        );
      }
    };
    reader.readAsText(file);

    // Resetear el input para permitir importar el mismo archivo de nuevo
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCollapseAll = () => {
    treeRef.current?.closeAll();
  };

  const handleExpandAll = () => {
    treeRef.current?.openAll();
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".html"
            onChange={handleFileImport}
            style={{ display: "none" }}
          />
          <div className="chip" onClick={handleImportClick}>
            <MdUpload size={14} />
            <span>Importar HTML</span>
          </div>
          <div className="chip" onClick={handleCollapseAll}>
            <MdUnfoldLess size={14} />
            <span>Colapsar todo</span>
          </div>
          <div className="chip" onClick={handleExpandAll}>
            <MdUnfoldMore size={14} />
            <span>Expandir todo</span>
          </div>
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
              data={data}
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
