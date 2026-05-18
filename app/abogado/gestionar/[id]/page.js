"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../../lib/firebase"; 
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";

export default function ModuloGestionExpedienteCANTV() {
  const router = useRouter();
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comentario, setComentario] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [modalExito, setModalExito] = useState(false);
  const [veredictoAplicado, setVeredictoAplicado] = useState("");

  // 🔄 CARGA DEL EXPEDIENTE DIGITAL EN TIEMPO REAL
  useEffect(() => {
    const cargarExpediente = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, "solicitudes", id));
        if (docSnap.exists()) {
          setTicket({ id: docSnap.id, ...docSnap.data() });
          if (docSnap.data().observacionAbogado) {
            setComentario(docSnap.data().observacionAbogado);
          }
        }
      } catch (e) {
        console.error("Error al recuperar el expediente CANTV:", e);
      }
    };
    cargarExpediente();
  }, [id]);

  // ⚖️ PROCESAR RESOLUCIÓN DE LA SOLICITUD (SISTEMA DE TRAZABILIDAD)
  const procesarResolucionCaso = async (veredictoLegal) => {
    if (!comentario.trim()) {
      alert(`Por favor, ingrese el motivo o la fundamentación jurídica de por qué ha decidido ${veredictoLegal} esta solicitud.`);
      return;
    }

    setProcesando(true);
    try {
      const docRef = doc(db, "solicitudes", id);
      const usuarioActual = auth.currentUser;
      
      await updateDoc(docRef, {
        estado: veredictoLegal, 
        observacionAbogado: comentario, 
        fechaCierre: serverTimestamp(),
        firmaAbogadoId: usuarioActual?.uid || "ID_SISTEMA",
        firmaAbogadoNombre: usuarioActual?.displayName || "Abogado Evaluador SISLEXI"
      });

      setVeredictoAplicado(veredictoLegal);
      setModalExito(true);
    } catch (e) {
      console.error("Error al procesar la resolución en Firestore:", e);
    } finally {
      setProcesando(false);
    }
  };

  // 📄 DESPLEGABLE SEGURO DE ARCHIVOS ADJUNTOS EN BASE64
  const verDocumentoAdjunto = (base64Data, nombreArchivo) => {
    const ventanaVisualizacion = window.open();
    ventanaVisualizacion.document.write(`
      <html>
        <head><title>SISLEXI - ${nombreArchivo}</title></head>
        <body style="margin:0; background:#0f172a; display:flex; justify-content:center; align-items:center;">
          <img src="${base64Data}" style="max-width:92%; max-height:92vh; border-radius:12px; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
        </body>
      </html>
    `);
  };

  if (!ticket) return <div className="pantalla-carga">🔄 Cargando expediente digital...</div>;

  return (
    <div className="layout-gestion">
      {/* MODAL PERSONALIZADO DE SISLEXI */}
      {modalExito && (
        <div className="capa-modal">
          <div className="alerta-box">
            <div className="modal-brand-header">
              <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" className="modal-logo" />
            </div>
            <div className={`circulo-check ${veredictoAplicado}`}>
              {veredictoAplicado === "aprobado" ? "✓" : "✕"}
            </div>
            <h3>Solicitud Procesada</h3>
            <p>
              El estatus del ticket #{ticket.idTicket} se ha actualizado exitosamente a 
              <strong className="status-highlight"> {veredictoAplicado.toUpperCase()}</strong>.
            </p>
            <p className="motivo-resumen">Los motivos, la firma del especialista y los argumentos legales quedaron guardados en la bitácora.</p>
            <button className="btn-modal-back" onClick={() => router.push("/abogado/solicitudes")}>Regresar a Bandeja</button>
          </div>
        </div>
      )}

      {/* NAVBAR SUPERIOR INSTITUCIONAL */}
      <header className="navbar-superior">
        <div className="marca-capsula">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" />
          <span>SISLEXI GESTIÓN EXPEDIENTE</span>
        </div>
        <button className="btn-volver" onClick={() => router.back()}>⬅ Regresar</button>
      </header>

      {/* 📜 WRAPPER PRINCIPAL CON SCROLL GENERAL */}
      <main className="wrapper-deslizable">
        <div className="tarjeta-expediente">
          
          <div className="encabezado-caso">
            <div className="encabezado-info">
              <span className="id-caso-txt">📌 NÚMERO DE TICKET: #{ticket.idTicket}</span>
              <h1>📋 Tipo de Requerimiento: <span className="req-highlight">{ticket.tipo}</span></h1>
            </div>
            <div className="prioridad-capsula">
              📊 Priorización Multicriterio: <strong>{ticket.puntaje || 0} pts ({ticket.urgencia || "Baja"})</strong>
            </div>
          </div>

          <div className="grilla-expediente">
            {/* BLOQUE IZQUIERDO: INFORMACIÓN DEL SOLICITANTE */}
            <section className="columna-datos">
              <div className="group-header">
                <span className="seccion-tag">🪪 Ficha de Identificación del Solicitante</span>
              </div>
              
              {/* Estructura limpia alineada y compacta */}
              <div className="caja-informacion-personal">
                <div className="info-row">
                  <span className="info-label">👤 Nombre del Solicitante:</span>
                  <span className="info-value">{ticket.nombreSolicitante || "No especificado"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">🔑 Código P00:</span>
                  <span className="info-value p00-style">{ticket.p00 || "No registrado"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">💳 Cédula de Identidad:</span>
                  <span className="info-value">{ticket.cedula || ticket.usuarioId}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">🏢 Área en que Trabaja:</span>
                  <span className="info-value">{ticket.organismo || ticket.areaTrabajo || "cantv"}</span>
                </div>
              </div>

              <div className="group-header">
                <span className="seccion-tag">📝 Descripción del Caso</span>
              </div>
              <div className="caja-descripcion scroll-interno">
                {ticket.descripcion}
              </div>

              <div className="group-header">
                <span className="seccion-tag">📂 Archivos de Evidencia Adjuntos</span>
              </div>
              <div className="grilla-archivos">
                {ticket.archivosEnviados?.map((archivo, index) => (
                  <div key={index} className="item-archivo">
                    <span className="file-name-container">📄 {archivo.nombre}</span>
                    <button className="btn-view-file" onClick={() => verDocumentoAdjunto(archivo.data, archivo.nombre)}>Ver Adjunto</button>
                  </div>
                ))}
                {(!ticket.archivosEnviados || ticket.archivosEnviados.length === 0) && (
                  <p className="vacio-txt">📭 El solicitante no adjuntó archivos de evidencia.</p>
                )}
              </div>
            </section>

            {/* BLOQUE DERECHO: ACCIONES JURÍDICAS */}
            <section className="columna-acciones">
              <div className="group-header">
                <span className="seccion-tag">⚖️ Fundamentación Legal / Motivo del Dictamen</span>
              </div>
              <textarea 
                placeholder="Escriba aquí los argumentos detallados de la resolución (si es rechazado, explique detalladamente el por qué)..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />

              {/* Se eliminó el botón de chat duplicado de esta sección */}
              <div className="bloque-botones-veredicto">
                <button 
                  className="btn-accion-rechazar" 
                  onClick={() => procesarResolucionCaso("rechazado")}
                  disabled={procesando}
                >
                  {procesando && veredictoAplicado === "rechazado" ? "Procesando..." : "✕ Rechazar Solicitud"}
                </button>
                <button 
                  className="btn-accion-aprobar" 
                  onClick={() => procesarResolucionCaso("aprobado")}
                  disabled={procesando}
                >
                  {procesando && veredictoAplicado === "aprobado" ? "Procesando..." : "✓ Aprobar Solicitud"}
                </button>
              </div>
            </section>
          </div>

        </div>
      </main>

      <style jsx>{`
        .layout-gestion { height: 100vh; display: flex; flex-direction: column; background: #f4f7f9; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; }
        
        /* NAVBAR PREMIUM */
        .navbar-superior { background: white; padding: 14px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.02); z-index: 10; }
        .marca-capsula { display: flex; align-items: center; gap: 12px; font-weight: 800; color: #002d72; font-size: 1.3rem; letter-spacing: -0.5px; }
        .marca-capsula img { height: 38px; object-fit: contain; }
        .btn-volver { padding: 9px 22px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 700; color: #475569; transition: all 0.2s ease; }
        .btn-volver:hover { background: #f8fafc; border-color: #94a3b8; }

        /* SCROLL GENERAL Y TARJETA */
        .wrapper-deslizable { flex: 1; overflow-y: auto; padding: 35px 4%; display: flex; justify-content: center; align-items: flex-start; }
        .tarjeta-expediente { background: white; width: 100%; max-width: 1200px; border-radius: 24px; padding: 35px; box-shadow: 0 10px 35px rgba(0,0,0,0.03); height: fit-content; margin-bottom: 20px; }
        
        .encabezado-caso { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 25px; margin-bottom: 30px; gap: 20px; }
        .id-caso-txt { color: #3b82f6; font-weight: 800; font-size: 0.85rem; display: block; margin-bottom: 6px; letter-spacing: 0.5px; }
        .encabezado-caso h1 { margin: 0; color: #0f172a; font-size: 1.4rem; font-weight: 800; line-height: 1.3; }
        .req-highlight { color: #002d72; }
        .prioridad-capsula { background: #e0f2fe; padding: 10px 18px; border-radius: 14px; font-size: 0.85rem; color: #0369a1; font-weight: 600; border: 1px solid #bae6fd; white-space: nowrap; }

        .grilla-expediente { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; }
        .group-header { border-left: 3px solid #002d72; padding-left: 10px; margin-bottom: 12px; }
        .seccion-tag { display: block; font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* ✨ ARREGLO DE ALINEACIÓN DE LA FICHA PERSONAL (Alineado limpio a la izquierda) */
        .caja-informacion-personal { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; font-size: 0.95rem; color: #1e293b; display: flex; flex-direction: column; gap: 12px; }
        .info-row { display: grid; grid-template-columns: 200px 1fr; align-items: center; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .info-label { color: #475569; font-weight: 600; display: flex; align-items: center; }
        .info-value { color: #0f172a; font-weight: 500; text-align: left; word-break: break-all; }
        .p00-style { font-family: monospace; font-weight: 700; color: #002d72; background: #e0e7ff; padding: 2px 8px; border-radius: 6px; width: fit-content; }
        
        .caja-descripcion { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; font-size: 0.95rem; line-height: 1.6; color: #334155; margin-bottom: 25px; }
        .scroll-interno { max-height: 220px; overflow-y: auto; }

        .grilla-archivos { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .item-archivo { display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; padding: 12px 18px; border-radius: 14px; font-size: 0.85rem; border: 1px solid #bbf7d0; gap: 15px; }
        .file-name-container { color: #166534; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .btn-view-file { background: none; border: none; color: #15803d; font-weight: 800; cursor: pointer; text-decoration: underline; padding: 0; white-space: nowrap; font-size: 0.85rem; }
        .vacio-txt { font-size: 0.85rem; color: #94a3b8; font-style: italic; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center; }

        .columna-acciones { display: flex; flex-direction: column; }
        textarea { width: 100%; height: 280px; padding: 18px; border-radius: 16px; border: 1px solid #cbd5e1; margin-bottom: 20px; resize: none; font-family: inherit; font-size: 0.95rem; background: #f8fafc; box-sizing: border-box; transition: all 0.2s; }
        textarea:focus { background: white; border-color: #002d72; box-shadow: 0 0 0 3px rgba(0,45,114,0.1); outline: none; }

        .bloque-botones-veredicto { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .btn-accion-aprobar { background: #002d72; color: white; border: none; padding: 16px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(0,45,114,0.15); }
        .btn-accion-aprobar:hover { background: #001a45; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,45,114,0.25); }
        .btn-accion-rechazar { background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; padding: 16px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; }
        .btn-accion-rechazar:hover { background: #fecdd3; transform: translateY(-2px); }

        /* MODAL */
        .capa-modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .alerta-box { background: white; padding: 35px; border-radius: 24px; text-align: center; width: 380px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); animation: entradaPop 0.25s ease-out; position: relative; overflow: hidden; }
        .modal-brand-header { margin-bottom: 20px; display: flex; justify-content: center; }
        .modal-logo { height: 35px; object-fit: contain; }
        .circulo-check { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: bold; margin: 0 auto 20px; color: white; }
        .circulo-check.aprobado { background: #10b981; box-shadow: 0 6px 15px rgba(16,185,129,0.3); }
        .circulo-check.rechazado { background: #ef4444; box-shadow: 0 6px 15px rgba(239,68,68,0.3); }
        .alerta-box h3 { font-size: 1.35rem; color: #0f172a; margin: 0 0 10px 0; font-weight: 800; }
        .alerta-box p { color: #64748b; font-size: 0.9rem; margin: 0 0 12px 0; line-height: 1.5; }
        .status-highlight { color: #002d72; font-weight: 800; }
        .motivo-resumen { font-style: italic; color: #94a3b8 !important; font-size: 0.85rem !important; }
        .btn-modal-back { background: #002d72; color: white; border: none; padding: 14px; border-radius: 12px; width: 100%; font-weight: 700; cursor: pointer; font-size: 0.95rem; margin-top: 15px; box-shadow: 0 4px 12px rgba(0,45,114,0.15); }
        
        @keyframes entradaPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .pantalla-carga { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #002d72; font-size: 1.2rem; background: #f4f7f9; }

        @media (max-width: 1024px) {
          .grilla-expediente { grid-template-columns: 1fr; gap: 30px; }
          .tarjeta-expediente { padding: 25px; }
          textarea { height: 220px; }
        }

        @media (max-width: 640px) {
          .navbar-superior { padding: 12px 4%; }
          .marca-capsula span { display: none; }
          .encabezado-caso { flex-direction: column; align-items: flex-start; gap: 12px; }
          .prioridad-capsula { width: 100%; box-sizing: border-box; text-align: center; }
          .info-row { grid-template-columns: 1fr; gap: 4px; }
          .bloque-botones-veredicto { grid-template-columns: 1fr; }
          .wrapper-deslizable { padding: 15px 3%; }
        }
      `}</style>
    </div>
  );
}