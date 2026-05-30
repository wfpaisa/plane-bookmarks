import { useRef } from "react";
import type { BookmarkItem } from "../../types/bookmark";
import { parseBookmarkHTML } from "../../utils/bookmarkParser";
import { bookmarkAPI } from "../../services/bookmarkAPI";
import { Icon } from "@iconify/react";

interface BookmarkImporterProps {
  onImport: (data: BookmarkItem[]) => void;
}

/**
 * Componente con botones para importar (HTML Chrome / JSON), exportar (JSON)
 * y eliminar todos los bookmarks. Usa inputs file ocultos activados por los chips.
 */
export function BookmarkImporter({ onImport }: BookmarkImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  /**
   * Importa bookmarks desde un archivo HTML exportado de Chrome.
   * Parsea la estructura DL/DT/A del HTML y la convierte al formato BookmarkItem.
   */
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

    if (event.target) {
      event.target.value = "";
    }
  };

  /**
   * Exporta los bookmarks actuales del servidor como archivo JSON descargable.
   * Obtiene los datos frescos del servidor para asegurar consistencia.
   */
  const handleExport = async () => {
    try {
      const response = await bookmarkAPI.getAll();
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", "bookmarks.json");
      linkElement.click();
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error al exportar los bookmarks");
    }
  };

  /**
   * Importa bookmarks desde un archivo JSON previamente exportado.
   * Valida que sea un array y lo persiste en el servidor antes de actualizar el estado local.
   */
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const importedData = JSON.parse(content);
        if (Array.isArray(importedData)) {
          await bookmarkAPI.saveAll(importedData);
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

    if (event.target) {
      event.target.value = "";
    }
  };

  /**
   * Elimina todos los bookmarks con doble confirmación (prompt "eliminar").
   * Limpia tanto el servidor como el estado local.
   */
  const handleDeleteAll = async () => {
    const confirmation = prompt(
      'Para confirmar la eliminación de todos los bookmarks, escribe "eliminar":',
    );
    if (confirmation !== "eliminar") {
      alert("Eliminación cancelada.");
      return;
    }

    try {
      await bookmarkAPI.clearAll();
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
        onClick={() => fileInputRef.current?.click()}
        title="Importar desde Google Chrome Bookmarks"
      >
        <Icon
          icon="solar:bookmark-square-minimalistic-outline"
          height={18}
          width={18}
        />
        <span>Google</span>
      </div>
      <div
        className="chip"
        onClick={handleExport}
        title="Exportar bookmarks a JSON"
      >
        <Icon icon="solar:upload-outline" height={18} width={18} />
        <span>DB</span>
      </div>
      <div
        className="chip"
        onClick={() => jsonInputRef.current?.click()}
        title="Importar bookmarks desde JSON"
      >
        <Icon icon="solar:download-outline" height={18} width={18} />
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
