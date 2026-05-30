import type { BookmarkItem } from "../types/bookmark";

/**
 * Elimina nodos del árbol por sus IDs.
 * Se usa en operaciones de mover (drag & drop) y eliminar bookmarks,
 * donde primero se extraen los nodos antes de reinsertarlos o descartarlos.
 */
export function removeNodes(
  items: BookmarkItem[],
  ids: string[],
): BookmarkItem[] {
  return items.reduce((acc, item) => {
    if (ids.includes(item.id)) return acc;
    if (item.children) {
      return [...acc, { ...item, children: removeNodes(item.children, ids) }];
    }
    return [...acc, item];
  }, [] as BookmarkItem[]);
}

/**
 * Busca y retorna nodos del árbol que coincidan con los IDs dados.
 * Se usa en drag & drop para obtener las referencias de los nodos
 * que se están moviendo antes de reinsertarlos en su nueva posición.
 */
export function findNodes(
  items: BookmarkItem[],
  ids: string[],
): BookmarkItem[] {
  const found: BookmarkItem[] = [];
  const search = (items: BookmarkItem[]) => {
    items.forEach((item) => {
      if (ids.includes(item.id)) found.push(item);
      if (item.children) search(item.children);
    });
  };
  search(items);
  return found;
}

/**
 * Inserta nodos en una posición específica del árbol.
 * Si parentId es null, inserta en la raíz; si no, busca la carpeta padre
 * y añade los nodos en el índice indicado dentro de sus hijos.
 * Se usa en drag & drop y creación de nuevos bookmarks/carpetas.
 */
export function insertNodes(
  items: BookmarkItem[],
  parentId: string | null,
  index: number,
  nodes: BookmarkItem[],
): BookmarkItem[] {
  if (parentId === null) {
    const result = [...items];
    result.splice(index, 0, ...nodes);
    return result;
  }

  return items.map((item) => {
    if (item.id === parentId) {
      const newChildren = [...(item.children || [])];
      newChildren.splice(index, 0, ...nodes);
      return { ...item, children: newChildren };
    }
    if (item.children) {
      return {
        ...item,
        children: insertNodes(item.children, parentId, index, nodes),
      };
    }
    return item;
  });
}

/**
 * Actualiza un nodo específico del árbol usando una función de transformación.
 * Patrón genérico que reemplaza las funciones individuales de rename, update
 * y toggle, evitando duplicación de la lógica de recorrido recursivo.
 */
export function updateNode(
  items: BookmarkItem[],
  id: string,
  updater: (item: BookmarkItem) => BookmarkItem,
): BookmarkItem[] {
  return items.map((item) => {
    if (item.id === id) return updater(item);
    if (item.children) {
      return { ...item, children: updateNode(item.children, id, updater) };
    }
    return item;
  });
}

/**
 * Recolecta todos los tags únicos del árbol de bookmarks, ordenados alfabéticamente.
 * Se usa para mostrar la lista de tags disponibles en el sidebar
 * y habilitar el filtrado por tags.
 */
export function collectTags(items: BookmarkItem[]): string[] {
  const tagsSet = new Set<string>();
  const collect = (items: BookmarkItem[]) => {
    items.forEach((item) => {
      item.tags?.forEach((tag) => tagsSet.add(tag));
      if (item.children) collect(item.children);
    });
  };
  collect(items);
  return Array.from(tagsSet).sort();
}
