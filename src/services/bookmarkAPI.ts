import type { BookmarkItem } from "../data/bookmarks";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const bookmarkAPI = {
  // Obtener todos los bookmarks
  async getAll(): Promise<BookmarkItem[]> {
    try {
      const response = await fetch(`${API_URL}/bookmarks`);
      if (!response.ok) {
        throw new Error("Error al obtener los bookmarks");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      throw error;
    }
  },

  // Guardar todos los bookmarks
  async saveAll(bookmarks: BookmarkItem[]): Promise<BookmarkItem[]> {
    try {
      const response = await fetch(`${API_URL}/bookmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookmarks),
      });
      if (!response.ok) {
        throw new Error("Error al guardar los bookmarks");
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error saving bookmarks:", error);
      throw error;
    }
  },

  // Actualizar todos los bookmarks (sincronizar)
  async updateAll(bookmarks: BookmarkItem[]): Promise<BookmarkItem[]> {
    try {
      const response = await fetch(`${API_URL}/bookmarks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookmarks),
      });
      if (!response.ok) {
        throw new Error("Error al actualizar los bookmarks");
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error updating bookmarks:", error);
      throw error;
    }
  },

  // Limpiar todos los bookmarks
  async clearAll(): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/bookmarks`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Error al limpiar los bookmarks");
      }
    } catch (error) {
      console.error("Error clearing bookmarks:", error);
      throw error;
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  },
};
