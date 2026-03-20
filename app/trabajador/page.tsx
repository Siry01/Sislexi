"use client";

import { useRouter } from "next/navigation";

export default function Panel() {
  const router = useRouter();

  return (
    <div className="container">

      {/* HEADER SUPERIOR */}
      <header className="topbar">

        <div className="logo-section">
          <img
            src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png"
            className="logo"
          />
          <h2>SISLEXI</h2>
        </div>

        <button className="logout">
          🚪 Cerrar sesión
        </button>

      </header>

      {/* BIENVENIDA */}
      <div className="welcome-box">

        <div>
          <h1>¡Hola! 👋</h1>
          <p>¿Qué gestión legal necesitas realizar hoy?</p>
        </div>

        <button
          className="btn-main"
          onClick={() => router.push("/trabajador/solicitud")}
        >
          + Nueva Solicitud
        </button>

      </div>

      {/* ACCIONES */}
      <div className="grid">

        <div
          className="card"
          onClick={() => router.push("/chat")}
        >
          🤖
          <h3>Consultar a LEXI</h3>
          <p>Asistencia legal inteligente</p>
        </div>

        <div
          className="card"
          onClick={() => router.push("/trabajador/solicitud")}
        >
          📄
          <h3>Registrar Documento</h3>
          <p>Crear nueva solicitud legal</p>
        </div>

      </div>

      {/* 🔥 MIS SOLICITUDES (REEMPLAZA RECIENTES) */}
      <div className="mis-solicitudes">

        <div className="box-header">
          <h2>📂 Mis Solicitudes</h2>

          <button
            className="ver-btn"
            onClick={() => router.push("/trabajador/solicitudes")}
          >
            Ver todas →
          </button>
        </div>

        <div className="mini-card">
          <p>Aquí podrás ver y gestionar todas tus solicitudes legales.</p>
        </div>

      </div>

      {/* ESTILOS */}
      <style jsx>{`
        .container {
          min-height: 100vh;
          background: #f1f5f9;
          padding: 20px;
        }

        /* TOPBAR */
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo {
          height: 50px;
        }

        h2 {
          color: #1e3a8a;
        }

        .logout {
          background: #ef4444;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 10px;
          cursor: pointer;
        }

        /* BIENVENIDA */
        .welcome-box {
          background: linear-gradient(135deg, #1e3a8a, #3b82f6);
          color: white;
          padding: 25px;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .btn-main {
          background: #38bdf8;
          color: #1e3a8a;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
        }

        /* CARDS */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .card {
          background: white;
          padding: 25px;
          border-radius: 15px;
          text-align: center;
          cursor: pointer;
          transition: 0.3s;
        }

        .card:hover {
          transform: translateY(-5px);
        }

        /* MIS SOLICITUDES */
        .mis-solicitudes {
          background: white;
          padding: 20px;
          border-radius: 15px;
        }

        .box-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ver-btn {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-weight: bold;
        }

        .mini-card {
          margin-top: 10px;
          background: #f8fafc;
          padding: 15px;
          border-radius: 10px;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .welcome-box {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}