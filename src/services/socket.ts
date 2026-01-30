import { io, Socket } from "socket.io-client";

// En producción, usa el mismo origen que la página actual
// En desarrollo, usa localhost:3001
const getSocketUrl = () => {
  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }

  const { protocol, hostname } = window.location;

  // En desarrollo local
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Solo usa la variable de entorno en desarrollo
    if (import.meta.env.VITE_SOCKET_URL && import.meta.env.DEV) {
      return import.meta.env.VITE_SOCKET_URL;
    }
    return "http://localhost:3001";
  }

  // En producción, usa el mismo origen (sin especificar puerto)
  // Nginx Proxy Manager manejará el proxy al puerto 3001
  const socketUrl = `${protocol}//${hostname}`;
  console.log(`🔌 Conectando WebSocket a: ${socketUrl}`);
  return socketUrl;
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const socketService = {
  connect(): Socket {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });

      socket.on("connect", () => {
        console.log("🔌 WebSocket conectado");
      });

      socket.on("disconnect", () => {
        console.log("🔌 WebSocket desconectado");
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Error de conexión WebSocket:", error);
      });
    }
    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  onBookmarksUpdated(callback: (data: any) => void) {
    if (socket) {
      socket.on("bookmarks:updated", callback);
    }
  },

  offBookmarksUpdated(callback?: (data: any) => void) {
    if (socket) {
      if (callback) {
        socket.off("bookmarks:updated", callback);
      } else {
        socket.off("bookmarks:updated");
      }
    }
  },

  updateBookmarks(bookmarks: any): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error("Socket no conectado"));
        return;
      }

      // Enviar actualización
      socket.emit("bookmarks:update", bookmarks);

      // Esperar confirmación
      const handleSaved = (response: { success: boolean }) => {
        socket?.off("bookmarks:saved", handleSaved);
        socket?.off("bookmarks:error", handleError);
        resolve(response);
      };

      const handleError = (error: any) => {
        socket?.off("bookmarks:saved", handleSaved);
        socket?.off("bookmarks:error", handleError);
        reject(error);
      };

      socket.once("bookmarks:saved", handleSaved);
      socket.once("bookmarks:error", handleError);

      // Timeout de 5 segundos
      setTimeout(() => {
        socket?.off("bookmarks:saved", handleSaved);
        socket?.off("bookmarks:error", handleError);
        reject(new Error("Timeout al guardar bookmarks"));
      }, 5000);
    });
  },
};
