import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, "data", "bookmarks.json");

// Middleware
app.use(cors());
// Aumentar el límite del tamaño del body a 50MB para archivos grandes de bookmarks
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Asegurar que la carpeta data existe
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Leer bookmarks desde el archivo
async function readBookmarks() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe, devolver un array vacío
    return [];
  }
}

// Escribir bookmarks al archivo
async function writeBookmarks(bookmarks: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(bookmarks, null, 2), "utf-8");
}

// GET - Obtener todos los bookmarks
app.get("/api/bookmarks", async (req, res) => {
  try {
    const bookmarks = await readBookmarks();
    res.json(bookmarks);
  } catch (error) {
    console.error("Error reading bookmarks:", error);
    res.status(500).json({ error: "Error al leer los bookmarks" });
  }
});

// POST - Guardar todos los bookmarks (reemplaza todo)
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

// PUT - Actualizar bookmarks (sincronizar)
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

// DELETE - Limpiar todos los bookmarks
app.delete("/api/bookmarks", async (req, res) => {
  try {
    await writeBookmarks([]);
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("Error clearing bookmarks:", error);
    res.status(500).json({ error: "Error al limpiar los bookmarks" });
  }
});

// GET - Obtener favicon de una URL
app.get("/api/favicon", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL requerida" });
    }

    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    // Usar servicio de Google como fallback confiable
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;

    try {
      // Intentar el servicio de Google directamente (más confiable)
      const response = await fetch(googleFavicon, {
        headers: { "User-Agent": "Mozilla/5.0" },
        redirect: "follow",
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 0) {
          // Procesar con sharp
          const processedBuffer = await sharp(buffer)
            .resize(32, 32, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png({ quality: 80, compressionLevel: 9 })
            .toBuffer();

          const base64 = processedBuffer.toString("base64");
          const dataUrl = `data:image/png;base64,${base64}`;

          return res.json({ success: true, icon: dataUrl });
        }
      }
    } catch (err) {
      // Si Google falla, devolver un emoji por defecto
      console.log(`Favicon no disponible para ${urlObj.hostname}`);
    }

    // Devolver null si no se puede obtener el favicon
    return res.json({ success: true, icon: null });
  } catch (error) {
    console.error("Error fetching favicon:", error);
    // Devolver null en lugar de error para que la app siga funcionando
    res.json({ success: true, icon: null });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Iniciar servidor
async function startServer() {
  await ensureDataDirectory();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`📁 Archivo de datos: ${DATA_FILE}`);
  });
}

startServer().catch(console.error);
