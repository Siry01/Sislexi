"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function MisSolicitudesTrabajador() {
  const router = useRouter();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalleSolicitud, setDetalleSolicitud] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formEdicion, setFormEdicion] = useState({
    tipoRequerimiento: "",
    descripcion: "",
    organismoDestino: "",
    urgencia: "",
    telefono: "",
  });

  // Helper para formatear Timestamp a String, o plain string
  const formatDate = (fecha) => {
    if (!fecha) return null;
    if (fecha.toDate) {
      return fecha.toDate().toLocaleDateString("es-VE");
    }
    if (fecha.seconds) {
      return new Date(fecha.seconds * 1000).toLocaleDateString("es-VE");
    }
    try {
      return new Date(fecha).toLocaleDateString("es-VE");
    } catch {
      return String(fecha);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "solicitudes"),
      where("trabajadorUid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((docu) => {
        const data = docu.data();
        return {
          id: docu.id,
          ...data,
          // Solo fecha de creación y fecha relevante para mostrar en card
          fechaRegistroFormateada: formatDate(data.fechaRegistro),
          fechaAceptacionFormateada: formatDate(data.fechaAceptacion),
          fechaAgendadaFormateada: formatDate(data.fechaAgendada),
          fechaFinalizacionFormateada: formatDate(data.fechaFinalizacion),
          fechaRechazoFormateada: formatDate(data.fechaRechazo),
        };
      });
      setSolicitudes(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const abrirEditor = (solicitud) => {
    setEditandoId(solicitud.id);
    setFormEdicion({
      tipoRequerimiento: solicitud.tipoRequerimiento || "",
      descripcion: solicitud.descripcion || "",
      organismoDestino: solicitud.organismoDestino || "",
      urgencia: solicitud.urgencia || "",
      telefono: solicitud.telefono || "",
    });
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      await updateDoc(doc(db, "solicitudes", editandoId), {
        ...formEdicion,
        fechaUltimaActualizacion: new Date(),
      });
      alert("Solicitud actualizada");
      setEditandoId(null);
    } catch {
      alert("Error al actualizar");
    } finally {
      setGuardando(false);
    }
  };

  const verDocumento = (archivo) => {
    const url = archivo.url || archivo.data;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else alert("No se encontró URL válida para el documento.");
  };

  const obtenerNumeroTicket = (ticket) =>
    ticket ? ticket.replace(/^SISLEXI-/, "") : "";

  const colorEstado = (estado) => {
    switch ((estado || "").toLowerCase()) {
      case "pendiente":
        return "#f59e0b";
      case "en proceso":
        return "#2563eb";
      case "agendada":
        return "#7c3aed";
      case "finalizada":
        return "#16a34a";
      case "rechazada":
        return "#dc2626";
      default:
        return "#64748b";
    }
  };

  // Para mostrar solo la fecha más relevante que se mostrará en la card junto con la creación
  const getFechaRelevanteCard = (sol) => {
    if (sol.fechaRechazoFormateada) return sol.fechaRechazoFormateada;
    if (sol.fechaFinalizacionFormateada) return sol.fechaFinalizacionFormateada;
    if (sol.fechaAgendadaFormateada) return sol.fechaAgendadaFormateada;
    if (sol.fechaAceptacionFormateada) return sol.fechaAceptacionFormateada;
    return null;
  };

  return (
    <div className="container">
      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <img src="/can.png" alt="Sislexi" className="logo" />
          <div>
            <h1>SISLEXI</h1>
            <p>Sistema Inteligente de Asesorías Legales</p>
          </div>
        </div>
        <div className="top-buttons">
          <button className="btn-back" onClick={() => router.push("/trabajador")}>
            ← Volver
          </button>
          <button
            className="btn-primary"
            onClick={() => router.push("/trabajador/solicitud")}
          >
            + Nueva Solicitud
          </button>
        </div>
      </header>

      {/* GRID */}
      <div className="grid">
        {loading ? (
          <p>Cargando solicitudes...</p>
        ) : solicitudes.length === 0 ? (
          <div className="empty">No tienes solicitudes registradas.</div>
        ) : (
          solicitudes.map((sol) => {
            const estadoMinus = (sol.estado || "").toLowerCase();
            const cerrado =
              estadoMinus === "finalizada" || estadoMinus === "rechazada";
            const fechaRelevante = getFechaRelevanteCard(sol);

            return (
              <div key={sol.id} className={`card ${cerrado ? "cerrado" : ""}`}>
                <div className="card-header">
                  <h3>
                    🎫 Número de Ticket:{" "}
                    <strong>{obtenerNumeroTicket(sol.ticket)}</strong>
                  </h3>
                  <span
                    className="estado"
                    style={{ background: colorEstado(sol.estado) }}
                  >
                    {sol.estado}
                  </span>
                </div>

                <h2>{sol.tipoRequerimiento}</h2>
                <p className="priority">
                  ⚖ Prioridad: <strong>{sol.prioridadAHP}%</strong>
                </p>
                <p>
                  🚨 Urgencia: <strong>{sol.urgencia}</strong>
                </p>
                <p>📅 Creación: {sol.fechaRegistroFormateada || "Sin fecha"}</p>
                {fechaRelevante && (
                  <p>🕒 Fecha relevante: {fechaRelevante}</p>
                )}
                <p className="description">{sol.descripcion}</p>

                {sol.tieneAbogado && sol.abogadoNombre && (
                  <div className="lawyer-box">
                    👨‍⚖️ Abogado: <strong>{sol.abogadoNombre}</strong>
                  </div>
                )}

                {estadoMinus === "finalizada" && sol.veredictoFinal && (
                  <div className="veredicto-box">
                    <h4>⚖ Veredicto Final</h4>
                    <p>{sol.veredictoFinal}</p>
                  </div>
                )}

                {estadoMinus === "rechazada" && sol.motivoRechazo && (
                  <div className="rechazo-box">
                    <h4>❌ Motivo de Rechazo</h4>
                    <p>{sol.motivoRechazo}</p>
                  </div>
                )}

                {sol.documentosAdjuntos?.length > 0 && (
                  <div className="docs-container">
                    <h4>📂 Documentos</h4>
                    {sol.documentosAdjuntos.map((doc, i) => (
                      <button
                        key={i}
                        className="doc-btn"
                        onClick={() => verDocumento(doc)}
                      >
                        📄 {doc.nombre}
                      </button>
                    ))}
                  </div>
                )}

                <div className="actions">
                  <button
                    className="btn-details"
                    onClick={() => setDetalleSolicitud(sol)}
                  >
                    Ver Detalles
                  </button>
                  {estadoMinus === "pendiente" && (
                    <button
                      className="btn-edit"
                      onClick={() => abrirEditor(sol)}
                    >
                      Modificar
                    </button>
                  )}

                  {sol.tieneAbogado &&
                    !cerrado && (
                      <button
                        className="btn-chat"
                        onClick={() => alert("Chat próximamente")}
                      >
                        Chat
                      </button>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DETALLES */}
      {detalleSolicitud && (
        <div className="overlay">
          <div className="modal">
            <h2>🎫 Número de Ticket: {obtenerNumeroTicket(detalleSolicitud.ticket)}</h2>
            <h3>{detalleSolicitud.tipoRequerimiento}</h3>

            <p>
              <strong>Estado:</strong> {detalleSolicitud.estado}
            </p>

            <p>
              <strong>Organismo:</strong> {detalleSolicitud.organismoDestino}
            </p>

            <p>
              <strong>Urgencia:</strong> {detalleSolicitud.urgencia}
            </p>

            <p>
              <strong>Descripción:</strong>
            </p>
            <div className="detail-box">{detalleSolicitud.descripcion}</div>

            {/* Mostrar Abogado */}
            {detalleSolicitud.tieneAbogado && detalleSolicitud.abogadoNombre && (
              <p>
                <strong>Abogado:</strong> {detalleSolicitud.abogadoNombre}
              </p>
            )}

            {/* Mostrar TODAS las fechas relevantes */}
            {detalleSolicitud.fechaRegistro && (
              <p>
                📅 Fecha de creación:{" "}
                {formatDate(detalleSolicitud.fechaRegistro)}
              </p>
            )}
            {detalleSolicitud.fechaAceptacion && (
              <p>
                ✅ Fecha de aceptación:{" "}
                {formatDate(detalleSolicitud.fechaAceptacion)}
              </p>
            )}
            {detalleSolicitud.fechaAgendada && (
              <p>
                📆 Fecha agendada:{" "}
                {formatDate(detalleSolicitud.fechaAgendada)}
              </p>
            )}
            {detalleSolicitud.fechaFinalizacion && (
              <p>
                🏁 Fecha finalización:{" "}
                {formatDate(detalleSolicitud.fechaFinalizacion)}
              </p>
            )}
            {detalleSolicitud.fechaRechazo && (
              <p>
                ❌ Fecha rechazo: {formatDate(detalleSolicitud.fechaRechazo)}
              </p>
            )}

            {/* Veredicto o motivo */}
            {detalleSolicitud.estado?.toLowerCase() === "finalizada" &&
              detalleSolicitud.veredictoFinal && (
                <>
                  <h4>⚖ Veredicto Final</h4>
                  <div className="veredicto-box">{detalleSolicitud.veredictoFinal}</div>
                </>
              )}

            {detalleSolicitud.estado?.toLowerCase() === "rechazada" &&
              detalleSolicitud.motivoRechazo && (
                <>
                  <h4>❌ Motivo de Rechazo</h4>
                  <div className="rechazo-box">{detalleSolicitud.motivoRechazo}</div>
                </>
              )}

            <button className="btn-close" onClick={() => setDetalleSolicitud(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {editandoId && (
        <div className="overlay">
          <div className="modal">
            <h2>Editar Solicitud</h2>
            <form onSubmit={guardarCambios} className="form">
              <input
                type="text"
                placeholder="Tipo de requerimiento"
                value={formEdicion.tipoRequerimiento}
                onChange={(e) =>
                  setFormEdicion({ ...formEdicion, tipoRequerimiento: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Organismo destino"
                value={formEdicion.organismoDestino}
                onChange={(e) =>
                  setFormEdicion({ ...formEdicion, organismoDestino: e.target.value })
                }
              />
              <select
                value={formEdicion.urgencia}
                onChange={(e) =>
                  setFormEdicion({ ...formEdicion, urgencia: e.target.value })
                }
              >
                <option value="">Seleccione</option>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
              <input
                type="text"
                placeholder="Teléfono"
                value={formEdicion.telefono}
                onChange={(e) =>
                  setFormEdicion({ ...formEdicion, telefono: e.target.value })
                }
              />
              <textarea
                rows="5"
                placeholder="Descripción"
                value={formEdicion.descripcion}
                onChange={(e) =>
                  setFormEdicion({ ...formEdicion, descripcion: e.target.value })
                }
              />
              <div className="actions-form">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditandoId(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
      <style jsx>{`
        .container {
          min-height: 100vh;
          background: #f0f4f9;
          padding: 30px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1e293b;
        }

        .topbar {
          background: #004a99;
          border-radius: 20px;
          padding: 25px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          color: #fff;
          box-shadow: 0 4px 20px rgba(0, 74, 153, 0.3);
        }

        .brand {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .logo {
          width: 70px;
          filter: drop-shadow(0 0 6px #ffd700);
        }

        .brand h1 {
          font-size: 2rem;
          font-weight: 900;
          margin: 0;
          color: #ffd700;
          text-shadow: 1px 1px 6px #ffaa00;
        }

        .brand p {
          margin: 0;
          font-weight: 600;
          font-size: 1rem;
          color: #e0e0e0;
        }

        .top-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-primary,
        .btn-back {
          border: none;
          padding: 14px 22px;
          border-radius: 22px;
          cursor: pointer;
          font-weight: 700;
          font-size: 1rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          transition: background 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 16px rgba(0,74,153,0.5);
        }

        .btn-primary {
          background: #ffd700;
          color: #004a99;
        }

        .btn-primary:hover,
        .btn-primary:focus {
          background: #ffec7a;
          box-shadow: 0 6px 20px #ffec7aaa;
          outline: none;
        }

        .btn-back {
          background: #1e40af;
          color: white;
          box-shadow: 0 4px 16px #1e40afcc;
        }

        .btn-back:hover,
        .btn-back:focus {
          background: #1e3a8a;
          box-shadow: 0 6px 20px #1e3a8acc;
          outline: none;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 26px;
        }

        .card {
          background: linear-gradient(145deg, #ffffff, #d5e6ff);
          border-radius: 25px;
          padding: 28px 32px 36px 32px;
          box-shadow:
            8px 8px 20px rgba(0, 74, 153, 0.15),
            -8px -8px 20px rgba(255, 255, 255, 0.9);
          position: relative;
          display: flex;
          flex-direction: column;
          color: #003366;
          font-weight: 600;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          user-select: text;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow:
            12px 12px 28px rgba(0, 74, 153, 0.3),
            -12px -12px 28px rgba(255, 255, 255, 1);
          z-index: 3;
        }

        .card.cerrado {
          background: #f7f9fc;
          color: #64748b;
          box-shadow: inset 2px 2px 10px #cbd5e135;
          user-select: none;
        }

        .card.cerrado:hover {
          cursor: default;
          transform: none;
          box-shadow: inset 2px 2px 10px #cbd5e135;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 1.15rem;
          user-select: none;
        }

        .card-header h3 {
          font-weight: 800;
          letter-spacing: 0.03em;
          user-select: text;
        }

        .estado {
          color: white;
          padding: 8px 18px;
          border-radius: 22px;
          font-size: 13px;
          font-weight: bold;
          box-shadow: 0 1px 8px rgb(0 0 0 / 0.2);
          user-select: none;
          text-transform: capitalize;
        }

        .priority {
          background: #eff6ff;
          padding: 12px;
          border-radius: 16px;
          color: #1d4ed8;
          font-weight: 700;
          margin: 12px 0;
          user-select: none;
        }

        h2 {
          margin: 18px 0 14px 0;
          font-weight: 900;
          font-size: 1.25rem;
          color: #004a99;
          letter-spacing: 0.02em;
        }

        p {
          margin: 6px 0;
          line-height: 1.4;
          user-select: text;
          font-size: 1rem;
          color: #344054;
        }

        .description {
          background: #f0f5ff;
          padding: 16px;
          border-radius: 16px;
          margin-top: 8px;
          color: #1e40af;
          font-weight: 600;
          user-select: text;
        }

        .dates p {
          font-size: 0.93rem;
          font-weight: 600;
          color: #64748b;
          margin: 3px 0;
          user-select: none;
        }

        .lawyer-box,
        .veredicto-box,
        .rechazo-box,
        .docs-container {
          margin-top: 22px;
          padding: 18px 22px;
          background: #e5edff;
          border-radius: 18px;
          box-shadow: inset 0 0 10px #a1b9ffab;
          font-weight: 700;
          font-size: 1rem;
          color: #003366;
          user-select: text;
        }

        .rechazo-box {
          background: #ffe7e7;
          box-shadow: inset 0 0 10px #fca5a5bb;
          color: #991b1b;
        }

        .docs-container h4 {
          margin-bottom: 12px;
          font-weight: 800;
          font-size: 1.05rem;
          color: #003366;
          user-select: none;
        }

        .doc-btn {
          width: 100%;
          margin-top: 10px;
          border: none;
          background: #147ade;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          padding: 12px 18px;
          border-radius: 18px;
          cursor: pointer;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          user-select: none;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: 0 6px 24px rgba(20, 122, 222, 0.45);
        }

        .doc-btn:hover,
        .doc-btn:focus {
          background: #0f6bca;
          box-shadow: 0 8px 30px rgba(15, 107, 202, 0.75);
          outline: none;
        }

        .actions {
          display: flex;
          gap: 14px;
          margin-top: 24px;
          flex-wrap: wrap;
          user-select: none;
          justify-content: center;
        }

        .actions button {
          flex: 1 1 140px;
          border: none;
          border-radius: 22px;
          padding: 14px 0;
          cursor: pointer;
          font-weight: 700;
          font-size: 1.1rem;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          transition: background-color 0.3s ease, box-shadow 0.3s ease,
            transform 0.25s ease;
          box-shadow: 0 6px 20px rgb(0 0 0 / 0.15);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .actions button:active {
          transform: scale(0.95);
        }

        .btn-edit {
          background: #d97706;
          box-shadow: 0 6px 20px #d9770600, 0 0 38px #d97706bb;
        }

        .btn-edit:hover,
        .-edit:focus {
          background: #b45309;
          box-shadow: 0 7px 26px #b45309cc, 0 0 46px #b45309cc;
          outline: none;
        }

        .btn-chat {
          background: #7c3aed;
          box-shadow: 0 6px 22px #7c3aedbb;
        }

        .btn-chat:hover,
        .btn-chat:focus {
          background: #5b21b6;
          box-shadow: 0 8px 28px #5b21b6cc;
          outline: none;
        }

        .btn-details {
          background: #1e40af;
          box-shadow: 0 6px 22px #1e40afbb;
        }

        .btn-details:hover,
        .btn-details:focus {
          background: #1e3a8a;
          box-shadow: 0 8px 28px #1e3a8acc;
          outline: none;
        }

        /* Overlay y modales */

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.52);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1100;
          user-select: none;
          padding: 16px;
        }

        .modal {
          background: white;
          width: 100%;
          max-width: 640px;
          padding: 36px 44px;
          border-radius: 28px;
          box-shadow: 0 14px 48px rgba(0, 0, 0, 0.28);
          max-height: 90vh;
          overflow-y: auto;
          color: #1e293b;
          user-select: text;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          animation: modalFadeIn 0.35s ease forwards;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal h2 {
          margin-top: 0;
          margin-bottom: 32px;
          font-weight: 900;
          color: #004a99;
          font-size: 2rem;
          user-select: text;
          letter-spacing: 0.04em;
        }

        .modal h3 {
          color: #004a99;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .modal h4 {
          margin-top: 24px;
          font-weight: 700;
          font-size: 1.2rem;
          color: #004a99;
        }

        .modal p {
          margin: 14px 0;
          font-size: 1.1rem;
          line-height: 1.6;
          font-weight: 600;
        }

        .detail-box {
          background: #f0f5ff;
          padding: 18px 24px;
          border-radius: 22px;
          color: #003366;
          font-weight: 600;
          user-select: text;
          box-shadow: 0 4px 14px #9fc9ffcc;
          white-space: pre-wrap;
        }

        .veredicto-box {
          background: #dbe9ff;
          border-radius: 22px;
          padding: 18px 24px;
          margin-top: 12px;
          font-size: 1.05rem;
          color: #003366;
          font-weight: 700;
          box-shadow: 0 4px 16px #a1b9ffbb;
          white-space: pre-wrap;
        }

        .rechazo-box {
          background: #ffe7e7;
          color: #8a1b1b;
          border-radius: 22px;
          padding: 18px 24px;
          margin-top: 12px;
          font-size: 1.05rem;
          font-weight: 700;
          box-shadow: 0 4px 16px #fca5a5bb;
          white-space: pre-wrap;
        }

        /* Formulario edición */

        .form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 10px;
        }

        input,
        textarea,
        select {
          padding: 16px 20px;
          border-radius: 24px;
          border: 2px solid #a5b4fc;
          font-size: 1.1rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          transition: border-color 0.3s ease;
          box-shadow: inset 0 0 8px #bbc9ffcc;
          user-select: text;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 16px #3b82f6aa;
        }

        .actions-form {
          display: flex;
          gap: 16px;
        }

        .btn-cancel,
        .btn-save,
        .btn-close {
          border: none;
          padding: 14px 40px;
          border-radius: 28px;
          color: white;
          cursor: pointer;
          font-weight: 700;
          font-size: 1.15rem;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          user-select: none;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          flex: 1;
        }

        .btn-cancel {
          background: #64748b;
          box-shadow: 0 5px 20px #64748bcc;
        }

        .btn-cancel:hover,
        .btn-cancel:focus {
          background: #475569;
          outline: none;
          box-shadow: 0 7px 28px #475569cc;
        }

        .btn-save {
          background: #004a99;
          box-shadow: 0 7px 25px #004a99cc;
        }

        .btn-save:hover,
        .btn-save:focus {
          background: #003366;
          outline: none;
          box-shadow: 0 10px 35px #003366cc;
        }

        .btn-close {
          background: #dc2626;
          margin-top: 28px;
          box-shadow: 0 7px 28px #dc2626cc;
          width: 100%;
        }

        .btn-close:hover,
        .btn-close:focus {
          background: #991b1b;
          outline: none;
          box-shadow: 0 10px 36px #991b1bcc;
        }
      `}</style>
    </div>
  );
}
