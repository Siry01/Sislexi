"use client";

import React, { useState } from "react";
import Link from "next/link";
 // 🚪 CERRAR SESIÓN (SIMPLE Y SEGURO)
  const handleLogout = () => {
    localStorage.removeItem("rol");
    localStorage.removeItem("user");
    router.push("/login");
  };
export default function Admin() {
  const [activeMenu, setActiveMenu] = useState("estadisticas");

  const solicitudes = [
    { id: "#S-2024-001", trabajador: "Ana Martínez", tipo: "Amparo Civil", puntaje: 0.94, prioridad: "alta" },
    { id: "#S-2024-005", trabajador: "Pedro Rivas", tipo: "Revisión Contrato", puntaje: 0.68, prioridad: "media" },
    { id: "#S-2024-009", trabajador: "Luisa Ortega", tipo: "Oficio Informativo", puntaje: 0.32, prioridad: "baja" },
  ];

  const renderTableRows = () =>
    solicitudes.map((sol) => (
      <tr key={sol.id}>
        <td>{sol.id}</td>
        <td>{sol.trabajador}</td>
        <td>{sol.tipo}</td>
        <td><strong>{sol.puntaje.toFixed(2)}</strong></td>
        <td>
          <span className={`badge-priority ${sol.prioridad === "alta" ? "p-alta" : sol.prioridad === "media" ? "p-media" : "p-baja"}`}>
            {sol.prioridad.toUpperCase()}
          </span>
        </td>
        <td>
          <button className="btn-assign">Asignar Abogado</button>
        </td>
      </tr>
    ));

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="Cantv Logo" className="logo" />
          <h2 className="title">Administrador</h2>
          <small>Panel de Control</small>
        </div>
        <nav className="nav-menu">
          <li className={`nav-item ${activeMenu === "estadisticas" ? "active" : ""}`} onClick={() => setActiveMenu("estadisticas")}>📊 Estadísticas</li>
          <li className={`nav-item ${activeMenu === "usuarios" ? "active" : ""}`} onClick={() => setActiveMenu("usuarios")}>👥 Gestión de Usuarios</li>
          <li className={`nav-item ${activeMenu === "criterios" ? "active" : ""}`} onClick={() => setActiveMenu("criterios")}>⚖️ Criterios y Pesos</li>
          <li className={`nav-item ${activeMenu === "solicitudes" ? "active" : ""}`} onClick={() => setActiveMenu("solicitudes")}>📂 Todas las Solicitudes</li>
          <li className={`nav-item ${activeMenu === "auditoria" ? "active" : ""}`} onClick={() => setActiveMenu("auditoria")}>🕵️ Auditoría</li>
        </nav>
       {/* 🔥 LOGOUT FUNCIONANDO */}
        <div className="logout">
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-view">
        <header className="header">
          <div className="header-left">
            <img src="/cantv-banner.png" alt="Cantv Banner" className="banner" />
            <h1>Resumen del Sistema</h1>
          </div>
          <div className="adminBox"><strong>Admin:</strong> Carlos Pérez</div>
        </header>

        {activeMenu === "estadisticas" && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Solicitudes Sin Asignar</h3>
                <div className="value">08</div>
              </div>
              <div className="stat-card">
                <h3>Abogados Disponibles</h3>
                <div className="value">04</div>
              </div>
              <div className="stat-card">
                <h3>Promedio Prioridad</h3>
                <div className="value">0.72</div>
              </div>
            </div>

            <div className="data-table-container">
              <div className="tableHeader">
                <h2>Solicitudes Pendientes (Filtro Inteligente)</h2>
                <button className="btn-assign" style={{ background: "#10b981" }}>Refrescar Prioridades</button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Trabajador</th>
                    <th>Tipo Documento</th>
                    <th>Puntaje (Σ)</th>
                    <th>Prioridad</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>{renderTableRows()}</tbody>
              </table>
            </div>
          </>
        )}

        {activeMenu === "usuarios" && <h2>Gestión de Usuarios</h2>}
        {activeMenu === "criterios" && <h2>Criterios y Pesos</h2>}
        {activeMenu === "solicitudes" && <h2>Todas las Solicitudes</h2>}
        {activeMenu === "auditoria" && <h2>Auditoría</h2>}
      </main>

      {/* CSS interno */}
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

