import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import "./BookmarkModal.css";

interface BookmarkModalProps {
  isOpen: boolean;
  isFolder: boolean;
  initialName: string;
  initialUrl?: string;
  initialTags?: string[];
  initialIcon?: string;
  onSave: (data: {
    name: string;
    url: string;
    tags: string[];
    icon?: string;
  }) => void;
  onCancel: () => void;
}

export function BookmarkModal({
  isOpen,
  isFolder,
  initialName,
  initialUrl = "",
  initialTags = [],
  initialIcon = "",
  onSave,
  onCancel,
}: BookmarkModalProps) {
  const [name, setName] = useState(initialName);
  const [url, setUrl] = useState(initialUrl);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [icon, setIcon] = useState(initialIcon);
  const [isLoadingFavicon, setIsLoadingFavicon] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousIsOpen = useRef(isOpen);

  useEffect(() => {
    // Solo reiniciar valores cuando el modal se abre (transición de false a true)
    if (isOpen && !previousIsOpen.current) {
      setName(initialName);
      setUrl(initialUrl);
      setTags(initialTags.join(", "));
      setIcon(initialIcon);
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
    previousIsOpen.current = isOpen;
  }, [isOpen, initialName, initialUrl, initialTags, initialIcon]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    const trimmedUrl = url.trim();
    const bookmarkData = {
      name: name.trim(),
      url: trimmedUrl,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      ...(icon.trim().length > 0 ? { icon } : {}),
    };

    onSave(bookmarkData);
  };

  const getFaviconAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `/api/favicon?url=${encodeURIComponent(url)}`,
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.icon || null;
    } catch (error) {
      console.warn("No se pudo obtener el favicon:", error);
      return null;
    }
  };

  const handleFetchFavicon = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return;
    }

    setIsLoadingFavicon(true);
    try {
      const faviconBase64 = await getFaviconAsBase64(trimmedUrl);
      if (faviconBase64) {
        setIcon(faviconBase64);
      }
    } catch (error) {
      console.error("Error al obtener favicon:", error);
    } finally {
      setIsLoadingFavicon(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Icon
              icon={
                isFolder ? "solar:folder-bold" : "solar:bookmark-bold-duotone"
              }
              width={24}
              height={24}
            />
            {isFolder ? "Carpeta" : "Bookmark"}
          </h2>
          <button className="modal-close" onClick={onCancel} type="button">
            <Icon icon="solar:close-circle-bold" width={24} height={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">
              <Icon icon="solar:text-bold" width={16} height={16} />
              Nombre
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder={
                isFolder ? "Nombre de carpeta" : "Nombre del bookmark"
              }
              required
            />
          </div>

          {!isFolder && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <Icon icon="solar:link-bold" width={16} height={16} />
                  URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="form-input"
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Icon icon="solar:gallery-bold" width={16} height={16} />
                  Favicon
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {icon && (
                    <img
                      src={icon}
                      alt="favicon"
                      style={{ width: 24, height: 24 }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleFetchFavicon}
                    disabled={!url.trim() || isLoadingFavicon}
                    className="btn-save"
                    style={{ padding: "4px 12px", fontSize: "12px" }}
                    title="Obtener favicon"
                  >
                    {isLoadingFavicon ? (
                      <Icon
                        icon="svg-spinners:90-ring-with-bg"
                        width={14}
                        height={14}
                      />
                    ) : (
                      <Icon icon="solar:download-bold" width={14} height={14} />
                    )}
                    {isLoadingFavicon ? "Obteniendo..." : "Obtener favicon"}
                  </button>
                  {icon && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIcon("");
                      }}
                      className="btn-cancel"
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      title="Eliminar favicon"
                    >
                      <Icon
                        icon="solar:trash-bin-minimalistic-bold"
                        width={14}
                        height={14}
                      />
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Icon icon="solar:tag-bold" width={16} height={16} />
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="form-input"
                  placeholder="desarrollo, react, javascript"
                />
                <span className="form-hint">Separa los tags con comas</span>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              <Icon icon="solar:check-circle-bold" width={18} height={18} />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
