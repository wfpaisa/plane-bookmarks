import { type NodeRendererProps, NodeApi } from "react-arborist";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import type { BookmarkItem } from "../../types/bookmark";
import { NodeInput } from "./NodeInput";
import "./TreeNode.css";

/**
 * Renderizador de nodo individual del árbol.
 * Muestra icono de carpeta/bookmark, nombre (como enlace si tiene URL),
 * tags, botón de edición y enlace externo. Soporta modo edición inline via NodeInput.
 * - Click en el nodo selecciona (no abre carpetas).
 * - Solo el icono +/- abre/cierra carpetas.
 * - Drag funciona desde cualquier parte del nodo.
 */
export function TreeNode({
  node,
  style,
  dragHandle,
}: NodeRendererProps<BookmarkItem>) {
  return (
    <div
      ref={dragHandle}
      style={style}
      className={clsx("tree-node", node.state, {
        selected: node.isSelected,
        editing: node.isEditing,
      })}
      onClick={(e) => node.handleClick(e)}
    >
      <FolderArrow node={node} />
      <span className="node-icon">
        {node.isLeaf ? (
          node.data.icon && node.data.icon.trim() !== "" ? (
            <a
              href={node.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="node-link"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={node.data.icon}
                alt=""
                style={{ width: 18, height: 18 }}
              />
            </a>
          ) : (
            <Icon icon="solar:bookmark-linear" width={18} height={18} />
          )
        ) : (
          <Icon
            icon={
              node.isOpen
                ? "solar:folder-open-bold-duotone"
                : "solar:folder-bold-duotone"
            }
            width={18}
            height={18}
            className="folder-icon"
          />
        )}
      </span>
      <span className="node-name">
        {node.isEditing ? (
          <NodeInput node={node} />
        ) : node.isLeaf && node.data.url ? (
          <a
            href={node.data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="node-link"
            onClick={(e) => e.stopPropagation()}
          >
            {node.data.name}
          </a>
        ) : (
          <span className="node-text">{node.data.name}</span>
        )}
      </span>
      {node.isLeaf && node.data.tags && node.data.tags.length > 0 && (
        <span className="node-tags">{node.data.tags.join(", ")}</span>
      )}
      {!node.isEditing && (
        <span
          className="node-edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            node.edit();
          }}
          title="Editar"
        >
          <Icon icon="solar:pen-linear" width={16} height={16} />
        </span>
      )}
      {node.isLeaf && node.data.url && (
        <span className="node-url">
          <a
            href={node.data.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon
              icon="solar:link-minimalistic-2-bold"
              width={22}
              height={22}
              className="icon-link"
            />
          </a>
        </span>
      )}
    </div>
  );
}

/** Flecha de expansión/colapso para nodos carpeta. Click solo en el icono abre/cierra. */
function FolderArrow({ node }: { node: NodeApi<BookmarkItem> }) {
  if (node.isLeaf) return <span className="node-arrow"></span>;
  return (
    <span
      className="node-arrow clickable"
      onClick={(e) => {
        e.stopPropagation();
        node.toggle();
      }}
    >
      {node.isOpen ? (
        <Icon icon="solar:minus-square-line-duotone" width={24} height={24} />
      ) : (
        <Icon icon="solar:add-square-line-duotone" width={24} height={24} />
      )}
    </span>
  );
}
