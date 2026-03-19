"use client";

import React from "react";

export default function MiPanel() {
  const tramites = [
    {
      id: "#S-8821",
      titulo: "Amparo Laboral",
      fecha: "20/05/2024",
      estado: "process",
    },
    {
      id: "#S-8750",
      titulo: "Oficio de Mantenimiento",
      fecha: "15/05/2024",
      estado: "done",
    },
  ];

  const estadoClass = (estado) => {
    if (estado === "process") return "badge-process";
    if (estado === "done") return "badge-done";
    return "";
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="Logo Cantv" className="logo" />
          <h2 className="title">Mi Panel</h2>
          <small>Gestión Legal</small>
        </div>
        <nav className="nav-menu">
          <li className="nav-item active">🏠 Inicio</li>
          <li className="nav-item">📂 Mis Solicitudes</li>
          <li className="nav-item">💬 Consultar LEXI</li>
        </nav>
        <div className="logout">
          <button className="btn-logout">🚪 Cerrar Sesión</button>
        </div>
      </aside>

      {/* Main View */}
      <main className="main-view">
        <div className="header">
          <h1>¡Hola, Pedro! 👋</h1>
          <div className="adminBox">
            <span>P00-8821 | <strong>Pedro Martínez</strong></span>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="data-table-container" style={{ marginBottom: "30px", background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "30px", borderRadius: "20px" }}>
          <div>
            <h2 style={{ margin: 0 }}>¿Qué gestión legal necesitas realizar hoy?</h2>
          </div>
          <button className="btn-assign" style={{ background: "#38bdf8", color: "#1e3a8a", fontWeight: "bold", padding: "12px 25px", borderRadius: "10px" }}>+ Nueva Solicitud</button>
        </div>

        {/* Action Cards */}
        <div className="stats-grid" style={{ marginBottom: "40px" }}>
          <div className="stat-card" onClick={() => alert("Abriendo Chat con LEXI...")} style={{ cursor: "pointer" }}>
            <span style={{ fontSize: "40px" }}>🤖</span>
            <h3>Consultar a LEXI</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Pregunta por el estatus de tus trámites actuales.</p>
          </div>
          <div className="stat-card" onClick={() => alert("Redirigiendo a nueva solicitud")} style={{ cursor: "pointer" }}>
            <span style={{ fontSize: "40px" }}>📂</span>
            <h3>Registrar Documento</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Sube un nuevo requerimiento para revisión legal.</p>
          </div>
        </div>

        {/* Status Section */}
        <div className="data-table-container">
          <h2>Mis Trámites Recientes</h2>
          {tramites.map((t) => (
            <div className="status-item" key={t.id}>
              <div>
                <strong>{t.id} | {t.titulo}</strong><br />
                <small style={{ color: "#64748b" }}>{t.estado === "process" ? "Enviado: " : "Finalizado: "} {t.fecha}</small>
              </div>
              <span className={`badge ${estadoClass(t.estado)}`}>
                {t.estado === "process" ? "EN REVISIÓN" : "CONCLUIDO"}
              </span>
            </div>
          ))}
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

        .data-table-container { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 40px; }
        .status-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #f1f5f9; }
        .badge { padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
        .badge-process { background: #e0f2fe; color: #0369a1; }
        .badge-done { background: #dcfce7; color: #16a34a; }
        .btn-assign { background: #1e3a8a; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; }
      `}</style>
    </div>
  );
}