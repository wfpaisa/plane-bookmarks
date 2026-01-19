import { type NodeRendererProps, NodeApi } from "react-arborist";
import {
  MdFolder,
  MdBookmark,
  MdArrowDropDown,
  MdArrowRight,
} from "react-icons/md";
import clsx from "clsx";
import { type BookmarkItem } from "../../data/bookmarks";
import { NodeInput } from "./NodeInput";
import "./TreeNode.css";

export function TreeNode({
  node,
  style,
  dragHandle,
}: NodeRendererProps<BookmarkItem>) {
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
        {node.isEditing ? <NodeInput node={node} /> : node.data.name}
      </span>
    </div>
  );
}

function FolderArrow({ node }: { node: NodeApi<BookmarkItem> }) {
  if (node.isLeaf) return <span className="node-arrow"></span>;
  return (
    <span className="node-arrow">
      {node.isOpen ? <MdArrowDropDown size={20} /> : <MdArrowRight size={20} />}
    </span>
  );
}
