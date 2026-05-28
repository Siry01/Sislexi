"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registrarAuditoriaReal } from "../lib/auditoria"; // Asegura que la ruta sea correcta

export default function Panel() {
  const router = useRouter();
  const [userData, setUserData] = useState({ nombre: "Trabajador" });
  const [tieneNotificaciones, setTieneNotificaciones] = useState(true); // Estado temporal para pruebas visuales

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const nombre = parsedUser.nombre || "Trabajador";
        setUserData({ nombre: nombre });

        // AUDITORÍA AUTOMÁTICA: Registro de entrada al panel
        registrarAuditoriaReal(
          "Acceso al Panel", 
          "SISTEMA", 
          "success", 
          "El trabajador visualizó el panel principal", 
          nombre, 
          "TRABAJADOR"
        );
      } catch (e) {
        console.error("Error al procesar datos del usuario:", e);
      }
    }
  }, []);

  const handleLogout = async () => {
    // AUDITORÍA: Cierre de sesión real
    await registrarAuditoriaReal(
      "Cierre de Sesión", 
      "SISTEMA", 
      "success", 
      "El usuario finalizó su sesión manualmente", 
      userData.nombre, 
      "TRABAJADOR"
    );

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
          {/* BANDEJA DE NOTIFICACIONES (CAMPANITA) */}
          <button className="nav-item notification-btn" onClick={() => router.push("/trabajador/notificaciones")}>
            <div className="bell-wrapper">
              <span className="nav-icon">🔔</span>
              {tieneNotificaciones && <span className="notification-badge"></span>}
            </div>
            <span className="nav-text">Notificaciones</span>
          </button>
          
          <div className="divider"></div>

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
        </section>

        {/* CUADRÍCULA DE MÓDULOS PRINCIPALES (AHORA CON 3 COLUMNAS) */}
        <section className="action-grid">
          <div className="action-card" onClick={() => router.push("/trabajador/solicitudes")}>
            <div className="card-icon">📂</div>
            <div className="card-content">
              <h3>Mis Solicitudes</h3>
              <p>Historial, estatus y creación de requerimientos</p>
            </div>
          </div>

          <div className="action-card" onClick={() => router.push("/trabajador/citas")}>
            <div className="card-icon">📅</div>
            <div className="card-content">
              <h3>Mis Citas Legales</h3>
              <p>Control de fechas, horarios y reuniones asignadas</p>
            </div>
          </div>

          <div className="action-card" onClick={() => router.push("/trabajador/chatabogado")}>
            <div className="card-icon">⚖️</div>
            <div className="card-content">
              <h3>Mensajería</h3>
              <p>Comunicación directa con tu abogado asignado</p>
            </div>
          </div>
        </section>

        {/* MONITOR DE TRÁMITES RÁPIDOS */}
        <section className="recent-activity">
          <div className="section-header">
            <h3>📊 Resumen de Actividad</h3>
          </div>
          <div className="activity-box">
            <p>Monitoreo de trámites legales activo de manera eficiente.</p>
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
          overflow: hidden;
          font-family: 'Segoe UI', Tahoma, sans-serif;
        }

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
          gap: 15px;
        }

        .logo-main {
          height: 55px;
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

        .bell-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          border: 1px solid white;
        }

        .notification-btn:hover { background: #f1f5f9; color: #2563eb; }
        .profile-btn:hover { background: #f1f5f9; color: #1e3a8a; }
        .logout-btn:hover { background: #fee2e2; color: #ef4444; }
        .divider { width: 1px; background: #e2e8f0; margin: 8px 5px; }

        .main-layout {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding-bottom: 20px;
        }

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

        .action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr; /* Cambiado a 3 columnas */
          gap: 20px;
          height: 130px;
        }

        .action-card {
          background: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 15px;
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

        .activity-box {
          flex-grow: 1;
          border: 2px dashed #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }

        @media (max-width: 1024px) {
          .action-grid { grid-template-columns: 1fr; height: auto; }
          .container { overflow-y: auto; height: auto; }
          .topbar { flex-direction: column; height: auto; padding: 20px 0; gap: 15px; }
        }
      `}</style>
    </div>
  );
}