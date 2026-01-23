export type BookmarkItem = {
  id: string;
  name: string;
  url?: string;
  addDate?: string;
  icon?: string;
  tags?: string[];
  children?: BookmarkItem[];
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
    children: [
      {
        id: "13",
        name: "Social",
        url: "http://example.com/social",
        addDate: "1414723524",
        icon: "",
      },
    ],
  },
];
