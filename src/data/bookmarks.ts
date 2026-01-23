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

export const bookmarksData: BookmarkItem[] = [
  {
    id: "1",
    name: "Inbox",
    tags: ["uno", "dos"],
    url: "https://jpepito.com",
    icon: "",
  },
  {
    id: "12",
    name: "Categories",
    icon: "",
    isOpen: true, // Esta carpeta estará abierta por defecto
    children: [
      {
        id: "13",
        name: "Social",
        url: "http://example.com/social",
        addDate: "1414723524",
        icon: "",
      },
      {
        id: "14",
        name: "Work",
        isOpen: false, // Esta subcarpeta estará cerrada
        children: [
          {
            id: "15",
            name: "Project A",
            url: "https://project-a.com",
          },
          {
            id: "16",
            name: "Project B",
            url: "https://project-b.com",
          },
        ],
      },
    ],
  },
  {
    id: "17",
    name: "Favorites",
    isOpen: true, // Esta carpeta estará abierta por defecto
    children: [
      {
        id: "18",
        name: "Google",
        url: "https://google.com",
      },
      {
        id: "19",
        name: "GitHub",
        url: "https://github.com",
      },
    ],
  },
];
