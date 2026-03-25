"use client";

import React from "react";
 // 🚪 CERRAR SESIÓN (SIMPLE Y SEGURO)
  const handleLogout = () => {
    localStorage.removeItem("rol");
    localStorage.removeItem("user");
    router.push("/login");
  };
export default function AbogadoPanel() {
  const casos = [
    {
      id: "#C-2024-001",
      solicitante: "Recursos Humanos",
      tipo: "Amparo Constitucional",
      puntaje: 0.96,
      prioridad: "alta",
    },
    {
      id: "#C-2024-005",
      solicitante: "Gerencia General",
      tipo: "Contrato de Arrendamiento",
      puntaje: 0.72,
      prioridad: "media",
    },
    {
      id: "#C-2024-009",
      solicitante: "Departamento Legal",
      tipo: "Oficio Informativo",
      puntaje: 0.32,
      prioridad: "baja",
    },
  ];

  const prioridadClass = (nivel) => {
    if (nivel === "alta") return "p-alta";
    if (nivel === "media") return "p-media";
    return "p-baja";
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="Logo Cantv" className="logo" />
          <h2 className="title">Abogado</h2>
          <small>Panel de Control</small>
        </div>
        <nav className="nav-menu">
          <li className="nav-item active">📋 Mis Casos</li>
          <li className="nav-item">📂 Archivos Recientes</li>
          <li className="nav-item">💬 Mensajes</li>
        </nav>
        {/* 🔥 LOGOUT FUNCIONANDO */}
        <div className="logout">
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-view">
        <div className="header">
          <h1>Bandeja de Casos Asignados</h1>
          <div className="adminBox">
            <strong>Abg. Ricardo Sosa</strong>
            <br />
            <small>Estatus: Disponible</small>
          </div>
        </div>

        <div className="data-table-container">
          <div className="tableHeader">
            <h2>Casos Priorizados</h2>
            <button className="btn-assign">Refrescar Prioridades</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Solicitante</th>
                <th>Tipo Documento</th>
                <th>Puntaje Σ</th>
                <th>Prioridad</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {casos.map((caso) => (
                <tr key={caso.id}>
                  <td>{caso.id}</td>
                  <td>{caso.solicitante}</td>
                  <td>{caso.tipo}</td>
                  <td><strong>{caso.puntaje.toFixed(2)}</strong></td>
                  <td>
                    <span className={`badge-priority ${prioridadClass(caso.prioridad)}`}>
                      {caso.prioridad.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button className="btn-assign">Asignar Abogado</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* CSS Interno */}
      <style jsx>{`
        .logo { width: 150px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; }
        .banner { width: 200px; margin-right: 20px; }
        .header-left { display: flex; align-items: center; }

        .admin-layout { display: flex; width: 100%; height: 100vh; background: #f1f5f9; }
        .sidebar { width: 280px; background: #0f172a; color: white; display: flex; flex-direction: column; padding: 20px 0; }
        .sidebar-header { padding: 0 25px 20px; border-bottom: 1px solid #1e293b; margin-bottom: 20px; text-align: center; }
        .title { color: #38bdf8; margin: 0; }
        .nav-menu { flex-grow: 1; list-style: none; padding: 0; margin: 0; }
        .nav-item { padding: 15px 25px; display: flex; align-items: center; cursor: pointer; transition: 0.3s; color: #94a3b8; }
        .nav-item:hover { background: #1e3a8a; color: white; }
        .active { background: #1e3a8a; color: white; }
        .logout { padding: 25px; }
        .btn-logout { background: transparent; color: #ef4444; border: 1px solid #ef4444; width: 100%; padding: 10px; border-radius: 5px; cursor: pointer; }

        .main-view { flex-grow: 1; overflow-y: auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .adminBox { background: white; padding: 10px 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 25px; margin-bottom: 40px; }
        .stat-card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .stat-card h3 { margin: 0; color: #64748b; font-size: 0.9rem; }
        .value { font-size: 1.8rem; font-weight: bold; color: #1e3a8a; margin-top: 10px; }

        .data-table-container { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .tableHeader { display: flex; justify-content: space-between; align-items: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; padding: 12px; border-bottom: 2px solid #f1f5f9; color: #64748b; }
        td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }

        .badge-priority { padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.75rem; }
        .p-alta { background: #fee2e2; color: #ef4444; }
        .p-media { background: #fef3c7; color: #d97706; }
        .p-baja { background: #dcfce7; color: #16a34a; }
        .btn-assign { background: #1e3a8a; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; }
      `}</style>
    </div>
  );
}