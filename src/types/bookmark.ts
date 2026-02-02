export type BookmarkItem = {
  id: string;
  name: string;
  url?: string;
  addDate?: string;
  icon?: string;
  tags?: string[];
  children?: BookmarkItem[];
  isOpen?: boolean; // Estado abierto/cerrado de la carpeta
};
