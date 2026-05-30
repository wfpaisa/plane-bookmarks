/**
 * Estructura de datos de un bookmark o carpeta.
 * Las carpetas se distinguen por tener el campo `children`.
 * Los bookmarks hoja tienen `url` y opcionalmente `icon` y `tags`.
 */
export type BookmarkItem = {
  id: string;
  name: string;
  url?: string;
  addDate?: string;
  icon?: string;
  tags?: string[];
  children?: BookmarkItem[];
  isOpen?: boolean;
};
