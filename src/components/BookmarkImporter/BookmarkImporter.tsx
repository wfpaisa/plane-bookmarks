import { useRef } from "react";
import { type BookmarkItem } from "../../data/bookmarks";
import { parseBookmarkHTML } from "../../utils/bookmarkParser";
import { Icon } from "@iconify/react";

interface BookmarkImporterProps {
  onImport: (data: BookmarkItem[]) => void;
}

export function BookmarkImporter({ onImport }: BookmarkImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".html"
        onChange={handleFileImport}
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
        <span>Importar</span>
      </div>
    </>
  );
}
