import type { BookmarkItem } from "../types/bookmark";

/**
 * Datos fallback vacíos. El servidor es la fuente de verdad;
 * este array solo se usa si el servidor no está disponible en la carga inicial.
 */
export const bookmarksData: BookmarkItem[] = [];
