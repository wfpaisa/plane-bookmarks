import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const PORT = 3001;
const DATA_FILE = path.join(__dirname, "data", "bookmarks.json");

// Middleware
app.use(cors());
// Aumentar el límite del tamaño del body a 50MB para archivos grandes de bookmarks
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/** Crea la carpeta data/ si no existe al iniciar el servidor. */
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

/** Lee el archivo JSON de bookmarks. Retorna [] si no existe. */
async function readBookmarks() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    // Si el archivo no existe, devolver un array vacío
    return [];
  }
}

/** Escribe bookmarks al archivo y notifica a todos los clientes via WebSocket. */
async function writeBookmarks(bookmarks: unknown) {
  await fs.writeFile(DATA_FILE, JSON.stringify(bookmarks, null, 2), "utf-8");
  // Emitir evento de actualización a todos los clientes conectados
  io.emit("bookmarks:updated", { data: bookmarks });
}

/** GET /api/bookmarks - Retorna el árbol completo de bookmarks. */
app.get("/api/bookmarks", async (req, res) => {
  try {
    const bookmarks = await readBookmarks();
    res.json({ data: bookmarks });
  } catch (error) {
    console.error("Error reading bookmarks:", error);
    res.status(500).json({ error: "Error al leer los bookmarks" });
  }
});

/** POST /api/bookmarks - Reemplaza todo el árbol de bookmarks. */
app.post("/api/bookmarks", async (req, res) => {
  try {
    const bookmarks = req.body;
    await writeBookmarks(bookmarks);
    res.json({ success: true, data: bookmarks });
  } catch (error) {
    console.error("Error saving bookmarks:", error);
    res.status(500).json({ error: "Error al guardar los bookmarks" });
  }
});

/** PUT /api/bookmarks - Sincroniza/actualiza el árbol de bookmarks. */
app.put("/api/bookmarks", async (req, res) => {
  try {
    const bookmarks = req.body;
    await writeBookmarks(bookmarks);
    res.json({ success: true, data: bookmarks });
  } catch (error) {
    console.error("Error updating bookmarks:", error);
    res.status(500).json({ error: "Error al actualizar los bookmarks" });
  }
});

/** DELETE /api/bookmarks - Elimina todos los bookmarks. */
app.delete("/api/bookmarks", async (req, res) => {
  try {
    await writeBookmarks([]);
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("Error clearing bookmarks:", error);
    res.status(500).json({ error: "Error al limpiar los bookmarks" });
  }
});

/**
 * GET /api/favicon - Obtiene el favicon de una URL como base64.
 * Usa el servicio de Google Favicons para dominios públicos,
 * o fetch directo para IPs locales/privadas.
 * Procesa la imagen con sharp a 32x32px PNG.
 */
app.get("/api/favicon", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL requerida" });
    }

    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Detectar si es una IP local/privada o localhost
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith(".local");

    let iconDataUrl: string | null = null;

    if (!isLocal) {
      // Usar servicio de Google para dominios públicos (confiable y rápido)
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;

      try {
        const response = await fetch(googleFavicon, {
          headers: { "User-Agent": "Mozilla/5.0" },
          redirect: "follow",
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          if (buffer.length > 0) {
            const processedBuffer = await sharp(buffer)
              .resize(32, 32, {
                fit: "contain",
                background: { r: 0, g: 0, b: 0, alpha: 0 },
              })
              .png({ quality: 80, compressionLevel: 9 })
              .toBuffer();

            const base64 = processedBuffer.toString("base64");
            iconDataUrl = `data:image/png;base64,${base64}`;
          }
        }
      } catch {
        console.log(`Google favicon no disponible para ${hostname}`);
      }
    }

    // Fallback: fetch directo del favicon desde el sitio
    if (!iconDataUrl) {
      const origin = urlObj.origin;
      const faviconUrls = [`${origin}/favicon.ico`, `${origin}/favicon.png`];

      // Intentar obtener la URL del favicon desde el HTML
      try {
        const pageResponse = await fetch(origin, {
          headers: { "User-Agent": "Mozilla/5.0" },
          redirect: "follow",
          signal: AbortSignal.timeout(5000),
        });

        if (pageResponse.ok) {
          const html = await pageResponse.text();
          const iconMatch =
            html.match(
              /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
            ) ||
            html.match(
              /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
            );

          if (iconMatch?.[1]) {
            let iconHref = iconMatch[1];
            // Resolver URLs relativas
            if (iconHref.startsWith("//")) {
              iconHref = `${urlObj.protocol}${iconHref}`;
            } else if (iconHref.startsWith("/")) {
              iconHref = `${origin}${iconHref}`;
            } else if (!iconHref.startsWith("http")) {
              iconHref = `${origin}/${iconHref}`;
            }
            // Poner al inicio de la lista de URLs a probar
            faviconUrls.unshift(iconHref);
          }
        }
      } catch {
        // No se pudo parsear el HTML, continuar con las rutas por defecto
      }

      for (const faviconUrl of faviconUrls) {
        try {
          const response = await fetch(faviconUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            redirect: "follow",
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            const contentType = response.headers.get("content-type") || "";
            if (
              contentType.includes("image") ||
              faviconUrl.endsWith(".ico") ||
              faviconUrl.endsWith(".png")
            ) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              if (buffer.length > 0) {
                const processedBuffer = await sharp(buffer)
                  .resize(32, 32, {
                    fit: "contain",
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                  })
                  .png({ quality: 80, compressionLevel: 9 })
                  .toBuffer();

                const base64 = processedBuffer.toString("base64");
                iconDataUrl = `data:image/png;base64,${base64}`;
                break;
              }
            }
          }
        } catch {
          // Intentar siguiente URL
        }
      }
    }

    return res.json({ success: true, icon: iconDataUrl });
  } catch (error) {
    console.error("Error fetching favicon:", error);
    res.json({ success: true, icon: null });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/** Gestiona conexiones WebSocket para sincronización en tiempo real entre clientes. */
io.on("connection", (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);

  // Manejar actualizaciones de bookmarks vía WebSocket
  socket.on("bookmarks:update", async (bookmarks) => {
    try {
      await fs.writeFile(
        DATA_FILE,
        JSON.stringify(bookmarks, null, 2),
        "utf-8",
      );

      // Emitir solo a los demás clientes (no al que envió el cambio)
      socket.broadcast.emit("bookmarks:updated", { data: bookmarks });

      // Confirmar al cliente que envió
      socket.emit("bookmarks:saved", { success: true });
    } catch (error) {
      console.error("Error al guardar bookmarks vía WebSocket:", error);
      socket.emit("bookmarks:error", { error: "Error al guardar" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// Iniciar servidor
async function startServer() {
  await ensureDataDirectory();
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`🔌 WebSocket habilitado`);
    console.log(`📁 Archivo de datos: ${DATA_FILE}`);
  });
}

startServer().catch(console.error);
