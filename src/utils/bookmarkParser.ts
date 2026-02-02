import type { BookmarkItem } from "../types/bookmark";

export function parseBookmarkHTML(htmlContent: string): BookmarkItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  let idCounter = 1;

  const parseNode = (element: Element): BookmarkItem | null => {
    if (element.tagName === "A") {
      const href = element.getAttribute("HREF");
      const addDate = element.getAttribute("ADD_DATE");
      const icon = element.getAttribute("ICON");

      return {
        id: String(idCounter++),
        name: element.textContent || "Sin título",
        url: href || undefined,
        addDate: addDate || undefined,
        icon: icon || undefined,
      };
    }

    if (element.tagName === "H3") {
      const addDate = element.getAttribute("ADD_DATE");
      const icon = element.getAttribute("ICON");
      const item: BookmarkItem = {
        id: String(idCounter++),
        name: element.textContent || "Carpeta sin título",
        addDate: addDate || undefined,
        icon: icon || undefined,
        children: [],
      };

      // Buscar el siguiente DL que contiene los hijos
      let nextElement = element.nextElementSibling;
      while (nextElement && nextElement.tagName !== "DL") {
        nextElement = nextElement.nextElementSibling;
      }

      if (nextElement && nextElement.tagName === "DL") {
        const children = parseChildren(nextElement);
        if (children.length > 0) {
          item.children = children;
        }
      }

      return item;
    }

    return null;
  };

  const parseChildren = (dl: Element): BookmarkItem[] => {
    const items: BookmarkItem[] = [];
    const directChildren = Array.from(dl.children);

    for (const child of directChildren) {
      if (child.tagName === "DT") {
        const firstChild = child.firstElementChild;
        if (firstChild) {
          const parsed = parseNode(firstChild);
          if (parsed) {
            items.push(parsed);
          }
        }
      }
    }

    return items;
  };

  // Buscar el primer DL en el documento
  const rootDL = doc.querySelector("DL");
  if (rootDL) {
    return parseChildren(rootDL);
  }

  return [];
}
