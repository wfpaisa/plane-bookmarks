import { MdSearch } from "react-icons/md";
import "./Sidebar.css";

interface SidebarProps {
  term: string;
  onTermChange: (term: string) => void;
  stats: {
    total: number;
    folders: number;
  };
}

export function Sidebar({ term, onTermChange, stats }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">Bookmarks</h1>
        <p className="app-subtitle">Manager Pro</p>
      </div>

      <div className="search-section">
        <div className="search-wrapper">
          <MdSearch className="search-icon" size={16} />
          <input
            type="text"
            value={term}
            onChange={(e) => onTermChange(e.currentTarget.value)}
            placeholder="Buscar bookmarks..."
            className="search-input"
          />
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Items</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-trend">
              +{Math.floor(stats.total * 0.12)} este mes
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Carpetas</div>
            <div className="stat-value">{stats.folders}</div>
            <div className="stat-trend">{stats.folders} activas</div>
          </div>
        </div>
      </div>

      <div className="help-section">
        <div className="help-title">Atajos rápidos</div>
        <div className="shortcut-list">
          <div className="shortcut-item">
            <span>Navegar</span>
            <span className="shortcut-key">↑↓</span>
          </div>
          <div className="shortcut-item">
            <span>Abrir/Cerrar</span>
            <span className="shortcut-key">Space</span>
          </div>
          <div className="shortcut-item">
            <span>Renombrar</span>
            <span className="shortcut-key">Enter</span>
          </div>
          <div className="shortcut-item">
            <span>Nuevo</span>
            <span className="shortcut-key">A</span>
          </div>
          <div className="shortcut-item">
            <span>Carpeta</span>
            <span className="shortcut-key">⇧A</span>
          </div>
          <div className="shortcut-item">
            <span>Eliminar</span>
            <span className="shortcut-key">Del</span>
          </div>
        </div>
      </div>
    </div>
  );
}
