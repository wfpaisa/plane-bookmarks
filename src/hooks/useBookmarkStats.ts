import { useMemo } from "react";
import type { BookmarkItem } from "../types/bookmark";

export function useBookmarkStats(data: BookmarkItem[]) {
  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const countItems = (
      items: BookmarkItem[],
    ): { total: number; folders: number; monthlyAdded: number } => {
      let total = 0;
      let folders = 0;
      let monthlyAdded = 0;

      items.forEach((item) => {
        total++;
        if (item.children) {
          folders++;
          const childStats = countItems(item.children);
          total += childStats.total;
          folders += childStats.folders;
          monthlyAdded += childStats.monthlyAdded;
        }

        if (item.addDate) {
          const itemDate = new Date(parseInt(item.addDate) * 1000);
          if (
            itemDate.getFullYear() === currentYear &&
            itemDate.getMonth() === currentMonth
          ) {
            monthlyAdded++;
          }
        }
      });

      return { total, folders, monthlyAdded };
    };

    return countItems(data);
  }, [data]);
}
