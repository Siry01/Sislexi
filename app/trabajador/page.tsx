"use client";

import { useRouter } from "next/navigation";

export default function Panel() {
  const router = useRouter();
  // 🚪 CERRAR SESIÓN (SIMPLE Y SEGURO)
  const handleLogout = () => {
    localStorage.removeItem("rol");
    localStorage.removeItem("user");
    router.push("/login");
  };

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

      {/* 🔥 LOGOUT FUNCIONANDO */}
        <div className="logout">
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      

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
          onClick={() => router.push("trabajador/chat")}
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
    background: #e2e8f0;
    padding: 20px;
  }

  /* TOPBAR */
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo {
    height: 45px;
  }

  h2 {
    color: #1e3a8a;
    font-weight: bold;
  }

  .logout {
    background: #ef4444;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }

  .logout:hover {
    background: #dc2626;
  }

  /* BIENVENIDA */
  .welcome-box {
    background: linear-gradient(135deg, #1e3a8a, #2563eb);
    color: white;
    padding: 25px;
    border-radius: 20px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 25px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  }

  .welcome-box p {
    color: #e0f2fe;
  }

  .btn-main {
    background: #38bdf8;
    color: #0f172a;
    border: none;
    padding: 12px 22px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: bold;
  }

  .btn-main:hover {
    background: #0ea5e9;
    color: white;
  }

  /* CARDS */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
  }

  .card {
    background: white;
    padding: 25px;
    border-radius: 15px;
    text-align: center;
    cursor: pointer;
    transition: 0.3s;
    color: #1f2937;
    box-shadow: 0 6px 15px rgba(0,0,0,0.08);
  }

  .card h3 {
    margin-top: 10px;
    color: #1e3a8a;
  }

  .card p {
    color: #4b5563;
  }

  .card:hover {
    transform: translateY(-5px);
    background: #f1f5f9;
  }

  /* MIS SOLICITUDES */
  .mis-solicitudes {
    background: white;
    padding: 20px;
    border-radius: 15px;
    box-shadow: 0 6px 15px rgba(0,0,0,0.08);
  }

  .box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .box-header h2 {
    color: #1e3a8a;
  }

  .ver-btn {
    background: none;
    border: none;
    color: #2563eb;
    cursor: pointer;
    font-weight: bold;
  }

  .mini-card {
    margin-top: 12px;
    background: #f1f5f9;
    padding: 15px;
    border-radius: 10px;
    color: #374151;
  }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .welcome-box {
      flex-direction: column;
      gap: 15px;
    }

    .logout {
      font-size: 14px;
      padding: 8px 12px;
    }
  }
`}</style>
    </div>
  );
}