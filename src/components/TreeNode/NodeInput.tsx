import { useEffect } from "react";
import { NodeApi } from "react-arborist";
import { type BookmarkItem } from "../../data/bookmarks";
import { BookmarkModal } from "../BookmarkModal";

interface NodeInputProps {
  node: NodeApi<BookmarkItem>;
}

export function NodeInput({ node }: NodeInputProps) {
  // Hacer scroll al nodo cuando entra en modo edición
  useEffect(() => {
    node.tree.scrollTo(node.id, "center");
  }, [node]);

  const handleSave = (data: { name: string; url: string; tags: string[] }) => {
    // Si es una carpeta (isInternal), solo actualizar el nombre
    if (node.isInternal) {
      node.submit(data.name);
      return;
    }

    // Para bookmarks (hojas), actualizar todos los campos
    const updatedData = {
      ...node.data,
      name: data.name,
      url: data.url,
      tags: data.tags,
    };

    // Actualizar los datos del nodo
    Object.assign(node.data, updatedData);

    // Enviar solo el nombre al submit (por compatibilidad)
    node.submit(data.name);
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
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
