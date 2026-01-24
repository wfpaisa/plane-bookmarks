import { useRef } from "react";
import { type BookmarkItem } from "../../data/bookmarks";
import { parseBookmarkHTML } from "../../utils/bookmarkParser";
import { Icon } from "@iconify/react";

interface BookmarkImporterProps {
  onImport: (data: BookmarkItem[]) => void;
}

export function BookmarkImporter({ onImport }: BookmarkImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const importedData = parseBookmarkHTML(content);
        if (importedData.length > 0) {
          onImport(importedData);
        } else {
          alert("No se encontraron bookmarks en el archivo");
        }
      } catch (error) {
        console.error("Error al parsear el archivo:", error);
        alert(
          "Error al importar el archivo. Verifica que sea un archivo HTML válido de Chrome.",
        );
      }
    };
    reader.readAsText(file);

    // Resetear el input para permitir importar el mismo archivo de nuevo
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/bookmarks");
      if (!response.ok) throw new Error("Error al obtener bookmarks");
      const bookmarks = await response.json();
      const dataStr = JSON.stringify(bookmarks, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = "bookmarks.json";

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error al exportar los bookmarks");
    }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const importedData = JSON.parse(content);
        if (Array.isArray(importedData)) {
          const response = await fetch("/api/bookmarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(importedData),
          });
          if (!response.ok) throw new Error("Error al guardar bookmarks");
          onImport(importedData);
          alert("Bookmarks importados exitosamente");
        } else {
          alert("El archivo JSON no contiene un array válido de bookmarks");
        }
      } catch (error) {
        console.error("Error al importar JSON:", error);
        alert("Error al importar el archivo JSON. Verifica que sea válido.");
      }
    };
    reader.readAsText(file);

    // Resetear el input
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleImportJSONClick = () => {
    jsonInputRef.current?.click();
  };

  const handleDeleteAll = async () => {
    const confirmation = prompt(
      'Para confirmar la eliminación de todos los bookmarks, escribe "eliminar":',
    );
    if (confirmation !== "eliminar") {
      alert("Eliminación cancelada.");
      return;
    }

    try {
      const response = await fetch("/api/bookmarks", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar bookmarks");
      onImport([]);
      alert("Todos los bookmarks han sido eliminados.");
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar los bookmarks.");
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".html"
        onChange={handleFileImport}
        style={{ display: "none" }}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJSON}
        style={{ display: "none" }}
      />
      <div
        className="chip"
        onClick={handleImportClick}
        title="Importar desde Google Chrome Bookmarks"
      >
        <Icon
          icon="solar:bookmark-square-minimalistic-outline"
          height={18}
          width={18}
        />
        <span>Importar Google</span>
      </div>
      <div
        className="chip"
        onClick={handleExport}
        title="Exportar bookmarks a JSON"
      >
        <Icon icon="solar:download-outline" height={18} width={18} />
        <span>DB</span>
      </div>
      <div
        className="chip"
        onClick={handleImportJSONClick}
        title="Importar bookmarks desde JSON"
      >
        <Icon icon="solar:upload-outline" height={18} width={18} />
        <span>DB</span>
      </div>
      <div
        className="chip"
        onClick={handleDeleteAll}
        title="Eliminar todos los bookmarks"
      >
        <Icon
          icon="solar:trash-bin-minimalistic-outline"
          height={18}
          width={18}
        />
        <span>Eliminar</span>
      </div>
    </>
  );
}
