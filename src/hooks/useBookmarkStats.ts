import { useMemo } from "react";
import { type BookmarkItem } from "../data/bookmarks";

export function useBookmarkStats(data: BookmarkItem[]) {
  return useMemo(() => {
    const countItems = (
      items: BookmarkItem[],
    ): { total: number; folders: number } => {
      let total = 0;
      let folders = 0;

      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          folders++;
          const childStats = countItems(item.children);
          total += childStats.total;
          folders += childStats.folders;
        } else {
          total++;
        }
      });

      return { total, folders };
    };

    return countItems(data);
  }, [data]);
}
