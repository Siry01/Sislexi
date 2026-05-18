"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function BandejaPriorizadaAbogado() {
  const router = useRouter();
  const [tabActual, setTabActual] = useState("global"); 
  const [globales, setGlobales] = useState([]);
  const [misCasos, setMisCasos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const idUser = auth.currentUser?.uid;

    // CONSULTA 1: Global (Sin asignar)
    const q1 = query(collection(db, "solicitudes"), where("estado", "==", "pendiente"));
    
    // CONSULTA 2: Mis Casos (Todos sus casos tomados)
    const q2 = query(collection(db, "solicitudes"), where("idAbogado", "==", idUser || ""));

    const unsubscribeGlobal = onSnapshot(q1, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGlobales(docs.sort((a, b) => b.puntaje - a.puntaje));
    });

    const unsubscribePersonal = onSnapshot(q2, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMisCasos(docs.sort((a, b) => b.puntaje - a.puntaje));
    });

    return () => { unsubscribeGlobal(); unsubscribePersonal(); };
  }, []);

  const formatFechaHora = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const lista = tabActual === "global" ? globales : misCasos;
  
  const filtradas = lista.filter(s => 
    s.idTicket?.toString().includes(busqueda) || 
    s.nombreSolicitante?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.p00?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.cedula?.toString().includes(busqueda) ||
    s.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.organismo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="layout-bandeja">
      {/* NAVBAR INSTITUCIONAL */}
      <header className="navbar-superior">
        <div className="marca-capsula">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" />
          <span>SISLEXI BANDEJA DE SOLICITUDES</span>
        </div>
        <button className="btn-volver" onClick={() => router.push("/abogado")}>🚪 Regresar al Panel</button>
      </header>
      
      <main className="content-container">
        {/* SELECTOR DE PESTAÑAS */}
        <div className="tabs-container">
          <button className={`tab-btn ${tabActual === "global" ? "active" : ""}`} onClick={() => setTabActual("global")}>
            🌐 Casos Globales Pendientes ({globales.length})
          </button>
          <button className={`tab-btn ${tabActual === "mis-casos" ? "active" : ""}`} onClick={() => setTabActual("mis-casos")}>
            💼 Mi Cartera Legal ({misCasos.length})
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <input 
          type="text" 
          placeholder="🔍 Buscar por Ticket, Nombre, P00, Cédula, Requerimiento o Área..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)} 
          className="search-bar" 
        />

        {/* GRILLA DE TARJETAS CON ICONOS */}
        <div className="cards-grid">
          {filtradas.length > 0 ? filtradas.map(s => {
            const esFinalizado = s.estado === "aprobado" || s.estado === "rechazado" || s.estado === "finalizado";
            
            return (
              <div key={s.id} className={`ticket-card-item ${esFinalizado ? "card-finalized" : ""}`}>
                {/* Cabecera de la Tarjeta */}
                <div className="card-top-info">
                  <span className="score-tag">📊 {s.puntaje || "0"} pts</span>
                  <span className="ticket-id-tag"># {s.idTicket}</span>
                </div>

                {/* Contenido Principal */}
                <div className="card-main-body">
                  <h3 className="req-title">📝 {s.tipo}</h3>
                  <span className={`status-pill ${s.estado}`}>{s.estado}</span>
                  <p className="date-txt">🕒 {formatFechaHora(s.fecha || s.fechaRegistro)}</p>
                </div>

                <hr className="divider" />

                {/* Ficha Técnica Institucional con Iconos */}
                <div className="card-worker-details">
                  <p>
                    <span>👤 <strong>Solicitante:</strong></span> 
                    <span>{s.nombreSolicitante || "No provisto"}</span>
                  </p>
                  <p>
                    <span>🪪 <strong>Cédula:</strong></span> 
                    <span>V-{s.cedula || s.usuarioId}</span>
                  </p>
                  <p>
                    <span>⚙️ <strong>Código CANTV:</strong></span> 
                    <span className="p00-badge">🔑 {s.p00 || "N/A"}</span>
                  </p>
                  <p>
                    <span>🏢 <strong>Área / Oficina:</strong></span> 
                    <span>{s.organismo || s.areaTrabajo || "Gestión Humana"}</span>
                  </p>
                </div>

                {/* Bloque Inferior de Acciones */}
                <div className="card-actions-footer">
                  <button 
                    className={`btn-main-action ${esFinalizado ? "btn-edit" : tabActual === "global" ? "btn-attend" : "btn-manage"}`} 
                    onClick={() => router.push(`/abogado/${tabActual === "global" ? "tomar" : "gestionar"}/${s.id}`)}
                  >
                    {esFinalizado ? "✏️ Editar Respuesta" : tabActual === "global" ? "📥 Atender Caso" : "⚖️ Gestionar Caso"}
                  </button>
                  
                  {tabActual === "mis-casos" && (
                    /* 🔥 CORRECCIÓN CRÍTICA: Cambiado s.usuarioId por s.id para independizar los hilos de chat */
                    <button className="btn-chat" onClick={() => router.push(`/abogado/chat/${s.id}`)}>💬 Chat</button>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="empty-state-box">📭 No se encontraron registros en esta bandeja.</div>
          )}
        </div>
      </main>

      <style jsx>{`
        .layout-bandeja { min-height: 100vh; background: #f4f7f9; font-family: 'Segoe UI', Arial, sans-serif; display: flex; flex-direction: column; }
        
        /* NAVBAR PREMIUM */
        .navbar-superior { background: white; padding: 14px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .marca-capsula { display: flex; align-items: center; gap: 12px; font-weight: 800; color: #002d72; font-size: 1.3rem; letter-spacing: -0.5px; }
        .marca-capsula img { height: 38px; object-fit: contain; }
        .btn-volver { padding: 9px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 700; color: #475569; transition: all 0.2s; }
        .btn-volver:hover { background: #f8fafc; border-color: #94a3b8; }

        .content-container { padding: 30px 4%; flex: 1; display: flex; flex-direction: column; }
        
        /* TABS */
        .tabs-container { display: flex; gap: 12px; margin-bottom: 20px; }
        .tab-btn { border: none; background: #e2e8f0; padding: 12px 24px; border-radius: 12px; font-weight: 700; color: #475569; cursor: pointer; transition: 0.3s; }
        .tab-btn.active { background: #002d72; color: white; box-shadow: 0 4px 12px rgba(0,45,114,0.15); }

        .search-bar { width: 100%; padding: 14px 20px; margin-bottom: 25px; border-radius: 14px; border: 1px solid #cbd5e1; background: white; font-size: 0.95rem; outline: none; box-sizing: border-box; }
        .search-bar:focus { border-color: #002d72; box-shadow: 0 0 0 3px rgba(0,45,114,0.1); }
        
        /* GRILLA DE TARJETAS MULTICOLUMNA */
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 25px; }
        
        .ticket-card-item { background: white; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15 rgba(0,0,0,0.02); display: flex; flex-direction: column; transition: all 0.2s ease; }
        .ticket-card-item:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .card-finalized { background: #f8fafc; opacity: 0.85; border-color: #cbd5e1; }

        /* DETALLES SUPERIORES */
        .card-top-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .score-tag { background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 8px; font-weight: 800; border: 1px solid #bae6fd; font-size: 0.85rem; }
        .ticket-id-tag { font-size: 0.85rem; font-weight: 800; color: #3b82f6; background: #eff6ff; padding: 4px 10px; border-radius: 8px; }

        /* CUERPO CENTRAL */
        .card-main-body { flex: 1; margin-bottom: 5px; }
        .req-title { margin: 0 0 12px 0; font-size: 1.15rem; color: #002d72; font-weight: 800; line-height: 1.4; }
        .date-txt { font-size: 0.8rem; color: #64748b; margin: 12px 0 0 0; display: flex; align-items: center; gap: 4px; }

        .divider { border: 0; border-top: 1px dashed #e2e8f0; margin: 15px 0; }

        /* FICHA DEL TRABAJADOR */
        .card-worker-details { font-size: 0.9rem; color: #334155; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .card-worker-details p { margin: 0; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .card-worker-details strong { color: #475569; font-weight: 600; }
        .p00-badge { font-family: monospace; font-weight: 700; color: #002d72; background: #e0e7ff; padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; display: flex; align-items: center; gap: 4px; }

        /* ESTADOS */
        .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: inline-block; }
        .pendiente { background: #fef3c7; color: #d97706; }
        .en { background: #e0f2fe; color: #0369a1; } 
        .aprobado { background: #dcfce7; color: #16a34a; }
        .rechazado { background: #fee2e2; color: #ef4444; }

        /* BOTONES ACCIONES */
        .card-actions-footer { display: flex; gap: 10px; margin-top: auto; }
        .btn-main-action { flex: 1; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.9rem; transition: all 0.2s; text-align: center; }
        
        .btn-attend { background: #10b981; color: white; box-shadow: 0 4px 10px rgba(16,185,129,0.2); }
        .btn-attend:hover { background: #059669; }
        .btn-manage { background: #002d72; color: white; box-shadow: 0 4px 10px rgba(0,45,114,0.2); }
        .btn-manage:hover { background: #001a45; }
        .btn-edit { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
        .btn-edit:hover { background: #e2e8f0; }

        .btn-chat { background: white; color: #002d72; border: 1px solid #002d72; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.9rem; }
        .btn-chat:hover { background: #eff6ff; }

        .empty-state-box { grid-column: 1 / -1; text-align: center; padding: 50px; color: #94a3b8; font-style: italic; background: white; border-radius: 15px; border: 1px dashed #cbd5e1; }

        @media (max-width: 640px) {
          .navbar-superior { padding: 12px 4%; }
          .marca-capsula span { display: none; }
          .tabs-container { flex-direction: column; gap: 8px; }
          .tab-btn { width: 100%; text-align: center; }
          .cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}