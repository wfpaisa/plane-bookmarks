import { useEffect, useContext } from "react";
import { NodeApi } from "react-arborist";
import type { BookmarkItem } from "../../types/bookmark";
import { BookmarkModal } from "../BookmarkModal";
import { BookmarkContext } from "../../contexts/BookmarkContext";

interface NodeInputProps {
  node: NodeApi<BookmarkItem>;
}

/**
 * Componente de edición inline que se muestra cuando un nodo entra en modo edición.
 * Para carpetas solo edita el nombre; para bookmarks abre BookmarkModal
 * con todos los campos (nombre, URL, tags, icono).
 */
export function NodeInput({ node }: NodeInputProps) {
  const { onUpdate } = useContext(BookmarkContext);

  // Hacer scroll al nodo cuando entra en modo edición
  useEffect(() => {
    node.tree.scrollTo(node.id, "center");
  }, [node]);

  /**
   * Guarda los cambios del modal. Para carpetas solo renombra via node.submit;
   * para bookmarks actualiza todos los campos via onUpdate del contexto.
   */
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
