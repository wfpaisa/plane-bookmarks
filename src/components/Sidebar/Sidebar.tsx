import "./Sidebar.css";

interface SidebarProps {
  stats: {
    total: number;
    folders: number;
    monthlyAdded: number;
  };
  tags: string[];
  sidebarOpen?: boolean;
}

export function Sidebar({ stats, tags, sidebarOpen }: SidebarProps) {
  return (
    <div className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Items</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-trend">+{stats.monthlyAdded} este mes</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Carpetas</div>
            <div className="stat-value">{stats.folders}</div>
            <div className="stat-trend">{stats.folders} activas</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Tags</div>
            <div className="tags-list">
              {tags.map((tag) => (
                <div key={tag} className="tag-item">
                  {tag}
                </div>
              ))}
            </div>
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
