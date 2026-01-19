import "./App.css";
import clsx from "clsx";
import {
  type CursorProps,
  NodeApi,
  type NodeRendererProps,
  Tree,
  TreeApi,
} from "react-arborist";
import { gmailData, type GmailItem } from "./data/bookmarks";
import {
  MdSearch,
  MdFilterList,
  MdViewModule,
  MdFolder,
  MdBookmark,
  MdArrowDropDown,
  MdArrowRight,
} from "react-icons/md";
import { useState, useMemo, useCallback } from "react";

function App() {
  const [term, setTerm] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      setDimensions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    }
  }, []);

  const globalTree = (tree?: TreeApi<GmailItem> | null) => {
    // @ts-ignore
    window.tree = tree;
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const countItems = (
      items: GmailItem[],
    ): { total: number; unread: number; folders: number } => {
      let total = 0;
      let unread = 0;
      let folders = 0;

      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          folders++;
          const childStats = countItems(item.children);
          total += childStats.total;
          unread += childStats.unread;
          folders += childStats.folders;
        } else {
          total++;
          if (item.unread) unread += item.unread;
        }
      });

      return { total, unread, folders };
    };

    return countItems(gmailData);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">Bookmarks</h1>
          <p className="app-subtitle">Manager Pro</p>
        </div>

        <div className="search-section">
          <div className="search-wrapper">
            <MdSearch className="search-icon" size={16} />
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.currentTarget.value)}
              placeholder="Buscar bookmarks..."
              className="search-input"
            />
          </div>
        </div>

        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Items</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-trend">
                +{Math.floor(stats.total * 0.12)} este mes
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Carpetas</div>
              <div className="stat-value">{stats.folders}</div>
              <div className="stat-trend">{stats.folders} activas</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Sin leer</div>
              <div className="stat-value">{stats.unread}</div>
              <div className="stat-trend">Requieren atención</div>
            </div>
          </div>
        </div>

        <div className="help-section">
          <div className="help-title">Atajos rápidos</div>
          <div className="shortcut-list">
            <div className="shortcut-item">
              <span>Navegar</span>
              <span className="shortcut-key">↑↓</span>
            </div>
            <div className="shortcut-item">
              <span>Abrir/Cerrar</span>
              <span className="shortcut-key">Space</span>
            </div>
            <div className="shortcut-item">
              <span>Renombrar</span>
              <span className="shortcut-key">Enter</span>
            </div>
            <div className="shortcut-item">
              <span>Nuevo</span>
              <span className="shortcut-key">A</span>
            </div>
            <div className="shortcut-item">
              <span>Carpeta</span>
              <span className="shortcut-key">⇧A</span>
            </div>
            <div className="shortcut-item">
              <span>Eliminar</span>
              <span className="shortcut-key">Del</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                initialData={gmailData}
                width={dimensions.width}
                height={dimensions.height}
                rowHeight={40}
                renderCursor={Cursor}
                searchTerm={term}
                paddingBottom={40}
                disableEdit={(data) => data.readOnly}
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
                {Node}
              </Tree>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Node({ node, style, dragHandle }: NodeRendererProps<GmailItem>) {
  const Icon = node.isInternal ? MdFolder : MdBookmark;
  return (
    <div
      ref={dragHandle}
      style={style}
      className={clsx("tree-node", node.state, {
        selected: node.isSelected,
        editing: node.isEditing,
      })}
      onClick={() => node.isInternal && node.toggle()}
    >
      <FolderArrow node={node} />
      <span className="node-icon">
        <Icon size={18} />
      </span>
      <span className="node-name">
        {node.isEditing ? <Input node={node} /> : node.data.name}
      </span>
      {node.data.unread !== undefined && node.data.unread > 0 && (
        <span className="node-badge">{node.data.unread}</span>
      )}
    </div>
  );
}

function Input({ node }: { node: NodeApi<GmailItem> }) {
  return (
    <input
      autoFocus
      type="text"
      defaultValue={node.data.name}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => node.reset()}
      onKeyDown={(e) => {
        if (e.key === "Escape") node.reset();
        if (e.key === "Enter") node.submit(e.currentTarget.value);
      }}
      className="node-input"
    />
  );
}

function FolderArrow({ node }: { node: NodeApi<GmailItem> }) {
  if (node.isLeaf) return <span className="node-arrow"></span>;
  return (
    <span className="node-arrow">
      {node.isOpen ? <MdArrowDropDown size={20} /> : <MdArrowRight size={20} />}
    </span>
  );
}

function Cursor({ top, left }: CursorProps) {
  return (
    <div
      className="drop-cursor"
      style={{
        top,
        left,
      }}
    />
  );
}

export default App;
