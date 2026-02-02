import { useEffect, useContext } from "react";
import { NodeApi } from "react-arborist";
import type { BookmarkItem } from "../../types/bookmark";
import { BookmarkModal } from "../BookmarkModal";
import { BookmarkContext } from "../MainContent/MainContent";

interface NodeInputProps {
  node: NodeApi<BookmarkItem>;
}

export function NodeInput({ node }: NodeInputProps) {
  const { onUpdate } = useContext(BookmarkContext);

  // Hacer scroll al nodo cuando entra en modo edición
  useEffect(() => {
    node.tree.scrollTo(node.id, "center");
  }, [node]);

  const handleSave = (data: {
    name: string;
    url: string;
    tags: string[];
    icon?: string;
  }) => {
    // Si es una carpeta (isInternal), solo actualizar el nombre
    if (node.isInternal) {
      node.submit(data.name);
      return;
    }

    // Para bookmarks (hojas), actualizar todos los campos
    const updatedData: BookmarkItem = {
      ...node.data,
      name: data.name,
      url: data.url,
      tags: data.tags,
    };

    // Manejar el icono: si está vacío, eliminarlo; si tiene valor, asignarlo
    if (data.icon && data.icon.trim() !== "") {
      updatedData.icon = data.icon;
    } else {
      updatedData.icon = "";
    }

    // Llamar onUpdate para actualizar el estado global
    onUpdate?.(node.id, updatedData);

    // Salir del modo edición
    node.reset();
  };

  const handleCancel = () => {
    node.reset();
  };

  return (
    <BookmarkModal
      isOpen={true}
      isFolder={node.isInternal}
      initialName={node.data.name}
      initialUrl={node.data.url}
      initialTags={node.data.tags || []}
      initialIcon={node.data.icon || ""}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
