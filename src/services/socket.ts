import { io, Socket } from "socket.io-client";
import type { BookmarkItem } from "../types/bookmark";

/**
 * Determina la URL del servidor WebSocket según el entorno.
 * En localhost usa puerto 3001 directo; en otros dominios
 * asume un reverse proxy en el mismo origen.
 */
const getSocketUrl = () => {
  // Si está configurado en variables de entorno, usar ese valor
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // En el navegador, usar el mismo origen que la página actual
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;

    // En desarrollo local (localhost o 127.0.0.1)
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      // Usar el puerto del servidor backend (3001)
      return "http://localhost:3001";
    }

    // En cualquier otro dominio (incluyendo dominios custom como local-book.XXX.com)
    // usar el mismo origen sin especificar puerto
    // Esto asume que tienes un reverse proxy (como Nginx) que maneja el routing
    const socketProtocol = protocol === "https:" ? "https:" : "http:";
    const socketUrl = port
      ? `${socketProtocol}//${hostname}:${port}`
      : `${socketProtocol}//${hostname}`;

    console.log(`🔌 Conectando WebSocket a: ${socketUrl}`);
    return socketUrl;
  }

  // Fallback para SSR (no debería usarse en este caso)
  return "http://localhost:3001";
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

/**
 * Servicio singleton de WebSocket para sincronización en tiempo real.
 * Gestiona la conexión Socket.io, envío/recepción de actualizaciones
 * de bookmarks y reconexión automática.
 */
export const socketService = {
  connect(): Socket {
    if (!socket) {
      console.log(`🔌 Iniciando conexión WebSocket a: ${SOCKET_URL}`);

      socket = io(SOCKET_URL, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 10000,
      });

      socket.on("connect", () => {
        console.log("✅ WebSocket conectado exitosamente");
        console.log(`   Transport: ${socket?.io.engine.transport.name}`);
      });

      socket.on("disconnect", (reason) => {
        console.log(`🔌 WebSocket desconectado. Razón: ${reason}`);
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Error de conexión WebSocket:", error.message);
        console.log("💡 Verificar que el servidor esté corriendo y accesible");
      });

      socket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`🔄 Intento de reconexión #${attemptNumber}`);
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log(`✅ Reconectado después de ${attemptNumber} intentos`);
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

  onBookmarksUpdated(callback: (data: { data: BookmarkItem[] }) => void) {
    if (socket) {
      socket.on("bookmarks:updated", callback);
    }
  },

  offBookmarksUpdated(callback?: (data: { data: BookmarkItem[] }) => void) {
    if (socket) {
      if (callback) {
        socket.off("bookmarks:updated", callback);
      } else {
        socket.off("bookmarks:updated");
      }
    }
  },

  updateBookmarks(bookmarks: BookmarkItem[]): Promise<{ success: boolean }> {
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

      const handleError = (error: { error: string }) => {
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
