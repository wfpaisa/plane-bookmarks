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
  tree,
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
      {node.isLeaf && (
        <span className="node-icon">
          {node.data.icon && node.data.icon.trim() !== "" ? (
            <a
              href={node.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="node-link"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={node.data.icon} alt="" className="node-favicon" />
            </a>
          ) : (
            <Icon
              icon="solar:bookmark-linear"
              className="node-bookmark-icon"
              width={16}
              height={16}
            />
          )}
        </span>
      )}
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
          <Icon icon="solar:pen-linear" width={24} height={24} />
        </span>
      )}
      {!node.isEditing && (
        <span
          className="node-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            tree.delete(node);
          }}
          title={node.isLeaf ? "Eliminar bookmark" : "Eliminar carpeta"}
        >
          <Icon icon="solar:trash-bin-trash-linear" width={24} height={24} />
        </span>
      )}
      {!node.isLeaf && !node.isEditing && (
        <>
          {/* Agrega un bookmar */}
          <span
            className="node-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              tree.create({ parentId: node.id, type: "leaf" });
            }}
            title="Agregar bookmark"
          >
            <Icon icon="solar:add-square-line-duotone" width={24} height={24} />
          </span>

          {/* Agrega una carpeta */}
          <span
            className="node-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              tree.create({ parentId: node.id, type: "internal" });
            }}
            title="Agregar carpeta"
          >
            <Icon icon="solar:add-folder-line-duotone" width={24} height={24} />
          </span>
        </>
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
  if (node.isLeaf) return null;
  return (
    <span
      className="node-arrow clickable"
      onClick={(e) => {
        e.stopPropagation();
        node.toggle();
      }}
    >
      {node.isOpen ? (
        <Icon
          icon="solar:folder-open-bold-duotone"
          width={24}
          height={24}
          className="folder-icon"
        />
      ) : (
        <Icon
          icon="solar:folder-bold-duotone"
          width={24}
          height={24}
          className="folder-icon"
        />
      )}
    </span>
  );
}
