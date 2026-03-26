"use client";
import { useRouter } from "next/navigation";

export default function AdminPanel() {
  const router = useRouter();

  return (
    <div className="container">
      <header className="topbar">
        <div className="logo-section">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" className="logo" alt="CANTV" />
          <h2>SISLEXI ADMIN</h2>
        </div>
        <div className="user-actions">
          <div className="admin-tag">👨‍✈️ Administrador</div>
          <button className="btn-logout" onClick={() => router.push("/login")}>🚪 Cerrar Sesión</button>
        </div>
      </header>

      <div className="welcome-box">
        <h1>Panel de Control Principal</h1>
        <p>Seleccione un módulo para gestionar el sistema legal.</p>
      </div>

      <div className="grid">
        {/* BOTÓN USUARIOS */}
        <div className="card" onClick={() => router.push("/administrador/usuarios")}>
          <span className="card-icon">👥</span>
          <h3>Gestión de Usuarios</h3>
          <p>Consultar, registrar y editar personal.</p>
        </div>

        {/* BOTÓN SOLICITUDES */}
        <div className="card" onClick={() => router.push("/administrador/solicitudes")}>
          <span className="card-icon">📂</span>
          <h3>Solicitudes</h3>
          <p>Revisión y asignación de casos legales.</p>
        </div>

        {/* BOTÓN AUDITORÍA (AÑADIDO) */}
        <div className="card" onClick={() => router.push("/administrador/auditoria")}>
          <span className="card-icon">🕵️</span>
          <h3>Auditoría</h3>
          <p>Historial de movimientos y logs del sistema.</p>
        </div>

        {/* BOTÓN ESTADÍSTICAS */}
        <div className="card" onClick={() => router.push("/administrador/estadisticas")}>
          <span className="card-icon">📊</span>
          <h3>Estadísticas</h3>
          <p>Reportes de eficiencia y métricas.</p>
        </div>
      </div>

      <style jsx>{`
        .container { min-height: 100vh; background: #f1f5f9; padding: 20px; font-family: sans-serif; }
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .logo { height: 45px; }
        .admin-tag { background: #e0f2fe; color: #0369a1; padding: 8px 15px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; }
        .btn-logout { background: #ef4444; color: white; border: none; padding: 10px 18px; border-radius: 12px; cursor: pointer; font-weight: bold; }
        .welcome-box { background: linear-gradient(135deg, #002d72, #0056b3); color: white; padding: 30px; border-radius: 20px; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .card { background: white; padding: 30px; border-radius: 18px; text-align: center; cursor: pointer; transition: 0.3s; border: 1px solid #e2e8f0; }
        .card:hover { transform: translateY(-8px); border-color: #00a9e0; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .card-icon { font-size: 2.5rem; display: block; margin-bottom: 15px; }
        h3 { color: #1e293b; margin: 0 0 10px; }
        p { color: #64748b; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}