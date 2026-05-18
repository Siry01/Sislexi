"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PanelAbogadoFinal() {
  const router = useRouter();
  const [userData, setUserData] = useState({ nombre: "Siry Pacheco" });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserData({ nombre: user.nombre || "Especialista" });
      } catch (e) { console.error(e); }
    }
  }, []);

  return (
    <div className="main-wrapper">
      {/* NAVBAR: Botones simétricos y marca alineada a la izquierda */}
      <header className="navbar-sislexi">
        <div className="brand">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" />
          <span className="brand-name">SISLEXI ABOGADO</span>
        </div>
        
        <div className="user-controls-capsule">
          <button className="nav-item-btn" onClick={() => router.push("/abogado/perfil")}>
            <span className="icon">👨‍⚖️</span> Modo Especialista
          </button>
          <div className="vertical-line"></div>
          <button className="nav-item-btn" onClick={() => router.push("/login")}>
            <span className="icon orange">🚪</span> Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="content-dashboard">
        {/* BANNER DE BIENVENIDA AZUL: Pantalla completa como en SISLEXI ADMIN */}
        <section className="welcome-banner-blue">
          <div className="welcome-text-content">
            <h1>Bienvenido, Dr. {userData.nombre} 👋</h1>
            <p>Gestión de casos, revisión documental y métricas de asesoría legal.</p>
          </div>
        </section>

        {/* GRILLA DE 5 MÓDULOS: Integración limpia de Agenda */}
        <section className="modules-horizontal-grid">
          <div className="module-item-card" onClick={() => router.push("/abogado/solicitudes")}>
            <div className="module-icon-box">📂</div>
            <div className="module-info-text">
              <h3>Solicitudes</h3>
              <p>Revisión y priorización</p>
            </div>
          </div>

          <div className="module-item-card" onClick={() => router.push("/abogado/documentos")}>
            <div className="module-icon-box">📄</div>
            <div className="module-info-text">
              <h3>Documentos</h3>
              <p>Gestión de archivos</p>
            </div>
          </div>

          <div className="module-item-card" onClick={() => router.push("/abogado/chat")}>
            <div className="module-icon-box">💬</div>
            <div className="module-info-text">
              <h3>Mensajería</h3>
              <p>Chat con trabajadores</p>
            </div>
          </div>

          <div className="module-item-card" onClick={() => router.push("/abogado/reportes")}>
            <div className="module-icon-box">📊</div>
            <div className="module-info-text">
              <h3>Reportes</h3>
              <p>Eficiencia y auditoría</p>
            </div>
          </div>

          {/* Módulo de Agenda mejorado visualmente */}
          <div className="module-item-card agenda-special" onClick={() => window.open("https://calendar.google.com")}>
            <div className="module-icon-box">📅</div>
            <div className="module-info-text">
              <h3>Agenda</h3>
              <p>Google Calendar</p>
            </div>
          </div>
        </section>

        {/* PIE DE PÁGINA DISCRETO PARA EVENTOS PRÓXIMOS */}
        <footer className="dashboard-footer">
          <div className="agenda-summary">
            <span className="status-dot"></span>
            <p><strong>Próximo evento:</strong> Entrega de Amparo #882 - 10:00 AM</p>
          </div>
        </footer>
      </main>

      <style jsx>{`
        .main-wrapper {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f4f7f9; /* Gris sólido SISLEXI */
          overflow: hidden;
        }

        .navbar-sislexi {
          background: white;
          padding: 12px 5%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .brand { display: flex; align-items: center; gap: 15px; }
        .brand img { height: 42px; }
        .brand-name { color: #002d72; font-weight: 800; font-size: 1.6rem; }

        .user-controls-capsule {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .nav-item-btn {
          border: none; background: transparent; color: #002d72; font-weight: 700;
          height: 48px; min-width: 170px; cursor: pointer; display: flex;
          align-items: center; justify-content: center; gap: 10px;
        }
        .nav-item-btn:hover { background: #f8fafc; }
        .vertical-line { width: 1px; height: 25px; background: #e2e8f0; }
        .orange { color: #d97706; }

        .content-dashboard {
          flex: 1;
          padding: 30px 5%;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .welcome-banner-blue {
          background: #1e3a8a; 
          color: white;
          padding: 45px 50px;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(30, 58, 138, 0.1);
        }
        .welcome-text-content h1 { font-size: 2.2rem; margin: 0; font-weight: 400; }
        .welcome-text-content p { font-size: 1.1rem; opacity: 0.9; margin-top: 10px; }

        /* Grilla horizontal de 5 columnas para mantener el diseño */
        .modules-horizontal-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
        }

        .module-item-card {
          background: white;
          padding: 25px 15px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s;
          box-shadow: 0 4px 10px rgba(0,0,0,0.03);
        }
        .module-item-card:hover { transform: translateY(-5px); box-shadow: 0 8px 15px rgba(0,0,0,0.06); }
        .module-icon-box { font-size: 2rem; }
        .module-info-text h3 { color: #002d72; margin: 0; font-size: 1rem; }
        .module-info-text p { color: #64748b; font-size: 0.75rem; margin-top: 4px; }

        /* Estilo especial para el módulo de agenda */
        .agenda-special { border: 1px solid #dcfce7; }
        .agenda-special:hover { background: #f0fdf4; border-color: #16a34a; }

        .dashboard-footer {
          margin-top: auto;
          background: white;
          padding: 15px 30px;
          border-radius: 15px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .agenda-summary { display: flex; align-items: center; gap: 12px; }
        .status-dot { width: 10px; height: 10px; background: #ef4444; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        .agenda-summary p { margin: 0; font-size: 0.9rem; color: #475569; }

        @media (max-width: 1200px) {
          .modules-horizontal-grid { grid-template-columns: repeat(3, 1fr); }
          .main-wrapper { overflow-y: auto; height: auto; }
        }
      `}</style>
    </div>
  );
}