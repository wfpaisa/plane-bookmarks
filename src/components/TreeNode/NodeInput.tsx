import { NodeApi } from "react-arborist";
import { type BookmarkItem } from "../../data/bookmarks";

interface NodeInputProps {
  node: NodeApi<BookmarkItem>;
}

export function NodeInput({ node }: NodeInputProps) {
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
