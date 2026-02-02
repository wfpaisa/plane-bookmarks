import type { BookmarkItem } from "../types/bookmark";

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
        tags: ["social", "network"],
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
            tags: ["work", "project"],
          },
          {
            id: "16",
            name: "Project B",
            url: "https://project-b.com",
            tags: ["work", "development"],
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
