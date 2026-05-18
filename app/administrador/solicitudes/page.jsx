"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase"; 
import { collection, onSnapshot, doc, updateDoc, query, where } from "firebase/firestore";

export default function GestionSolicitudesAdmin() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState([]);
  const [abogadosReales, setAbogadosReales] = useState([]); 
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    const storedRol = localStorage.getItem("rol");
    if (!storedRol || storedRol !== "admin") {
      router.push("/login");
      return;
    }

    // Traer abogados reales
    const qAbogados = query(collection(db, "usuarios"), where("rol", "==", "abogado"));
    const unsubscribeAbogados = onSnapshot(qAbogados, (snapshot) => {
      const lista = snapshot.docs.map(d => ({
        uid: d.id,
        nombre: d.data().nombre || d.data().nombresApellidos || "Abogado sin nombre"
      }));
      setAbogadosReales(lista);
    });

    // Traer solicitudes en tiempo real
    const qSolicitudes = query(collection(db, "solicitudes"));
    const unsubscribeSolicitudes = onSnapshot(qSolicitudes, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        const fechaNat = data.fecha || data.fechaRegistro;
        const jsDate = fechaNat?.toDate ? fechaNat.toDate() : fechaNat ? new Date(fechaNat) : new Date();
        
        // Mapeo flexible de auditoría relacional
        const idAbogadoAsignado = data.abogadoUid || data.abogadoId || data.idAbogado || "";
        const nombreAbogadoAsignado = data.firmaAbogadoNombre || data.nombreAbogado || data.abogadoNombre || "";

        // 🧠 SIMULACIÓN DEL ÍNDICE MULTICRITERIO (AHP + TOPSIS)
        // En producción, este score es el resultado de tu matriz TOPSIS guardada en Firestore
        const hoy = new Date();
        const diasEspera = Math.round((hoy - jsDate) / (1000 * 60 * 60 * 24)) || 1;
        
        // Ponderación de criterios simulada: Amparos y casos antiguos penalizan con mayor Score TOPSIS
        let factorTipo = (data.tipo || "").toLowerCase().includes("amparo") ? 45 : 20;
        let scoreTopsis = factorTipo + (diasEspera * 5);
        if (scoreTopsis > 98) scoreTopsis = 98; // Límite matemático

        return { 
          id: d.id, 
          ...data, 
          abogadoUid: idAbogadoAsignado,
          firmaAbogadoNombre: nombreAbogadoAsignado,
          topsisScore: data.prioridadTopsis || scoreTopsis, // Prioridad real o calculada
          fechaFormateada: jsDate.toLocaleDateString("es-VE") 
        };
      });

      // 🔥 REGLA DE ORO DE TOPSIS: El sistema ordena automáticamente de mayor a menor prioridad matemática
      docs.sort((a, b) => b.topsisScore - a.topsisScore);
      setSolicitudes(docs);
    });

    return () => {
      unsubscribeAbogados();
      unsubscribeSolicitudes();
    };
  }, [router]);

  const asignarAbogadoCaso = async (idDocumento, abogadoUid) => {
    if (!abogadoUid) return;
    setProcesandoId(idDocumento);
    const abogadoSeleccionado = abogadosReales.find(a => a.uid === abogadoUid);
    
    if (!abogadoSeleccionado) {
      alert("Error de consistencia de datos.");
      setProcesandoId(null);
      return;
    }
    
    try {
      const docRef = doc(db, "solicitudes", idDocumento);
      await updateDoc(docRef, {
        firmaAbogadoNombre: abogadoSeleccionado.nombre,
        nombreAbogado: abogadoSeleccionado.nombre,
        abogadoUid: abogadoSeleccionado.uid,
        abogadoId: abogadoSeleccionado.uid,
        estado: "PROCESO" 
      });
    } catch (error) {
      console.error(error);
    } finally {
      setProcesandoId(null);
    }
  };

  const solicitudesFiltradas = solicitudes.filter(s => {
    const estadoLimpio = (s.estado || "pendiente").toLowerCase();
    if (filtroEstado === "todos") return true;
    if (filtroEstado === "pendiente") return estadoLimpio === "pendiente" || !s.abogadoUid;
    return estadoLimpio === filtroEstado.toLowerCase();
  });

  return (
    <div className="container-solicitudes">
      {/* BARRA SUPERIOR */}
      <header className="topbar">
        <div className="logo-section">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" className="logo-main" alt="CANTV" />
          <h2 className="brand-title">SISLEXI</h2>
        </div>
        <button className="btn-volver" onClick={() => router.push("/administrador")}>
          🚪 Volver al Panel
        </button>
      </header>

      <main className="main-layout">
        <div className="section-title-row">
          <h2>📂 Optimización de Solicitudes Colectivas</h2>
          <p>Bandeja automatizada bajo el modelo matemático multiobjetivo híbrido <strong>AHP + TOPSIS</strong>.</p>
        </div>

        {/* PILLS FILTROS */}
        <div className="filter-bar-container">
          <span className="lbl-filtro">Estatus Operacional:</span>
          <div className="pills-filtros">
            <button className={filtroEstado === "todos" ? "active" : ""} onClick={() => setFiltroEstado("todos")}>Todos ({solicitudes.length})</button>
            <button className={filtroEstado === "pendiente" ? "active" : ""} onClick={() => setFiltroEstado("pendiente")}>Por Asignar</button>
            <button className={filtroEstado === "PROCESO" ? "active" : ""} onClick={() => setFiltroEstado("PROCESO")}>En Trámite</button>
          </div>
        </div>

        {/* LISTADO DE TARJETAS CON EL SEMÁFORO MULTICRITERIO */}
        <div className="solicitudes-list-grid">
          {solicitudesFiltradas.length > 0 ? solicitudesFiltradas.map((sol) => {
            const estadoActual = (sol.estado || "pendiente").toLowerCase();
            
            // 🚨 Determinar criticidad según el Score de TOPSIS
            // Si el score supera 75% se tiñe de rojo crítico por ordenamiento matemático
            const esCriticoTopsis = sol.topsisScore >= 75;

            return (
              <div key={sol.id} className={`solicitud-card-item ${esCriticoTopsis && estadoActual === "pendiente" ? "critico-topsis-style" : ""}`}>
                <div className="card-top-meta">
                  <span className="ticket-id-tag">🎫 Ticket: {sol.idTicket || sol.id.slice(0,8)}</span>
                  
                  {/* Etiqueta del Score del algoritmo */}
                  <span className={`topsis-badge ${esCriticoTopsis ? "high-topsis" : "low-topsis"}`}>
                    🎯 TOPSIS: {sol.topsisScore}%
                  </span>
                </div>

                <div className="card-body-details">
                  <h4>{sol.nombreSolicitante || "Trabajador no registrado"} <span className="p00-sub">(P00: {sol.p00 || "N/A"})</span></h4>
                  <p className="txt-meta-sol"><strong>Área procedencia:</strong> {sol.organismo || sol.areaTrabajo || "Gestión Humana"}</p>
                  <p className="txt-meta-sol"><strong>Tipo de Requerimiento:</strong> {sol.tipo || "Asesoría General"}</p>
                  
                  {esCriticoTopsis && estadoActual === "pendiente" && (
                    <div className="badge-alerta-topsis-text">
                      ⚠️ PRIORIDAD CRÍTICA: El modelo híbrido AHP-TOPSIS sugiere asignación prioritaria por riesgo de represo legal.
                    </div>
                  )}

                  <div className="descripcion-caso-box">
                    <p>"{sol.descripcion || "Sin descripción de motivos."}"</p>
                  </div>
                </div>

                <div className="card-footer-assignment">
                  <label className="lbl-assign">Asignar / Cambiar Abogado Auditor Real:</label>
                  <div className="selector-btn-row">
                    <select
                      value={sol.abogadoUid || ""}
                      onChange={(e) => asignarAbogadoCaso(sol.id, e.target.value)}
                      disabled={procesandoId === sol.id}
                      className="select-abogado-injector"
                    >
                      <option value="">-- Sin Abogado Asignado --</option>
                      {abogadosReales.map((abg) => (
                        <option key={abg.uid} value={abg.uid}>{abg.nombre}</option>
                      ))}
                    </select>
                    {procesandoId === sol.id && <span className="loader-mini">🔄</span>}
                  </div>
                  {sol.abogadoUid && (
                    <p className="abogado-actual-txt">🧑‍⚖️ Responsable actual: <strong>{sol.firmaAbogadoNombre || "Asignado"}</strong></p>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="empty-state-solicitudes">📭 No se encontraron solicitudes registradas bajo este estatus.</div>
          )}
        </div>
      </main>

      <style jsx>{`
        .container-solicitudes { min-height: 100vh; background-color: #f4f6f9; padding: 0 4%; display: flex; flex-direction: column; font-family: 'Inter', sans-serif; }
        .topbar { height: 85px; display: flex; justify-content: space-between; align-items: center; min-height: 85px; }
        .logo-section { display: flex; align-items: center; gap: 12px; }
        .logo-main { height: 45px; }
        .brand-title { color: #002d72; font-size: 1.4rem; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .btn-volver { padding: 9px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 700; color: #475569; }

        .main-layout { flex-grow: 1; display: flex; flex-direction: column; gap: 15px; padding-bottom: 30px; }
        .section-title-row { text-align: left; margin-top: 10px; }
        .section-title-row h2 { margin: 0; color: #0f172a; font-weight: 800; font-size: 1.4rem; }
        .section-title-row p { margin: 4px 0 0 0; color: #64748b; font-size: 0.85rem; }

        .filter-bar-container { background: white; padding: 12px 25px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px; text-align: left; }
        .lbl-filtro { font-size: 0.8rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .pills-filtros { display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 10px; }
        .pills-filtros button { border: none; background: none; padding: 6px 14px; font-weight: 700; border-radius: 8px; font-size: 0.8rem; cursor: pointer; color: #475569; }
        .pills-filtros button.active { background: white; color: #002d72; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

        .solicitudes-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 20px; }
        .solicitud-card-item { background: white; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.01); display: flex; flex-direction: column; justify-content: space-between; text-align: left; gap: 15px; transition: 0.2s; }
        
        /* 🚨 ESTILO DE INYECCIÓN MATEMÁTICA TOPSIS CRÍTICA (Borde y fondo sutil rojo) */
        .critico-topsis-style { border: 1px solid #fca5a5 !important; background: #fffafb !important; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.04); }

        .card-top-meta { display: flex; justify-content: space-between; align-items: center; }
        .ticket-id-tag { font-family: monospace; font-size: 0.8rem; font-weight: 700; color: #475569; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; }
        
        /* BADGES DEL ALGORITMO */
        .topsis-badge { font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.3px; text-transform: uppercase; }
        .topsis-badge.high-topsis { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        .topsis-badge.low-topsis { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

        .badge-alerta-topsis-text { background: #fef2f2; color: #991b1b; font-size: 0.75rem; font-weight: 700; padding: 10px 14px; border-radius: 10px; margin-top: 10px; border-left: 4px solid #ef4444; line-height: 1.4; }

        .card-body-details h4 { margin: 0 0 10px 0; color: #0f172a; font-size: 1.1rem; font-weight: 800; }
        .p00-sub { color: #64748b; font-size: 0.9rem; font-weight: 600; }
        .txt-meta-sol { margin: 4px 0; font-size: 0.85rem; color: #475569; }
        .descripcion-caso-box { background: #f8fafc; border: 1px solid #f1f5f9; padding: 12px 16px; border-radius: 12px; margin-top: 10px; font-style: italic; color: #334155; font-size: 0.85rem; line-height: 1.4; }

        .card-footer-assignment { border-top: 1px dashed #e2e8f0; padding-top: 15px; display: flex; flex-direction: column; gap: 8px; }
        .lbl-assign { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .selector-btn-row { display: flex; align-items: center; gap: 10px; }
        .select-abogado-injector { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 0.85rem; font-weight: 600; color: #1e293b; outline: none; }
        .select-abogado-injector:focus { border-color: #002d72; background: white; }
        .abogado-actual-txt { margin: 4px 0 0 0; font-size: 0.8rem; color: #002d72; font-weight: 600; }
        .loader-mini { animation: spin 1s infinite linear; display: inline-block; }
        .empty-state-solicitudes { grid-column: 1 / -1; text-align: center; padding: 50px; color: #94a3b8; font-style: italic; background: white; border-radius: 20px; border: 1px dashed #cbd5e1; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 600px) { .solicitudes-list-grid { grid-template-columns: 1fr; } .filter-bar-container { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </div>
  );
}