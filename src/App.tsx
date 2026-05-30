import "./App.css";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { useBookmarkStats } from "./hooks/useBookmarkStats";
import { useBookmarks } from "./hooks/useBookmarks";

/**
 * Componente raíz de la aplicación. Solo gestiona layout y estado de UI local
 * (término de búsqueda, sidebar). Toda la lógica de datos de bookmarks
 * se delega al hook useBookmarks.
 */
function App() {
  const [term, setTerm] = useState("");
  const [tagSearchEnabled, setTagSearchEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    data,
    isLoading,
    serverConnected,
    allTags,
    handleDataImport,
    handleMove,
    handleCreate,
    handleRename,
    handleUpdate,
    handleDelete,
    handleToggle,
  } = useBookmarks();

  const stats = useBookmarkStats(data);

  /** Agrega un tag al término de búsqueda y activa el modo de búsqueda por tags. */
  const handleTagClick = (tag: string) => {
    setTerm(term.trim() === "" ? tag : term + "," + tag);
    setTagSearchEnabled(true);
  };

  if (isLoading) {
    return (
      <div
        className="app-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
        }}
      >
        Cargando bookmarks...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        stats={stats}
        tags={allTags}
        sidebarOpen={sidebarOpen}
        onTagClick={handleTagClick}
      />
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <MainContent
        data={data}
        searchTerm={term}
        onTermChange={setTerm}
        onDataImport={handleDataImport}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onCreate={handleCreate}
        onMove={handleMove}
        onRename={handleRename}
        onDelete={handleDelete}
        onToggle={handleToggle}
        onUpdate={handleUpdate}
        tagSearchEnabled={tagSearchEnabled}
      />
      {!serverConnected && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#ff9800",
            color: "white",
            padding: "10px 15px",
            borderRadius: "5px",
            fontSize: "0.9rem",
          }}
        >
          ⚠️ Modo sin conexión - Los cambios no se guardarán
        </div>
      )}
    </div>
  );
}

export default App;
