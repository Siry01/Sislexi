"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function DetalleSolicitudAdmin() {
  const { id } = useParams();
  const router = useRouter();
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [nuevoEstado, setNuevoEstado] = useState("");
  const [abogadoAsignado, setAbogadoAsignado] = useState("");

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const docRef = doc(db, "solicitudes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSolicitud(data);
          setNuevoEstado(data.estado || "PENDIENTE");
          setAbogadoAsignado(data.abogadoAtendio || "");
        }
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchDetalle();
  }, [id]);

  const actualizarSolicitud = async () => {
    setGuardando(true);
    try {
      const docRef = doc(db, "solicitudes", id);
      await updateDoc(docRef, {
        estado: nuevoEstado,
        abogadoAtendio: abogadoAsignado,
        fechaActualizacion: new Date()
      });
      alert("✅ Cambios guardados.");
    } catch (e) { alert("❌ Error."); }
    finally { setGuardando(false); }
  };

  if (loading) return <div className="loader">Sincronizando expediente...</div>;

  return (
    <div className="container-pro">
      <main className="bento-wrapper">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="main-card">
          
          {/* BARRA SUPERIOR COMPACTA */}
          <header className="header-compact">
            <button onClick={() => router.back()} className="back-link">← Regresar</button>
            <div className="center-logo">
              <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" />
              <h2>Expediente <span>#{solicitud.idTicket || id.substring(0,6)}</span></h2>
            </div>
            <div className={`status-pill ${nuevoEstado.toLowerCase()}`}>{nuevoEstado}</div>
          </header>

          <div className="content-grid">
            {/* IZQUIERDA: FICHA TÉCNICA */}
            <div className="column">
              <section className="section-card">
                <div className="title-row"><span>👤</span> SOLICITANTE</div>
                <div className="data-grid">
                  <div className="item"><label>Nombre</label><p>{solicitud.usuarioNombre}</p></div>
                  <div className="item"><label>Cédula</label><p>{solicitud.cedula || "N/R"}</p></div>
                  <div className="item"><label>Teléfono</label><p>{solicitud.telefono || "N/R"}</p></div>
                  <div className="item"><label>Departamento</label><p>{solicitud.departamento || "N/A"}</p></div>
                  <div className="item full"><label>Sede</label><p>📍 {solicitud.sede || "No definida"}</p></div>
                </div>
              </section>

              <section className="section-card">
                <div className="title-row"><span>⚖️</span> ASUNTO</div>
                <div className="data-grid">
                  <div className="item"><label>Trámite</label><p className="tag-blue">{solicitud.tipo}</p></div>
                  <div className="item"><label>Urgencia</label><p className={`urg-text ${solicitud.urgencia?.toLowerCase()}`}>● {solicitud.urgencia}</p></div>
                </div>
                <div className="memo-area">
                  <label>RESUMEN DEL CASO</label>
                  <div className="memo-text">{solicitud.descripcion || "Sin descripción."}</div>
                </div>
              </section>
            </div>

            {/* DERECHA: GESTIÓN */}
            <div className="column">
              <section className="section-card manage">
                <div className="title-row"><span>⚙️</span> ACCIONES</div>
                <div className="field">
                  <label>Abogado Asignado</label>
                  <select value={abogadoAsignado} onChange={(e) => setAbogadoAsignado(e.target.value)}>
                    <option value="">Sin asignar</option>
                    <option value="Abog. Luis Pacheco">Abog. Luis Pacheco</option>
                    <option value="Abog. Daniela Salas">Abog. Daniela Salas</option>
                  </select>
                </div>
                <div className="field">
                  <label>Estatus Operativo</label>
                  <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="PROCESO">EN PROCESO</option>
                    <option value="FINALIZADO">FINALIZADO</option>
                    <option value="CANCELADA">CANCELADA</option>
                  </select>
                </div>
                <button className="btn-save" onClick={actualizarSolicitud} disabled={guardando}>
                  {guardando ? "Guardando..." : "GUARDAR CAMBIOS"}
                </button>
              </section>

              <section className="section-card docs">
                <div className="title-row"><span>📁</span> ARCHIVOS</div>
                {solicitud.archivoUrl ? (
                  <a href={solicitud.archivoUrl} target="_blank" className="btn-doc">Abrir Documento ↗</a>
                ) : <p className="no-data">Sin adjuntos.</p>}
              </section>
            </div>
          </div>
        </motion.div>
      </main>

      <style jsx>{`
        .container-pro { min-height: 100vh; background: #f0f2f5; padding: 20px; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: flex-start; }
        .bento-wrapper { width: 100%; max-width: 1100px; margin-top: 20px; }
        .main-card { background: white; border-radius: 30px; padding: 35px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }

        .header-compact { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
        .back-link { background: none; border: none; font-weight: 700; color: #64748b; cursor: pointer; }
        .center-logo { display: flex; flex-direction: column; align-items: center; }
        .center-logo img { height: 40px; margin-bottom: 5px; }
        .center-logo h2 { font-size: 1rem; color: #002d72; font-weight: 900; margin: 0; }
        .center-logo span { font-weight: 400; color: #94a3b8; }

        .content-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; }
        .section-card { background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
        .title-row { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 900; color: #002d72; margin-bottom: 20px; letter-spacing: 0.5px; }
        
        .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .item label { display: block; font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
        .item p { font-size: 0.9rem; font-weight: 700; color: #1e293b; margin: 0; }
        .item.full { grid-column: span 2; }

        .tag-blue { background: #e0e7ff; color: #4338ca; padding: 3px 10px; border-radius: 6px; width: fit-content; }
        .memo-area { margin-top: 20px; }
        .memo-area label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; }
        .memo-text { background: white; padding: 15px; border-radius: 12px; font-size: 0.85rem; color: #475569; border: 1px solid #e2e8f0; margin-top: 5px; }

        .field { margin-bottom: 15px; }
        .field label { display: block; font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 6px; }
        .field select { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-weight: 700; outline: none; }

        .btn-save { width: 100%; background: #002d72; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 900; cursor: pointer; transition: 0.2s; }
        .btn-save:hover { background: #001f4d; transform: translateY(-2px); }

        .status-pill { padding: 6px 15px; border-radius: 10px; font-weight: 900; font-size: 0.7rem; text-transform: uppercase; }
        .status-pill.pendiente { background: #fee2e2; color: #ef4444; }
        .status-pill.proceso { background: #fef3c7; color: #d97706; }
        .status-pill.finalizado { background: #d1fae5; color: #059669; }

        .btn-doc { display: block; text-align: center; background: white; border: 1px solid #002d72; color: #002d72; padding: 10px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 0.8rem; }
        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #002d72; }
      `}</style>
    </div>
  );
}