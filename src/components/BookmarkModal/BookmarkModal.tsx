import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./BookmarkModal.css";

interface BookmarkModalProps {
  isOpen: boolean;
  isFolder: boolean;
  initialName: string;
  initialUrl?: string;
  initialTags?: string[];
  onSave: (data: { name: string; url: string; tags: string[] }) => void;
  onCancel: () => void;
}

export function BookmarkModal({
  isOpen,
  isFolder,
  initialName,
  initialUrl = "",
  initialTags = [],
  onSave,
  onCancel,
}: BookmarkModalProps) {
  const [name, setName] = useState(initialName);
  const [url, setUrl] = useState(initialUrl);
  const [tags, setTags] = useState(initialTags.join(", "));
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setUrl(initialUrl);
      setTags(initialTags.join(", "));
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialName, initialUrl, initialTags]);

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
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    onSave({
      name: name.trim(),
      url: url.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    });
  };

  if (!isOpen) return null;

  return (
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
}
