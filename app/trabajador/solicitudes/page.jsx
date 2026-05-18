"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function MisSolicitudesTrabajador() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicion, setFormEdicion] = useState({ tipo: "", organismo: "", urgencia: "", telefono: "", descripcion: "" });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    
    const q = query(collection(db, "solicitudes"), where("usuarioId", "==", user?.uid || ""));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        const fechaNat = data.fecha;
        const jsDate = fechaNat?.toDate ? fechaNat.toDate() : fechaNat ? new Date(fechaNat) : new Date();
        
        return {
          id: d.id,
          ...data,
          fechaFormateada: jsDate.toLocaleDateString("es-VE")
        };
      });
      docs.sort((a, b) => b.prioridadTopsis - a.prioridadTopsis);
      setSolicitudes(docs);
    });

    return () => unsubscribe();
  }, []);

  const abrirEditor = (sol) => {
    setEditandoId(sol.id);
    setFormEdicion({
      tipo: sol.tipo || "",
      organismo: sol.organismo || "",
      urgencia: sol.urgencia || "",
      telefono: sol.telefono || "",
      descripcion: sol.descripcion || ""
    });
  };

  const guardarModificacion = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const docRef = doc(db, "solicitudes", editandoId);
      await updateDoc(docRef, { ...formEdicion });
      setEditandoId(null);
      alert("Solicitud modificada exitosamente en el sistema.");
    } catch (error) {
      console.error("Error al modificar:", error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="container-solicitudes">
      <header className="topbar">
        <div className="logo-section">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" className="logo-main" alt="CANTV" />
          <h2 className="brand-title">SISLEXI</h2>
        </div>
        <button className="btn-volver" onClick={() => router.push("/trabajador")}>
          🚪 Volver al Menú
        </button>
      </header>

      <main className="main-layout">
        <div className="section-title">
          <h2>📂 Historial de Requerimientos Legales</h2>
          <p>Consulte el estatus de sus trámites, interactúe con el abogado asignado o modifique registros en espera.</p>
        </div>

        {/* MODAL DE EDICIÓN */}
        {editandoId && (
          <div className="modal-overlay">
            <div className="modal-edit-card">
              <h3>📝 Modificar Registro de Solicitud</h3>
              <form onSubmit={guardarModificacion} className="edit-form-layout">
                <div className="edit-group">
                  <label>TIPO DE TRÁMITE</label>
                  <select value={formEdicion.tipo} onChange={(e) => setFormEdicion({...formEdicion, tipo: e.target.value})} required>
                    <option value="Amparo Constitucional">Amparo Constitucional</option>
                    <option value="Reclamación Colectiva LOTTT">Reclamación Colectiva LOTTT</option>
                    <option value="Impugnación de Actas">Impugnación de Actas</option>
                    <option value="Revisión de Contrato / Convenio">Revisión de Contrato / Convenio</option>
                    <option value="Asesoría Jurídica General">Asesoría Jurídica General</option>
                  </select>
                </div>
                <div className="edit-group">
                  <label>ORGANISMO DESTINO</label>
                  <input type="text" value={formEdicion.organismo} onChange={(e) => setFormEdicion({...formEdicion, organismo: e.target.value})} required />
                </div>
                <div className="edit-group">
                  <label>URGENCIA</label>
                  <select value={formEdicion.urgencia} onChange={(e) => setFormEdicion({...formEdicion, urgencia: e.target.value})} required>
                    <option value="Baja">Baja</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
                <div className="edit-group">
                  <label>TELÉFONO</label>
                  <input type="tel" value={formEdicion.telefono} onChange={(e) => setFormEdicion({...formEdicion, telefono: e.target.value})} required />
                </div>
                <div className="edit-group full-width">
                  <label>DESCRIPCIÓN DETALLADA</label>
                  <textarea value={formEdicion.descripcion} onChange={(e) => setFormEdicion({...formEdicion, descripcion: e.target.value})} required></textarea>
                </div>
                <div className="modal-actions-row">
                  <button type="button" className="btn-cancel" onClick={() => setEditandoId(null)}>Cancelar</button>
                  <button type="submit" className="btn-save-confirm" disabled={guardando}>
                    {guardando ? "Actualizando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LISTADO DE TARJETAS */}
        <div className="solicitudes-grid">
          {solicitudes.length > 0 ? solicitudes.map((sol) => {
            const estadoLimpio = (sol.estado || "pendiente").toLowerCase();
            const esCritico = (sol.prioridadTopsis || 0) >= 75;
            const tieneAbogado = !!sol.abogadoUid;

            return (
              <div key={sol.id} className="solicitud-card">
                <div className="card-header-meta">
                  <span className="ticket-badge">🎫 Ticket #{sol.idTicket}</span>
                  <span className={`topsis-pill ${esCritico ? "critico" : "normal"}`}>
                    🎯 TOPSIS: {sol.prioridadTopsis || 20}%
                  </span>
                </div>
                
                <div className="card-body">
                  <h4>{sol.tipo}</h4>
                  <p className="txt-date">📅 Registrado el: {sol.fechaFormateada}</p>
                  <p className="txt-organismo">🏢 Destino: <strong>{sol.organismo}</strong></p>
                  
                  <div className="descripcion-caso-box">
                    <p>"{sol.descripcion}"</p>
                  </div>

                  {/* 📂 SECCIÓN DE ARCHIVOS ADJUNTOS CON APERTURA DINÁMICA */}
                  <div className="attachments-wrapper">
                    <span className="attachments-title">📎 Documentación Adjunta:</span>
                    {sol.urlsArchivos && sol.urlsArchivos.length > 0 ? (
                      <div className="files-container-list">
                        {sol.urlsArchivos.map((archivo, idx) => (
                          <a 
                            key={idx} 
                            href={archivo.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="file-download-link-card"
                            title="Presione para abrir este documento en una pestaña nueva"
                          >
                            <span className="file-icon-mini">📄</span>
                            <span className="file-name-truncate">{archivo.nombre}</span>
                            <span className="open-eye-icon">👁️</span>
                          </a>
                        ))}
                      </div>
                    ) : sol.nombresArchivos && sol.nombresArchivos.length > 0 ? (
                      /* Respaldo por si hay documentos viejos cargados sin URL de objeto */
                      <div className="files-container-list">
                        {sol.nombresArchivos.map((nombre, idx) => (
                          <div key={idx} className="file-download-link-card disabled-file">
                            <span className="file-icon-mini">📄</span>
                            <span className="file-name-truncate">{nombre}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="no-files-txt">Ningún archivo digital cargado para este caso.</span>
                    )}
                  </div>

                  {/* INDICADOR DE ABOGADO ASIGNADO */}
                  {tieneAbogado ? (
                    <div className="abogado-asignado-alert-box">
                      <div className="abogado-profile-avatar">🧑‍⚖️</div>
                      <div className="abogado-name-info">
                        <span>Caso tomado por el especialista:</span>
                        <strong>{sol.firmaAbogadoNombre || "Consultor Jurídico"}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="espera-analista-box">
                      ⏳ Esperando asignación de especialista por Gestión Humana...
                    </div>
                  )}
                  
                  <div className="status-container-footer">
                    <div className="status-info-left">
                      <span className="lbl-status">Estatus:</span>
                      <span className={`status-badge ${estadoLimpio}`}>
                        {sol.estado || "Pendiente"}
                      </span>
                    </div>

                    <div className="actions-buttons-wrapper">
                      {estadoLimpio === "pendiente" ? (
                        <button className="btn-interactive-action btn-modify" onClick={() => abrirEditor(sol)}>
                          Editar Solicitud 📝
                        </button>
                      ) : (
                        tieneAbogado && (
                          <button className="btn-interactive-action btn-chat" onClick={() => router.push(`/trabajador/chat/${sol.abogadoUid}`)}>
                            Iniciar Chat Jurídico 💬
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="empty-state">📭 No posee solicitudes registradas actualmente en la plataforma.</div>
          )}
        </div>
      </main>

      <style jsx>{`
        .container-solicitudes { min-height: 100vh; background-color: #f4f6f9; padding: 0 4%; display: flex; flex-direction: column; font-family: 'Inter', sans-serif; letter-spacing: -0.15px; }
        .topbar { height: 85px; display: flex; justify-content: space-between; align-items: center; min-height: 85px; }
        .logo-section { display: flex; align-items: center; gap: 12px; }
        .logo-main { height: 45px; }
        .brand-title { color: #002d72; font-size: 1.4rem; font-weight: 900; margin: 0; }
        .btn-volver { padding: 9px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 700; color: #475569; font-size: 0.85rem; }
        
        .main-layout { flex-grow: 1; display: flex; flex-direction: column; gap: 20px; padding-bottom: 40px; }
        .section-title { text-align: left; margin-top: 10px; }
        .section-title h2 { margin: 0; color: #0f172a; font-weight: 800; font-size: 1.4rem; }
        .section-title p { margin: 4px 0 0; color: #64748b; font-size: 0.85rem; }

        .solicitudes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
        .solicitud-card { background: white; border-radius: 20px; padding: 22px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 15px; text-align: left; box-shadow: 0 4px 10px rgba(0,0,0,0.01); }
        
        .card-header-meta { display: flex; justify-content: space-between; align-items: center; }
        .ticket-badge { font-family: monospace; font-size: 0.8rem; font-weight: 700; color: #334155; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; }
        .topsis-pill { font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; }
        .topsis-pill.critico { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        .topsis-pill.normal { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

        .card-body h4 { margin: 0 0 4px; color: #002d72; font-size: 1.1rem; font-weight: 800; }
        .txt-date { margin: 0; color: #94a3b8; font-size: 0.75rem; font-weight: 600; }
        .txt-organismo { margin: 5px 0 0 0; color: #475569; font-size: 0.82rem; }
        .descripcion-caso-box { background: #f8fafc; border: 1px solid #f1f5f9; padding: 12px; border-radius: 12px; margin-top: 8px; font-style: italic; color: #334155; font-size: 0.85rem; line-height: 1.4; }

        /* REESTRUCTURACIÓN DE ADJUNTOS COMO ENLACES REALES */
        .attachments-wrapper { display: flex; flex-direction: column; gap: 6px; margin-top: 5px; }
        .attachments-title { font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; }
        .files-container-list { display: flex; flex-wrap: wrap; gap: 6px; }
        
        .file-download-link-card { text-decoration: none; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 8px; display: flex; align-items: center; gap: 8px; max-width: 100%; box-sizing: border-box; cursor: pointer; transition: all 0.2s ease; }
        .file-download-link-card:hover { background: #e2e8f0; border-color: #002d72; }
        .disabled-file { cursor: not-allowed; opacity: 0.6; }
        
        .file-icon-mini { font-size: 0.85rem; }
        .file-name-truncate { font-size: 0.78rem; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
        .open-eye-icon { font-size: 0.78rem; color: #002d72; font-weight: bold; margin-left: 2px; }
        .no-files-txt { font-size: 0.78rem; color: #94a3b8; font-style: italic; }

        .abogado-asignado-alert-box { display: flex; align-items: center; gap: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 12px; margin-top: 5px; }
        .abogado-profile-avatar { font-size: 1.3rem; }
        .abogado-name-info { display: flex; flex-direction: column; text-align: left; }
        .abogado-name-info span { font-size: 0.7rem; color: #166534; font-weight: 600; }
        .abogado-name-info strong { font-size: 0.82rem; color: #14532d; font-weight: 800; }
        .espera-analista-box { font-size: 0.78rem; color: #64748b; font-style: italic; background: #f8fafc; padding: 8px 12px; border-radius: 10px; border: 1px dashed #cbd5e1; }

        .status-container-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed #e2e8f0; padding-top: 14px; margin-top: 5px; gap: 10px; }
        .status-info-left { display: flex; align-items: center; gap: 6px; }
        .lbl-status { font-size: 0.75rem; font-weight: 800; color: #64748b; }
        .status-badge { font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
        .status-badge.pendiente { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
        .status-badge.proceso { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .status-badge.finalizado { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

        .btn-interactive-action { border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .btn-modify { background: white; color: #002d72; border: 1px solid #002d72; }
        .btn-modify:hover { background: #f0f4fa; }
        .btn-chat { background: #002d72; color: white; }
        .btn-chat:hover { background: #001a45; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0, 45, 114, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-edit-card { background: white; padding: 30px; border-radius: 24px; border: 1px solid #e2e8f0; width: 550px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .modal-edit-card h3 { color: #002d72; font-weight: 800; font-size: 1.2rem; margin: 0 0 20px 0; }
        .edit-form-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .edit-group { display: flex; flex-direction: column; gap: 6px; }
        .edit-group label { font-size: 0.68rem; font-weight: 800; color: #002d72; letter-spacing: 0.5px; }
        .edit-group input, .edit-group select, .edit-group textarea { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 0.88rem; font-weight: 600; color: #1e293b; outline: none; }
        .edit-group textarea { height: 90px; resize: none; }
        .full-width { grid-column: 1 / -1; }
        .modal-actions-row { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
        .btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.85rem; }
        .btn-save-confirm { background: #002d72; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.85rem; box-shadow: 0 4px 10px rgba(0,45,114,0.15); }

        .empty-state { grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8; font-style: italic; background: white; border-radius: 20px; border: 1px dashed #cbd5e1; }
        @media (max-width: 600px) { .solicitudes-grid { grid-template-columns: 1fr; } .modal-edit-card { width: 90%; } .edit-form-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}