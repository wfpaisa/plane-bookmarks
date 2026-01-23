import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Iniciar servidor
async function startServer() {
  await ensureDataDirectory();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📁 Archivo de datos: ${DATA_FILE}`);
  });
}

startServer().catch(console.error);
