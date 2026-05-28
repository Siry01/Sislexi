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
  serverTimestamp,
} from "firebase/firestore";

export default function BandejaAbogado() {
  const router = useRouter();

  const [tabActual, setTabActual] = useState("disponibles");
  const [solicitudesDisponibles, setSolicitudesDisponibles] = useState([]);
  const [misCasos, setMisCasos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [detalleCaso, setDetalleCaso] = useState(null);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [tipoCierre, setTipoCierre] = useState("");
  const [textoCierre, setTextoCierre] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const qDisponibles = query(collection(db, "solicitudes"), where("estado", "==", "pendiente"));
    const qMisCasos = query(collection(db, "solicitudes"), where("abogadoUid", "==", user.uid));

    const unsubDisponibles = onSnapshot(qDisponibles, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSolicitudesDisponibles(docs);
    });

    const unsubMisCasos = onSnapshot(qMisCasos, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMisCasos(docs);
    });

    return () => {
      unsubDisponibles();
      unsubMisCasos();
    };
  }, []);

  const limpiarTicket = (ticket) => ticket?.replace(/^SISLEXI-/, "") || "";

  const tomarSolicitud = async (idSolicitud) => {
    try {
      const abogado = auth.currentUser;
      if (!abogado) {
        alert("No se pudo identificar al abogado.");
        return;
      }
      await updateDoc(doc(db, "solicitudes", idSolicitud), {
        abogadoUid: abogado.uid,
        abogadoNombre: abogado.displayName || "Abogado SISLEXI",
        tieneAbogado: true,
        estado: "en proceso",
        fechaAceptacion: serverTimestamp(),
        fechaUltimaActualizacion: serverTimestamp(),
      });
      alert("Solicitud tomada correctamente");
    } catch (error) {
      console.error(error);
      alert("Error al tomar solicitud");
    }
  };

  const agendarCita = async (idSolicitud) => {
    try {
      await updateDoc(doc(db, "solicitudes", idSolicitud), {
        estado: "agendada",
        fechaAgendada: serverTimestamp(),
        fechaUltimaActualizacion: serverTimestamp(),
      });
      alert("Cita agendada correctamente");
    } catch (error) {
      console.error(error);
      alert("Error al agendar cita");
    }
  };

  const cerrarCaso = async () => {
    if (!casoSeleccionado) return;

    if (!textoCierre.trim()) {
      alert("Debes escribir una respuesta");
      return;
    }

    const datos =
      tipoCierre === "finalizar"
        ? {
            estado: "finalizada",
            veredictoFinal: textoCierre,
            fechaFinalizacion: serverTimestamp(),
            fechaUltimaActualizacion: serverTimestamp(),
          }
        : {
            estado: "rechazada",
            motivoRechazo: textoCierre,
            fechaRechazo: serverTimestamp(),
            fechaUltimaActualizacion: serverTimestamp(),
          };

    try {
      await updateDoc(doc(db, "solicitudes", casoSeleccionado.id), datos);

      alert(tipoCierre === "finalizar" ? "Caso finalizado" : "Caso rechazado");

      setMostrarModalCerrar(false);
      setTextoCierre("");
      setCasoSeleccionado(null);
    } catch (error) {
      console.error(error);
      alert("Error al cerrar el caso");
    }
  };

  const diasTranscurridos = (fecha) => {
    if (!fecha) return 0;
    const fechaCaso = fecha.toDate ? fecha.toDate() : new Date(fecha);
    const hoy = new Date();
    const diferencia = hoy - fechaCaso;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  };

  const lista = tabActual === "disponibles" ? solicitudesDisponibles : misCasos;

  const filtradas = lista.filter(
    (s) =>
      s.ticket?.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.nombreTrabajador?.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.cedula?.toString().includes(busqueda) ||
      s.p00?.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.tipoRequerimiento?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container">
      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <img src="/can.png" alt="Sislexi" />
          <div>
            <h1>SISLEXI</h1>
            <p>Bandeja Legal del Abogado</p>
          </div>
        </div>
        <button className="btn-back" onClick={() => router.push("/abogado")}>← Volver</button>
      </header>

      {/* TABS */}
      <div className="tabs" role="tablist" aria-label="Opciones de bandeja">
        <button
          role="tab"
          aria-selected={tabActual === "disponibles"}
          className={tabActual === "disponibles" ? "active" : ""}
          onClick={() => setTabActual("disponibles")}
          aria-controls="panel-disponibles"
          id="tab-disponibles"
        >
          📥 Solicitudes Disponibles ({solicitudesDisponibles.length})
        </button>

        <button
          role="tab"
          aria-selected={tabActual === "mis-casos"}
          className={tabActual === "mis-casos" ? "active" : ""}
          onClick={() => setTabActual("mis-casos")}
          aria-controls="panel-mis-casos"
          id="tab-mis-casos"
        >
          ⚖ Mis Casos ({misCasos.length})
        </button>
      </div>

      {/* BUSCADOR */}
      <input
        type="text"
        placeholder="Buscar..."
        className="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        aria-label="Buscar solicitudes o casos"
      />

      {/* GRID */}
      <div
        className="grid"
        role="tabpanel"
        id={`panel-${tabActual}`}
        aria-labelledby={`tab-${tabActual}`}
      >
        {filtradas.length === 0 && (
          <p className="no-results">No se encontraron resultados.</p>
        )}

        {filtradas.map((s) => {
          const cerrado = ["finalizada", "rechazada"].includes(s.estado);

          return (
            <div
              key={s.id}
              className={`card ${cerrado ? "cerrado" : ""}`}
              tabIndex="0"
              aria-label={`Caso ${s.ticket} - Estado ${s.estado}`}
            >
              <div className="header-card">
                <span
                  className="ticket"
                  title="Número de ticket"
                  aria-label="Número de ticket"
                >
                  🎫 {limpiarTicket(s.ticket)}
                </span>

                <span
                  className={`estado ${s.estado}`}
                  aria-label={`Estado: ${s.estado}`}
                >
                  {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                </span>
              </div>

              <h2 title="Tipo de requerimiento">📋 {s.tipoRequerimiento}</h2>

              <p>🚨 Urgencia: <strong>{s.urgencia}</strong></p>
              <p>👤 {s.nombreTrabajador}</p>
              <p>🪪 V-{s.cedula}</p>
              <p>🔑 {s.p00}</p>

              <p className="descripcion">{s.descripcion}</p>

              <p className="days" title="Días transcurridos desde registro">
                ⏳ {diasTranscurridos(s.fechaRegistro)} días
              </p>

              {/* Documentos */}
              {s.documentosAdjuntos?.length > 0 && (
                <div
                  className="docs-box"
                  aria-label={`Documentos adjuntos (${s.documentosAdjuntos.length})`}
                >
                  <h4>📂 Documentos</h4>

                  {s.documentosAdjuntos.map((docu, index) => (
                    <button
                      key={index}
                      className="doc-btn"
                      onClick={() => window.open(docu.url, "_blank")}
                      aria-label={`Abrir documento ${docu.nombre}`}
                      title={`Abrir documento ${docu.nombre}`}
                      type="button"
                    >
                      📄 {docu.nombre}
                    </button>
                  ))}
                </div>
              )}

              {/* Motivo o Veredicto */}
              {cerrado && s.veredictoFinal && (
                <div className="veredicto-box">
                  <h4>⚖️ Veredicto Legal</h4>
                  <p>{s.veredictoFinal}</p>
                </div>
              )}

              {cerrado && s.motivoRechazo && (
                <div className="rechazo-box">
                  <h4>❌ Motivo de Rechazo</h4>
                  <p>{s.motivoRechazo}</p>
                </div>
              )}

              <div className="actions">
                <button
                  className="btn-details"
                  onClick={() => setDetalleCaso(s)}
                  type="button"
                  title="Ver Perfil Completo"
                  aria-label={`Ver perfil completo: ${s.nombreTrabajador}`}
                >
                  👁 Ver Perfil
                </button>

                {!cerrado && tabActual === "disponibles" && (
                  <button
                    className="btn-take"
                    onClick={() => tomarSolicitud(s.id)}
                    type="button"
                    title="Tomar Solicitud"
                    aria-label={`Tomar solicitud ${s.ticket}`}
                  >
                    📥 Tomar Solicitud
                  </button>
                )}

                {!cerrado && tabActual === "mis-casos" && (
                  <>
                    <button
                      className="btn-chat"
                      onClick={() => alert("Chat próximamente")}
                      type="button"
                      title="Abrir Chat"
                      aria-label={`Abrir chat del caso ${s.ticket}`}
                    >
                      💬 Chat
                    </button>

                    <button
                      className="btn-schedule"
                      onClick={() => agendarCita(s.id)}
                      type="button"
                      title="Agendar Cita"
                      aria-label={`Agendar cita para caso ${s.ticket}`}
                    >
                      📆 Agendar
                    </button>

                    <button
                      className="btn-finish"
                      onClick={() => {
                        setCasoSeleccionado(s);
                        setTipoCierre("finalizar");
                        setMostrarModalCerrar(true);
                      }}
                      type="button"
                      title="Finalizar Caso"
                      aria-label={`Finalizar caso ${s.ticket}`}
                    >
                      ✅ Finalizar
                    </button>

                    <button
                      className="btn-reject"
                      onClick={() => {
                        setCasoSeleccionado(s);
                        setTipoCierre("rechazar");
                        setMostrarModalCerrar(true);
                      }}
                      type="button"
                      title="Rechazar Caso"
                      aria-label={`Rechazar caso ${s.ticket}`}
                    >
                      ❌ Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PERFIL */}
      {detalleCaso && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalPerfilTitle"
        >
          <div className="modal">
            <h2 id="modalPerfilTitle">👤 Perfil Completo</h2>

            <p>
              <strong>Nombre:</strong> {detalleCaso.nombreTrabajador}
            </p>
            <p>
              <strong>Cédula:</strong> V-{detalleCaso.cedula}
            </p>
            <p>
              <strong>Departamento:</strong> {detalleCaso.departamento}
            </p>
            <p>
              <strong>Cargo:</strong> {detalleCaso.cargo}
            </p>
            <p>
              <strong>Tipo:</strong> {detalleCaso.tipoRequerimiento}
            </p>
            <p>
              <strong>Urgencia:</strong> {detalleCaso.urgencia}
            </p>

            <p>
              <strong>Descripción:</strong>
            </p>
            <div className="description-box">{detalleCaso.descripcion}</div>

            <h3>📅 Fechas importantes</h3>
            {detalleCaso.fechaRegistro && (
              <p>
                <strong>Fecha registro:</strong>{" "}
                {detalleCaso.fechaRegistro.toDate().toLocaleString()}
              </p>
            )}
            {detalleCaso.fechaAceptacion && (
              <p>
                <strong>Fecha aceptación:</strong>{" "}
                {detalleCaso.fechaAceptacion.toDate().toLocaleString()}
              </p>
            )}
            {detalleCaso.fechaAgendada && (
              <p>
                <strong>Fecha agendada:</strong>{" "}
                {detalleCaso.fechaAgendada.toDate().toLocaleString()}
              </p>
            )}
            {detalleCaso.fechaFinalizacion && (
              <p>
                <strong>Fecha finalización:</strong>{" "}
                {detalleCaso.fechaFinalizacion.toDate().toLocaleString()}
              </p>
            )}
            {detalleCaso.fechaRechazo && (
              <p>
                <strong>Fecha rechazo:</strong>{" "}
                {detalleCaso.fechaRechazo.toDate().toLocaleString()}
              </p>
            )}

            {detalleCaso.tieneAbogado && detalleCaso.abogadoNombre && (
              <p>
                <strong>Abogado asignado:</strong> {detalleCaso.abogadoNombre}
              </p>
            )}

            {detalleCaso.estado === "finalizada" && detalleCaso.veredictoFinal && (
              <>
                <h3>⚖️ Veredicto Legal</h3>
                <div className="description-box veredicto-modal">
                  {detalleCaso.veredictoFinal}
                </div>
              </>
            )}

            {detalleCaso.estado === "rechazada" && detalleCaso.motivoRechazo && (
              <>
                <h3>❌ Motivo de Rechazo</h3>
                <div className="description-box rechazo-modal">
                  {detalleCaso.motivoRechazo}
                </div>
              </>
            )}

            <button
              className="close-btn"
              onClick={() => setDetalleCaso(null)}
              type="button"
              aria-label="Cerrar perfil completo"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL CIERRE */}
      {mostrarModalCerrar && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalCerrarTitle"
        >
          <div className="modal">
            <h2 id="modalCerrarTitle">
              {tipoCierre === "finalizar" ? "Finalizar Caso" : "Rechazar Caso"}
            </h2>
            <textarea
              rows={6}
              placeholder={
                tipoCierre === "finalizar"
                  ? "Escribe el veredicto legal..."
                  : "Escribe el motivo del rechazo..."
              }
              value={textoCierre}
              onChange={(e) => setTextoCierre(e.target.value)}
              aria-label={
                tipoCierre === "finalizar" ? "Veredicto legal" : "Motivo del rechazo"
              }
            />
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setMostrarModalCerrar(false)}
                type="button"
                aria-label="Cancelar cierre de caso"
              >
                Cancelar
              </button>
              <button
                className="save-btn"
                onClick={cerrarCaso}
                type="button"
                aria-label="Guardar cierre de caso"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .descripcion {
          background: #f0f5ff;
          padding: 12px 15px;
          border-radius: 12px;
          color: #1e40af;
          font-weight: 600;
          margin: 12px 0;
          white-space: pre-line;
        }
        .veredicto-box {
          background: #dbe9ff;
          border-left: 5px solid #004a99;
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 12px;
          color: #004a99;
          font-weight: 600;
          white-space: pre-line;
        }
        .rechazo-box {
          background: #ffe7e7;
          border-left: 5px solid #dc2626;
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 12px;
          color: #b91c1c;
          font-weight: 600;
          white-space: pre-line;
        }
        .actions {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
        }
        .actions button {
          flex: 1 1 130px;
          padding: 12px 6px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          user-select: none;
          transition: background-color 0.3s;
        }
        .btn-details { background: #1e40af; }
        .btn-take { background: #16a34a; }
        .btn-chat { background: #7c3aed; }
        .btn-schedule { background: #2563eb; }
        .btn-finish { background: #16a34a; }
        .btn-reject { background: #dc2626; }
        .actions button:hover { filter: brightness(0.9); }
        /* Modales y otros estilos debes agregar según tu estilo base */
     

  
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap");

        /* Container and base styles */
        .container {
          min-height: 100vh;
          background: #f0f4f9;
          padding: 30px;
          font-family: "Inter", Arial, sans-serif;
          color: #1e293b;
          user-select: none;
        }

        /* Topbar */
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #004a99; /* CANTV blue base */
          padding: 20px 30px;
          border-radius: 18px;
          margin-bottom: 30px;
          box-shadow: 0 4px 14px rgba(0, 74, 153, 0.3);
          user-select: none;
          color: #fff;
        }

        .brand {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .brand img {
          width: 70px;
          height: auto;
          filter: drop-shadow(0 0 6px #ffd700);
        }

        .brand h1 {
          font-size: 2rem;
          font-weight: 900;
          margin: 0;
          color: #ffd700;
          text-shadow: 1px 1px 6px #ffaa00        }

        .brand p {
          margin: 0;
          font-weight: 600;
          font-size: 1rem;
          color: #e0e0e0;
        }

        .btn-back {
          background: rgba(255 255 255 / 0.15);
          border: none;
          font-size: 1.12rem;
          cursor: pointer;
          padding: 10px 18px;
          border-radius: 14px;
          color: #ffd700;
          font-weight: 700;
          transition: background-color 0.3s ease, color 0.3s ease;
          user-select: none;
          box-shadow: 0 0 10px #ffd700aa;
        }

        .btn-back:hover,
        .btn-back:focus {
          background-color: #ffd700;
          color: #004a99;
          outline: none;
          box-shadow: 0 0 15px #ffd700ff;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 14px;
          margin-bottom: 30px;
          user-select: none;
        }

        .tabs button {
          border: none;
          padding: 14px 28px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 700;
          font-size: 1.1rem;
          background: #e0e7ff;
          color: #1e40af;
          box-shadow: 0 3px 8px rgba(59, 130, 246, 0.3);
          transition: background-color 0.35s ease, color 0.35s ease, box-shadow 0.35s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          user-select: none;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .tabs button.active,
        .tabs button:focus-visible {
          background: linear-gradient(135deg, #004a99, #0077cc);
          color: #fff;
          box-shadow: 0 8px 20px #005fa3cc;
          outline: none;
          transform: translateY(-2px);
        }

        /* Search */
        .search {
          width: 100%;
          padding: 16px 20px;
          border-radius: 22px;
          border: 2px solid #cbd5e1;
          margin-bottom: 34px;
          font-size: 1.1rem;
          font-weight: 500;
          color: #1e293b;
          transition: border-color 0.3s ease;
          user-select: text;
          box-shadow: 0 2px 8px rgb(0 0 0 / 0.07);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .search:focus {
          border-color: #004a99;
          outline: none;
          box-shadow: 0 0 12px #0077ffaa;
        }

        /* Grid */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(390px, 1fr));
          gap: 30px;
        }

        .no-results {
          font-style: italic;
          color: #64748b;
          font-weight: 600;
          grid-column: 1/-1;
          text-align: center;
          user-select: none;
        }

        /* Card */
        .card {
          background: linear-gradient(145deg, #ffffff, #d5e6ff);
          border-radius: 25px;
          padding: 28px 32px 36px 32px;
          box-shadow:
            8px 8px 20px rgba(0, 74, 153, 0.15),
            -8px -8px 20px rgba(255, 255, 255, 0.9);
          position: relative;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
          display: flex;
          flex-direction: column;
          user-select: text;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow:
            12px 12px 28px rgba(0, 74, 153, 0.3),
            -12px -12px 28px rgba(255, 255, 255, 1);
          z-index: 3;
        }

        /* Card cerrado - modo lectura */
        .card.cerrado {
          background: #f7f9fc;
          color: #718096;
          box-shadow: inset 2px 2px 10px #cbd5e135;
          user-select: none;
        }

        .card.cerrado:hover {
          transform: none;
          box-shadow: inset 2px 2px 10px #cbd5e135;
          cursor: default;
        }

        /* Header Card */
        .header-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          user-select: none;
        }

        .ticket {
          font-weight: 700;
          font-size: 1.18rem;
          color: #003366;
          user-select: text;
          letter-spacing: 0.03em;
          text-shadow: 0 0 2px #a9c7ff;
        }

        .estado {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.95rem;
          text-transform: capitalize;
          user-select: none;
          transition: background-color 0.3s ease, color 0.2s ease;
          min-width: 90px;
          text-align: center;
          box-shadow: 0 1px 12px rgb(0 0 0 / 0.12);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .estado.pendiente {
          background: #fef3c7;
          color: #78350f;
          box-shadow: 0 0 15px #fef3c7bb;
        }

        .estado.en\\ proceso {
          background: #93c5fd;
          color: #1e40af;
          box-shadow: 0 0 15px #93c5fdbb;
        }

        .estado.agendada {
          background: #3b82f6;
          color: #eff6ff;
          box-shadow: 0 0 15px #3b82f6bb;
        }

        .estado.finalizada {
          background: #cbd5e1;
          color: #475569;
          font-style: italic;
          box-shadow: inset 0 0 10px #9ca3afaa;
        }

        .estado.rechazada {
          background: #fca5a5;
          color: #7f1d1d;
          box-shadow: inset 0 0 10px #f8717188;
        }

        /* Titles and texts */
        h2 {
          margin: 10px 0 20px 0;
          font-size: 1.35rem;
          color: #003366;
          font-weight: 800;
          user-select: text;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        h2::before {
          content: "📋";
          font-size: 1.5rem;
        }

        .priority {
          font-size: 1.05rem;
          margin-bottom: 16px;
          color: #1e40af;
          font-weight: 700;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        p {
          margin: 6px 0;
          font-size: 1rem;
          color: #334155;
          line-height: 1.5;
          user-select: text;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        p strong {
          color: #1e40af;
          min-width: 110px;
          display: inline-block;
        }

        .days {
          margin-top: 18px;
          font-weight: 700;
          color: #64748b;
          user-select: none;
          text-align: right;
          font-size: 0.94rem;
        }

        /* Documentos */
        .docs-box {
          margin-top: 26px;
          background: #d1e7ff;
          padding: 18px 22px;
          border-radius: 20px;
          user-select: none;
          box-shadow: inset 2px 2px 6px #afd6ff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .docs-box h4 {
          margin: 0 0 14px 0;
          font-weight: 900;
          color: #004a99;
          user-select: none;
          letter-spacing: 0.04em;
          font-size: 1.15rem;
        }

        .doc-btn {
          background: #0077cc;
          border: none;
          color: white;
          border-radius: 14px;
          padding: 10px 22px;
          margin-right: 10px;
          margin-bottom: 10px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 14px rgb(0 119 204 / 0.75);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .doc-btn:hover,
        .doc-btn:focus {
          background: #005fa3;
          outline: none;
          box-shadow: 0 6px 20px rgb(0 95 163 / 1);
        }

        /* Veredicto y rechazo (modo lectura) */
        .veredicto-box,
        .rechazo-box {
          background: #e0ebff;
          border-left: 6px solid #004a99;
          border-radius: 12px;
          padding: 14px 20px;
          margin: 20px 0 0 0;
          font-size: 1rem;
          line-height: 1.5;
          color: #1e40af;
          box-shadow: 0 2px 14px rgb(0 74 153 / 0.12);
        }

        .rechazo-box {
          background: #ffe6e6;
          border-left-color: #dc2626;
          color: #991b1b;
          box-shadow: 0 2px 14px rgb(220 38 38 / 0.15);
        }

        /* Actions buttons */
        .actions {
          margin-top: auto;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          user-select: none;
          justify-content: center;
          padding-top: 14px;
          border-top: 1px solid #cbd5e1aa;
        }

        .actions button {
          flex: 1 1 140px;
          border: none;
          border-radius: 22px;
          padding: 14px 0;
          cursor: pointer;
          font-weight: 700;
          font-size: 1.05rem;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          transition: background-color 0.3s ease, box-shadow 0.3s ease,
            transform 0.25s ease;
          box-shadow: 0 4px 18px rgb(0 0 0 / 0.12);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          user-select: none;
        }

        .actions button:active {
          transform: scale(0.96);
        }

        .btn-take {
          background: linear-gradient(135deg, #16a34a, #22c55e);
          box-shadow: 0 6px 22px rgb(16 185 129 / 0.7);
        }

        .btn-take:hover,
        .btn-take:focus {
          background: linear-gradient(135deg, #15803d, #16a34a);
          outline: none;
          box-shadow: 0 8px 28px rgb(21 128 61 / 0.9);
        }

        .btn-chat {
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          box-shadow: 0 6px 22px rgb(139 92 246 / 0.7);
        }

        .btn-chat:hover,
        .btn-chat:focus {
          background: linear-gradient(135deg, #5b21b6, #7c3aed);
          outline: none;
          box-shadow: 0 8px 28px rgb(91 33 182 / 0.9);
        }

        .btn-schedule {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          box-shadow: 0 6px 22px rgb(59 130 246 / 0.7);
        }

        .btn-schedule:hover,
        .btn-schedule:focus {
          background: linear-gradient(135deg, #1e40af, #2563eb);
          outline: none;
          box-shadow: 0 8px 28px rgb(30 64 175 / 0.9);
        }

        .btn-finish {
          background: linear-gradient(135deg, #16a34a, #22c55e);
          box-shadow: 0 6px 22px rgb(16 185 129 / 0.7);
        }

        .btn-finish:hover,
        .btn-finish:focus {
          background: linear-gradient(135deg, #15803d, #16a34a);
          outline: none;
          box-shadow: 0 8px 28px rgb(21 128 61 / 0.9);
        }

        .btn-reject {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          box-shadow: 0 6px 22px rgb(239 68 68 / 0.7);
        }

        .btn-reject:hover,
        .btn-reject:focus {
          background: linear-gradient(135deg, #b91c1c, #dc2626);
          outline: none;
          box-shadow: 0 8px 28px rgb(185 28 28 / 0.9);
        }

        .btn-details {
          background: linear-gradient(135deg, #1e40af, #2563eb);
          box-shadow: 0 6px 22px rgb(37 99 235 / 0.7);
        }

        .btn-details:hover,
        .btn-details:focus {
          background: linear-gradient(135deg, #1e3a8a, #1e40af);
          outline: none;
          box-shadow: 0 8px 28px rgb(30 58 138 / 0.9);
        }

        /* Modales */

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
          max-width: 620px;
          padding: 36px 40px;
          border-radius: 28px;
          box-shadow: 0 14px 48px rgba(0, 0, 0, 0.28);
          max-height: 90vh;
          overflow-y: auto;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          color: #1e293b;
          user-select: text;
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
          margin-bottom: 14px;
        }

        .modal p {
          margin: 14px 0;
          font-size: 1.1rem;
          line-height: 1.6;
          font-weight: 600;
        }

        .description-box {
          background: #f5faff;
          border-radius: 18px;
          border: 1.5px solid #bbd7ff;
          padding: 18px 24px;
          margin: 16px 0 28px 0;
          white-space: pre-wrap;
          font-size: 1.05rem;
          color: #003366;
          user-select: text;
          box-shadow: 0 4px 14px #9fc9ffcc;
        }

        .description-box.veredicto-modal {
          border-color: #004a99;
          background: #dbe9ff;
        }

        .description-box.rechazo-modal {
          border-color: #dc2626;
          background: #ffe7e7;
          color: #8a1b1b;
        }

        textarea {
          resize: vertical;
          width: 100%;
          padding: 18px 20px;
          border-radius: 24px;
          border: 2px solid #a5b4fc;
          font-size: 1.1rem;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          transition: border-color 0.3s ease;
          min-height: 150px;
          box-shadow: inset 0 0 8px #bbc9ffcc;
          user-select: text;
        }

        textarea:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 16px #3b82f6aa;
        }

        .modal-actions {
          margin-top: 28px;
          display: flex;
          justify-content: flex-end;
          gap: 18px;
        }

        .cancel-btn,
        .save-btn {
          border: none;
          font-weight: 700;
          font-size: 1.1rem;
          border-radius: 24px;
          padding: 14px 32px;
          cursor: pointer;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          user-select: none;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: 0 5px 20px rgb(0 0 0 / 0.15);
        }

        .cancel-btn {
          background: #e2e8f0;
          color: #475569;
        }

        .cancel-btn:hover,
        .cancel-btn:focus {
          background: #cbd5e1;
          outline: none;
          box-shadow: 0 8px 28px rgb(108 122 139 / 0.7);
        }

        .save-btn {
          background: #004a99;
          color: white;
          box-shadow: 0 7px 30px #004a99bb;
        }

        .save-btn:hover,
        .save-btn:focus {
          background: #003366;
          outline: none;
          box-shadow: 0 10px 36px #003366cc;
        }

        /* Botón cerrar modal perfil */

        .close-btn {
          margin-top: 26px;
          background: #dc2626;
          border: none;
          padding: 14px 32px;
          border-radius: 28px;
          color: white;
          font-weight: 700;
          font-size: 1.15rem;
          cursor: pointer;
          box-shadow: 0 7px 25px rgb(220 38 38 / 0.9);
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          user-select: none;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          width: 100%;
        }

        .close-btn:hover,
        .close-btn:focus {
          background: #991b1b;
          outline: none;
          box-shadow: 0 11px 38px rgb(153 27 27 / 1);
        }
      `}</style>
    </div>
  );
}
