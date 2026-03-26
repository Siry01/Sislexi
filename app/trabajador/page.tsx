"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Panel() {
  const router = useRouter();
  const [userData, setUserData] = useState({ nombre: "Alexander Almaguer" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({ nombre: parsedUser.nombre || "Alexander Almaguer" });
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("rol");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="container">
      {/* HEADER CORREGIDO: LOGO GRANDE Y TEXTO AL LADO */}
      <header className="topbar">
        <div className="logo-section">
          <img
            src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png"
            className="logo-main"
            alt="CANTV"
          />
          <h2 className="brand-title">SISLEXI</h2>
        </div>

        <div className="user-nav">
          <button className="nav-item profile-btn" onClick={() => router.push("/trabajador/perfil")}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Mi Perfil</span>
          </button>
          <div className="divider"></div>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* CUERPO ADAPTADO A UNA SOLA PANTALLA */}
      <main className="main-layout">
        <section className="welcome-banner">
          <div className="welcome-text">
            <h1>¡Hola, {userData.nombre}! 👋</h1>
            <p>Sistema de Gestión de Asesorías Legales</p>
          </div>
          <button className="btn-new-request" onClick={() => router.push("/trabajador/solicitud")}>
            + Nueva Solicitud
          </button>
        </section>

        <section className="action-grid">
          <div className="action-card" onClick={() => router.push("/trabajador/chat")}>
            <div className="card-icon">🤖</div>
            <div className="card-content">
              <h3>Consultar a LEXI</h3>
              <p>Asistencia legal inteligente</p>
            </div>
          </div>

          <div className="action-card" onClick={() => router.push("/trabajador/chatabogado")}>
            <div className="card-icon">⚖️</div>
            <div className="card-content">
              <h3>Chat con Abogado</h3>
              <p>Comunicación directa</p>
            </div>
          </div>
        </section>

        <section className="recent-activity">
          <div className="section-header">
            <h3>📂 Mis Solicitudes</h3>
            <button className="view-all-link" onClick={() => router.push("/trabajador/solicitudes")}>
              Ver todas →
            </button>
          </div>
          <div className="activity-box">
            <p>No hay solicitudes recientes para mostrar.</p>
          </div>
        </section>
      </main>

      <style jsx>{`
        .container {
          height: 100vh;
          background-color: #f1f5f9;
          padding: 0 5%;
          display: flex;
          flex-direction: column;
          overflow: hidden; /* Bloquea el scroll para mantenerlo en una pantalla */
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* HEADER */
        .topbar {
          height: 90px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px; /* Espacio entre logo y texto */
        }

        .logo-main {
          height: 55px; /* Logo más grande */
          width: auto;
        }

        .brand-title {
          color: #1e3a8a;
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: 1px;
        }

        .user-nav {
          display: flex;
          background: white;
          padding: 5px 10px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #475569;
          transition: all 0.2s ease;
        }

        .profile-btn:hover { background: #f1f5f9; color: #1e3a8a; }
        .logout-btn:hover { background: #fee2e2; color: #ef4444; }
        .divider { width: 1px; background: #e2e8f0; margin: 8px 5px; }

        /* LAYOUT */
        .main-layout {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding-bottom: 20px;
        }

        /* BANNER */
        .welcome-banner {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          border-radius: 18px;
          padding: 30px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          box-shadow: 0 8px 15px rgba(30, 58, 138, 0.2);
        }

        .welcome-text h1 { font-size: 1.8rem; margin: 0; }
        .welcome-text p { opacity: 0.9; margin: 5px 0 0; }

        .btn-new-request {
          background: #38bdf8;
          color: #0f172a;
          border: none;
          padding: 14px 25px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-new-request:hover {
          background: #7dd3fc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(56, 189, 248, 0.4);
        }

        /* CARDS */
        .action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          height: 130px;
        }

        .action-card {
          background: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          padding: 0 25px;
          gap: 20px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }

        .action-card:hover {
          transform: translateY(-4px);
          border-color: #3b82f6;
          box-shadow: 0 10px 15px rgba(0,0,0,0.08);
          background: #f8fafc;
        }

        .card-icon { font-size: 2.2rem; }
        .card-content h3 { margin: 0; color: #1e3a8a; font-size: 1.1rem; }
        .card-content p { margin: 2px 0 0; color: #64748b; font-size: 0.85rem; }

        /* LISTA INFERIOR */
        .recent-activity {
          background: white;
          border-radius: 18px;
          padding: 20px 25px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .section-header h3 { font-size: 1.1rem; color: #1e3a8a; margin: 0; }
        
        .view-all-link {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 700;
          cursor: pointer;
          transition: color 0.2s;
        }

        .view-all-link:hover { color: #1d4ed8; text-decoration: underline; }

        .activity-box {
          flex-grow: 1;
          border: 2px dashed #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }

        /* AJUSTES RESPONSIVOS */
        @media (max-width: 900px) {
          .container { overflow-y: auto; height: auto; }
          .topbar { flex-direction: column; height: auto; padding: 20px 0; gap: 15px; }
          .action-grid { grid-template-columns: 1fr; height: auto; }
          .welcome-banner { flex-direction: column; text-align: center; gap: 20px; }
        }
      `}</style>
    </div>
  );
}