import type { BookmarkItem } from "../types/bookmark";

/**
 * URL base de la API REST. Usa el proxy de Vite en desarrollo
 * o la variable VITE_API_URL configurada en producción.
 */
const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Cliente REST para operaciones CRUD de bookmarks.
 * Centraliza todas las llamadas HTTP al servidor para evitar
 * URLs y lógica de fetch duplicadas en los componentes.
 */
export const bookmarkAPI = {
  /** Obtiene el árbol completo de bookmarks desde el servidor. */
  async getAll(): Promise<{ data: BookmarkItem[] }> {
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

  /** Guarda un árbol completo de bookmarks (reemplaza los existentes). */
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

  /** Actualiza los bookmarks en el servidor (sincronización incremental). */
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

  /** Elimina todos los bookmarks del servidor. */
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

  /** Verifica si el servidor está disponible. Retorna false si no responde. */
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
