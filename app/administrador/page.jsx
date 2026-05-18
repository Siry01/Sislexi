"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../lib/firebase"; 
import { collection, onSnapshot, query } from "firebase/firestore";

export default function AdminPanel() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [saludo, setSaludo] = useState("Bienvenido");
  const [tasaEfectividad, setTasaEfectividad] = useState("100%");
  const [alertasRendimiento, setAlertasRendimiento] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRol = localStorage.getItem("rol");

    if (!storedRol || storedRol !== "admin") {
      router.push("/login");
      return;
    }

    const hora = new Date().getHours();
    if (hora < 12) setSaludo("Buenos días");
    else if (hora < 18) setSaludo("Buenas tardes");
    else setSaludo("Buenas noches");

    if (storedUser) {
      try {
        const data = JSON.parse(storedUser);
        setNombreUsuario(data.nombre || "Luis Arcia");
      } catch (e) {
        setNombreUsuario("Luis Arcia");
      }
    }

    const qSolicitudes = query(collection(db, "solicitudes"));
    const unsubscribeSolicitudes = onSnapshot(qSolicitudes, (snapshot) => {
      try {
        const todosLosCasos = snapshot.docs.map(d => d.data());

        const resueltos = todosLosCasos.filter(c => {
          const est = (c.estado || "").toLowerCase();
          return est === "aprobado" || est === "rechazado" || est === "finalizado";
        }).length;
        
        const total = todosLosCasos.length;
        const efectividadCalculada = total > 0 ? Math.round((resueltos / total) * 100) : 0;

        setTasaEfectividad(`${efectividadCalculada}%`);

        const listaAbogados = [
          { name: "Abg. Siry Pacheco", efectividad: 99 },
          { name: "Consultoría Central CANTV", efectividad: 84 },
          { name: "Auditoría Interna Guárico", efectividad: 91 }
        ];

        if (efectividadCalculada < 90) {
          const infractores = listaAbogados.filter(a => a.efectividad < 90);
          const notificaciones = infractores.map((a, idx) => ({
            id: idx,
            nombreAbogado: a.name,
            eficiencia: a.efectividad
          }));
          setAlertasRendimiento(notificaciones);
        } else {
          setAlertasRendimiento([]);
        }

      } catch (err) {
        console.error(err);
      }
    });

    return () => unsubscribeSolicitudes();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const numEfectividad = parseInt(tasaEfectividad) || 0;

  return (
    <div className="container">
      {/* HEADER CORPORATIVO SLIM CON LOGO DESTACADO */}
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
          <button className="nav-item profile-btn" onClick={() => router.push("/administrador/perfil")}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Perfil</span>
          </button>
          <div className="divider"></div>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Salir</span>
          </button>
        </div>
      </header>

      <main className="main-layout">
        {/* BANNER DE BIENVENIDA CÁPSULA */}
        <section className="welcome-banner">
          <div className="welcome-text">
            <h1>{saludo}, {nombreUsuario.toLowerCase()} ⚖️</h1>
            <p>Panel de Control Jurídico • CANTV</p>
          </div>
        </section>

        {/* CONTENEDOR MAESTRO INTELIGENTE (FUSIONA OBJETIVOS Y ALERTAS) */}
        <div className="dashboard-monitor-row">
          <section className="tarjeta-metas-mensuales">
            <div className="info-meta-txt">
              <h4>Control de Objetivos Operativos</h4>
              <p>Meta legal: <span className="highlight-text">90% mínimo</span> de efectividad.</p>
            </div>
            <div className="contenedor-barra-progreso">
              <div className="barra-externa">
                <div className="barra-interna-llenado" style={{ width: `${numEfectividad}%` }}></div>
              </div>
              <span className="porcentaje-meta-txt">{tasaEfectividad} Concluido</span>
            </div>
            {numEfectividad >= 90 ? (
              <div className="badge-meta exitosa">✓ Conforme</div>
            ) : (
              <div className="badge-meta advertencia">⚠️ Requiere Atención</div>
            )}
          </section>

          {/* 🔔 ALERTA ENLACE INTERNO */}
          {alertasRendimiento.length > 0 && (
            <div className="banner-alerta-compacto" onClick={() => router.push("/administrador/solicitudes")}>
              <div className="left-alerta-info">
                <span className="pulse-icon-bell">🔔</span>
                <p>
                  <strong>Optimización de Carga:</strong> Reducción en analistas (
                  {alertasRendimiento.map(a => `${a.nombreAbogado} ${a.eficiencia}%`).join(", ")}
                  ). Presione para gestionar.
                </p>
              </div>
              <span className="flecha-link-go">➔</span>
            </div>
          )}
        </div>

        {/* GRID DE ACCIONES PRINCIPALES COMPACTO */}
        <section className="action-grid">
          <div className="action-card" onClick={() => router.push("/administrador/usuarios")}>
            <div className="card-icon-wrapper blue-grad">👥</div>
            <div className="card-content">
              <h3>Usuarios</h3>
              <p>Personal y Accesos</p>
            </div>
          </div>
          <div className="action-card" onClick={() => router.push("/administrador/solicitudes")}>
            <div className="card-icon-wrapper orange-grad">📂</div>
            <div className="card-content">
              <h3>Solicitudes</h3>
              <p>Gestión de Casos</p>
            </div>
          </div>
          <div className="action-card" onClick={() => router.push("/administrador/auditoria")}>
            <div className="card-icon-wrapper dark-grad">🕵️</div>
            <div className="card-content">
              <h3>Auditoría</h3>
              <p>Seguridad y Logs</p>
            </div>
          </div>
          <div className="action-card" onClick={() => router.push("/administrador/estadisticas")}>
            <div className="card-icon-wrapper purple-grad">📊</div>
            <div className="card-content">
              <h3>Métricas</h3>
              <p>Reportes Legales</p>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .container { height: 100vh; max-height: 100vh; background-color: #f4f6f9; padding: 0 4%; display: flex; flex-direction: column; overflow: hidden; font-family: 'Inter', -apple-system, sans-serif; letter-spacing: -0.15px; }
        .topbar { height: 85px; display: flex; justify-content: space-between; align-items: center; min-height: 85px; }
        .logo-section { display: flex; align-items: center; gap: 14px; }
        .logo-main { height: 50px; width: auto; object-fit: contain; transition: height 0.2s ease; }
        .brand-title { color: #002d72; font-size: 1.45rem; font-weight: 900; margin: 0; letter-spacing: -0.6px; }
        
        .user-nav { display: flex; align-items: center; background: white; padding: 5px 12px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02); }
        
        .nav-item { display: flex; align-items: center; gap: 6px; background: transparent; border: none; padding: 8px 12px; border-radius: 10px; cursor: pointer; font-weight: 700; color: #475569; transition: all 0.2s ease; font-size: 0.8rem; }
        .profile-btn:hover { background: #f1f5f9; color: #002d72; }
        .logout-btn:hover { background: #fee2e2; color: #ef4444; }
        .divider { width: 1px; background: #e2e8f0; margin: 0 4px; height: 16px; }

        .main-layout { flex-grow: 1; display: flex; flex-direction: column; gap: 12px; padding-top: 0; padding-bottom: 25px; justify-content: center; }
        
        .welcome-banner { background: #002d72; border-radius: 20px; padding: 24px 40px; color: white; box-shadow: 0 6px 20px rgba(0, 45, 114, 0.05); }
        .welcome-text h1 { font-size: 1.5rem; margin: 0; font-weight: 800; text-transform: capitalize; text-align: left; letter-spacing: -0.4px; }
        .welcome-text p { opacity: 0.75; margin: 4px 0 0; font-size: 0.85rem; font-weight: 500; text-align: left; }

        .dashboard-monitor-row { display: flex; flex-direction: column; gap: 10px; }

        .tarjeta-metas-mensuales { background: white; padding: 14px 25px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 20px; text-align: left; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01); }
        .info-meta-txt h4 { margin: 0; color: #002d72; font-weight: 800; font-size: 0.95rem; }
        .info-meta-txt p { margin: 2px 0 0 0; color: #64748b; font-size: 0.78rem; }
        .highlight-text { color: #0f172a; font-weight: 700; }
        .contenedor-barra-progreso { flex: 1; display: flex; align-items: center; gap: 12px; }
        .barra-externa { background: #e2e8f0; border-radius: 20px; height: 10px; flex: 1; overflow: hidden; }
        .barra-interna-llenado { height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 20px; transition: width 0.5s ease; }
        .porcentaje-meta-txt { font-weight: 800; color: #0f172a; font-size: 0.8rem; min-width: 85px; text-align: right; }
        .badge-meta { padding: 5px 12px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; white-space: nowrap; }
        .badge-meta.exitosa { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .badge-meta.advertencia { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }

        .banner-alerta-compacto { background: #fffdf5; border: 1px solid #fef3c7; border-left: 5px solid #d97706; padding: 10px 25px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s ease; text-align: left; }
        .banner-alerta-compacto:hover { background: #fef9e7; transform: translateY(-1px); }
        .left-alerta-info { display: flex; align-items: center; gap: 10px; }
        .left-alerta-info p { margin: 0; font-size: 0.8rem; color: #92400e; font-weight: 600; }
        .pulse-icon-bell { font-size: 1rem; animation: bell-ring 0.6s infinite alternate ease-in-out; display: inline-block; }
        .flecha-link-go { color: #d97706; font-weight: 900; font-size: 0.95rem; transition: transform 0.2s ease; }
        .banner-alerta-compacto:hover .flecha-link-go { transform: translateX(2px); }

        .action-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; height: 100px; min-height: 100px; }
        .action-card { background: white; border-radius: 18px; display: flex; align-items: center; padding: 0 20px; gap: 16px; cursor: pointer; transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid #e2e8f0; text-align: left; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.01); }
        .action-card:hover { transform: translateY(-3px); border-color: #002d72; box-shadow: 0 8px 20px rgba(0, 45, 114, 0.05); background: #fafbfc; }
        
        .card-icon-wrapper { font-size: 1.8rem; padding: 8px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 -2px 4px rgba(0,0,0,0.05); }
        .blue-grad { background: #eff6ff; border: 1px solid #bfdbfe; }
        .orange-grad { background: #fff7ed; border: 1px solid #ffedd5; }
        .dark-grad { background: #f8fafc; border: 1px solid #e2e8f0; }
        .purple-grad { background: #faf5ff; border: 1px solid #f3e8ff; }
        
        .card-content h3 { margin: 0; color: #002d72; font-size: 1rem; font-weight: 800; letter-spacing: -0.2px; }
        .card-content p { margin: 2px 0 0; color: #94a3b8; font-size: 0.78rem; font-weight: 600; }

        @keyframes bell-ring { 0% { transform: rotate(-10deg); } 100% { transform: rotate(10deg); } }

        @media (max-width: 1024px) {
          .action-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; height: auto; }
          .tarjeta-metas-mensuales { flex-direction: column; align-items: flex-start; gap: 12px; }
          .contenedor-barra-progreso { width: 100%; }
          .porcentaje-meta-txt { text-align: left; }
          .container { overflow-y: auto; height: auto; max-height: none; }
        }
        @media (max-width: 640px) {
          .action-grid { grid-template-columns: 1fr; }
          .topbar { flex-direction: column; height: auto; padding: 12px 0; gap: 10px; }
          .user-nav { width: 100%; justify-content: center; }
          .welcome-banner { padding: 20px; }
        }
      `}</style>
    </div>
  );
}