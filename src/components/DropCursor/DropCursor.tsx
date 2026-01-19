import { type CursorProps } from "react-arborist";
import "./DropCursor.css";

export function DropCursor({ top, left }: CursorProps) {
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
