import { type NodeRendererProps, NodeApi } from "react-arborist";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { type BookmarkItem } from "../../data/bookmarks";
import { NodeInput } from "./NodeInput";
import "./TreeNode.css";

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
      onClick={() => node.isInternal && node.toggle()}
    >
      <FolderArrow node={node} />
      <span className="node-icon">
        {node.isInternal ? (
          // <Icon icon="solar:bookmark-linear" width={18} height={18} />
          <i></i>
        ) : node.data.icon && node.data.icon.trim() !== "" ? (
          <img src={node.data.icon} alt="" style={{ width: 18, height: 18 }} />
        ) : (
          <Icon icon="solar:bookmark-linear" width={18} height={18} />
        )}
      </span>
      <span className="node-name">
        {node.isEditing ? <NodeInput node={node} /> : node.data.name}
      </span>
      {node.isLeaf && node.data.url && (
        <span className="node-url">
          <a href={node.data.url} target="_blank" rel="noopener noreferrer">
            <Icon
              icon="solar:link-minimalistic-2-bold"
              width={22}
              height={22}
              className="icon-link"
            />
          </a>
        </span>
      )}
      {node.isLeaf && node.data.tags && node.data.tags.length > 0 && (
        <span className="node-tags">Tags: {node.data.tags.join(", ")}</span>
      )}
    </div>
  );
}

function FolderArrow({ node }: { node: NodeApi<BookmarkItem> }) {
  if (node.isLeaf) return <span className="node-arrow"></span>;
  return (
    <span className="node-arrow">
      {node.isOpen ? (
        <Icon icon="solar:minus-square-line-duotone" width={24} height={24} />
      ) : (
        <Icon icon="solar:add-square-line-duotone" width={24} height={24} />
      )}
    </span>
  );
}
