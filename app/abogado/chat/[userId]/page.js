"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../../lib/firebase"; 
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";

export default function ChatIndividualPorCasoAvanzado() {
  const router = useRouter();
  const { userId } = useParams(); // 🔥 Ahora recibe el ID del Documento del Ticket desde la URL
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [ticketInfo, setTicketInfo] = useState(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  
  const [previsualizarFile, setPrevisualizarFile] = useState({ data: null, nombre: "", tipo: "" });
  const [mostrarSidebarArchivos, setMostrarSidebarArchivos] = useState(false);

  const scrollRef = useRef(null);
  const idAbogadoActual = auth.currentUser?.uid;
  
  // 🔥 CORRECCIÓN ARQUITECTURA: La sala ahora se llama explícitamente con el ID único del Ticket
  const idSalaChat = `ticket_${userId}`;

  // 🔄 CARGA DE DATOS, MENSAJES Y MARCADO DE LEÍDO
  useEffect(() => {
    if (!userId || !idAbogadoActual) return;

    const cargarDatosTicket = async () => {
      // Recuperamos los datos de CANTV usando el ID del ticket para rellenar la cabecera
      const docSnap = await getDoc(doc(db, "solicitudes", userId));
      if (docSnap.exists()) {
        setTicketInfo(docSnap.data());
      }
    };
    cargarDatosTicket();

    // Listener de mensajes exclusivo para este ticket
    const q = query(collection(db, "chats", idSalaChat, "mensajes"), orderBy("fechaEnvio", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaMensajes = snapshot.docs.map(doc => {
        const data = doc.data();
        // Control de lectura por mensaje individual
        if (data.remitenteId !== idAbogadoActual && !data.leido) {
          updateDoc(doc.ref, { leido: true });
        }
        return { id: doc.id, ...data };
      });
      setMensajes(listaMensajes);
    });

    return () => unsubscribe();
  }, [userId, idAbogadoActual, idSalaChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;
    const texto = nuevoMensaje;
    setNuevoMensaje("");
    await guardarMensajeEnFirebase(texto, "texto");
  };

  const manejarSeleccionArchivo = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.readAsDataURL(archivo);
    lector.onload = () => {
      setPrevisualizarFile({
        data: lector.result,
        nombre: archivo.name,
        tipo: archivo.type.startsWith("image/") ? "imagen" : "documento"
      });
    };
    e.target.value = null;
  };

  const confirmarEnvioArchivo = async () => {
    setSubiendoArchivo(true);
    const { data, nombre } = previsualizarFile;
    setPrevisualizarFile({ data: null, nombre: "", tipo: "" });
    await guardarMensajeEnFirebase(data, "archivo", nombre);
    setSubiendoArchivo(false);
  };

  const guardarMensajeEnFirebase = async (contenido, tipoMensaje, nombreArchivo = "") => {
    try {
      // Guardar el mensaje en la subcolección de esta sala de ticket específica
      await addDoc(collection(db, "chats", idSalaChat, "mensajes"), {
        texto: contenido,
        tipo: tipoMensaje,
        nombreArchivo: nombreArchivo,
        remitenteId: idAbogadoActual,
        fechaEnvio: serverTimestamp(),
        leido: false
      });

      // Actualizar la raíz para la bandeja general externa de Mensajería
      await setDoc(doc(db, "chats", idSalaChat), {
        idSala: idSalaChat,
        idAbogado: idAbogadoActual,
        idTicket: ticketInfo?.idTicket || "N/A",
        tipoTicket: ticketInfo?.tipo || "Trámite General",
        ultimoMensaje: tipoMensaje === "archivo" ? `📁 ${nombreArchivo}` : contenido,
        tipoUltimoMensaje: tipoMensaje,
        fechaUltimoMensaje: serverTimestamp(),
        nombreTrabajador: ticketInfo?.nombreSolicitante || "Trabajador CANTV",
        p00Trabajador: ticketInfo?.p00 || "P00",
        idTrabajador: ticketInfo?.usuarioId || "ID_USER"
      }, { merge: true });

    } catch (err) {
      console.error("Error al guardar en base de datos:", err);
    }
  };

  const galeriaArchivos = mensajes.filter(m => m.tipo === "archivo");

  return (
    <div className="layout-chat-room">
      
      {/* MODAL DE CONFIRMACIÓN DE ARCHIVOS / FOTOS */}
      {previsualizarFile.data && (
        <div className="capa-modal-preview">
          <div className="preview-box">
            <h3>¿Deseas enviar este archivo?</h3>
            <p className="preview-filename">📄 {previsualizarFile.nombre}</p>
            
            <div className="container-render-media">
              {previsualizarFile.tipo === "imagen" ? (
                <img src={previsualizarFile.data} alt="Preview" className="img-previsualizar" />
              ) : (
                <div className="doc-icon-placeholder">Previsualización de Documento de Respaldo</div>
              )}
            </div>

            <div className="preview-actions-btns">
              <button className="btn-cancelar-preview" onClick={() => setPrevisualizarFile({ data: null, nombre: "", tipo: "" })}>Cancelar</button>
              <button className="btn-confirmar-preview" onClick={confirmarEnvioArchivo}>Enviar Archivo seguro</button>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA INTERACTIVA */}
      <header className="navbar-superior-chat">
        <div className="perfil-info-cabecera" onClick={() => setMostrarSidebarArchivos(!mostrarSidebarArchivos)} title="Ver archivos del caso">
          <div className="avatar-mini">📄</div>
          <div className="cursor-pointer-header">
            <h3>{ticketInfo?.tipo || "Trámite"} #{ticketInfo?.idTicket || "Cargando..."} 🔍</h3>
            <small>👤 Solicitante: {ticketInfo?.nombreSolicitante || "Cargando..."} ({ticketInfo?.p00 || "P00"})</small>
          </div>
        </div>
        <button className="btn-volver" onClick={() => router.push("/abogado/chat")}>⬅ Salir del Chat</button>
      </header>

      <div className="cuerpo-interactivo-comunicacion">
        
        {/* HILO DE CONVERSACIÓN INDEPENDIENTE */}
        <main className="area-mensajes-scroll">
          {mensajes.map((msg) => {
            const esMio = msg.remitenteId === idAbogadoActual;
            return (
              <div key={msg.id} className={`contenedor-burbuja ${esMio ? "mio" : "recibido"}`}>
                <div className="burbuja-texto">
                  {msg.tipo === "archivo" ? (
                    msg.texto.startsWith("data:image/") ? (
                      <img src={msg.texto} alt="Evidencia" className="imagen-adjunta-chat" onClick={() => {
                        const v = window.open();
                        v.document.write(`<html><body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;"><img src="${msg.texto}" style="max-width:92%;max-height:92vh;border-radius:12px;"></body></html>`);
                      }} />
                    ) : (
                      <div className="archivo-descarga-box">
                        <span>📄 {msg.nombreArchivo}</span>
                        <button onClick={() => {
                          const v = window.open();
                          v.document.write(`<html><body style="margin:0;background:#000;"><iframe src="${msg.texto}" style="width:100%;height:100vh;border:none;"></iframe></body></html>`);
                        }}>Abrir Documento</button>
                      </div>
                    )
                  ) : (
                    <p>{msg.texto}</p>
                  )}
                  
                  {esMio && (
                    <span className={`status-checks ${msg.leido ? "read" : ""}`}>
                      {msg.leido ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </main>

        {/* PANEL LATERAL DE ARCHIVOS COMPARTIDOS POR TICKET */}
        {mostrarSidebarArchivos && (
          <aside className="sidebar-archivos-caso">
            <div className="sidebar-header-title">
              <h4>Archivos Compartidos ({galeriaArchivos.length})</h4>
              <button onClick={() => setMostrarSidebarArchivos(false)}>✕</button>
            </div>
            <div className="sidebar-galeria-contenido">
              {galeriaArchivos.map((arch) => (
                <div key={arch.id} className="mini-card-archivo" onClick={() => {
                  const v = window.open();
                  v.document.write(`<html><body style="margin:0;background:#0f172a;display:flex;justify-content:center;align-items:center;"><img src="${arch.texto}" style="max-width:92%;max-height:92vh;border-radius:12px;"></body></html>`);
                }}>
                  <div className="mini-icon">📄</div>
                  <div className="mini-details">
                    <span className="mini-filename">{arch.nombreArchivo}</span>
                  </div>
                </div>
              ))}
              {galeriaArchivos.length === 0 && <p className="no-files-txt">No se han compartido archivos en este caso.</p>}
            </div>
          </aside>
        )}
      </div>

      <footer className="input-footer-chat">
        <form onSubmit={enviarMensaje} className="formulario-chat">
          <label className="btn-adjuntar-file">
            📎
            <input type="file" accept="image/*,application/pdf" onChange={manejarSeleccionArchivo} style={{ display: "none" }} />
          </label>
          <input 
            type="text" 
            placeholder="Escriba un mensaje aquí..." 
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            className="input-mensaje-texto"
          />
          <button type="submit" className="btn-enviar-mensaje">Enviar 🚀</button>
        </form>
      </footer>

      <style jsx>{`
        .layout-chat-room { height: 100vh; display: flex; flex-direction: column; background: #efeae2; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; }
        .navbar-superior-chat { background: white; padding: 12px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; z-index: 5; }
        .perfil-info-cabecera { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .avatar-mini { width: 42px; height: 42px; background: #e0e7ff; color: #002d72; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .perfil-info-cabecera h3 { margin: 0; font-size: 1rem; color: #002d72; font-weight: 800; }
        .perfil-info-cabecera small { color: #475569; font-size: 0.8rem; font-weight: 600; }
        .btn-volver { padding: 8px 18px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 700; color: #475569; }

        .cuerpo-interactivo-comunicacion { flex: 1; display: flex; overflow: hidden; }
        .area-mensajes-scroll { flex: 1; overflow-y: auto; padding: 25px 4%; display: flex; flex-direction: column; gap: 12px; background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 15px 15px; }
        
        .contenedor-burbuja { display: flex; width: 100%; }
        .contenedor-burbuja.mio { justify-content: flex-end; }
        .contenedor-burbuja.recibido { justify-content: flex-start; }

        .burbuja-texto { max-width: 60%; padding: 10px 14px; border-radius: 16px; font-size: 0.95rem; position: relative; padding-bottom: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .mio .burbuja-texto { background: #002d72; color: white; border-bottom-right-radius: 4px; }
        .recibido .burbuja-texto { background: white; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
        .burbuja-texto p { margin: 0; }

        .status-checks { position: absolute; bottom: 4px; right: 10px; font-size: 0.75rem; color: rgba(255,255,255,0.6); font-weight: bold; }
        .status-checks.read { color: #38bdf8; }

        .sidebar-archivos-caso { width: 320px; background: white; border-left: 1px solid #e2e8f0; display: flex; flex-direction: column; animation: entrarPanel 0.2s ease-out; }
        .sidebar-header-title { padding: 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .sidebar-header-title h4 { margin: 0; color: #002d72; font-weight: 800; }
        .sidebar-header-title button { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #94a3b8; }
        .sidebar-galeria-contenido { padding: 15px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }
        .mini-card-archivo { display: flex; align-items: center; gap: 10px; background: white; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; cursor: pointer; transition: 0.2s; }
        .mini-card-archivo:hover { border-color: #002d72; background: #eff6ff; }
        .mini-icon { font-size: 1.2rem; }
        .mini-filename { font-size: 0.8rem; color: #334155; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
        .no-files-txt { text-align: center; color: #94a3b8; font-style: italic; font-size: 0.85rem; padding-top: 20px; }

        .capa-modal-preview { position: fixed; inset: 0; background: rgba(15,23,42,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .preview-box { background: white; padding: 30px; border-radius: 24px; text-align: center; width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .preview-box h3 { color: #002d72; margin: 0 0 5px 0; font-weight: 800; }
        .preview-filename { color: #64748b; font-size: 0.85rem; margin-bottom: 15px; font-weight: 600; }
        .container-render-media { background: #f1f5f9; padding: 15px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: center; }
        .img-previsualizar { max-width: 100%; max-height: 200px; border-radius: 10px; object-fit: contain; }
        .doc-icon-placeholder { font-size: 0.9rem; color: #475569; font-style: italic; padding: 20px; }
        .preview-actions-btns { display: grid; grid-template-columns: 1fr 1.5fr; gap: 12px; }
        .preview-actions-btns button { padding: 12px; border-radius: 10px; border: none; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
        .btn-cancelar-preview { background: #f1f5f9; color: #475569; }
        .btn-confirmar-preview { background: #002d72; color: white; }

        .imagen-adjunta-chat { max-width: 100%; max-height: 200px; border-radius: 10px; cursor: pointer; margin-top: 4px; display: block; }
        .archivo-descarga-box { display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; }
        .archivo-descarga-box button { background: white; color: #002d72; border: none; padding: 6px; border-radius: 6px; font-weight: 700; cursor: pointer; margin-top: 4px; }
        .input-footer-chat { background: #f0f2f5; padding: 15px 5%; border-top: 1px solid #e2e8f0; }
        .formulario-chat { display: flex; gap: 12px; align-items: center; }
        .btn-adjuntar-file { font-size: 1.5rem; cursor: pointer; padding: 5px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 12px; }
        .input-mensaje-texto { flex: 1; padding: 14px 20px; border-radius: 14px; border: 1px solid #cbd5e1; outline: none; font-size: 0.95rem; }
        .btn-enviar-mensaje { background: #002d72; color: white; border: none; padding: 0 22px; height: 48px; border-radius: 14px; font-weight: 700; cursor: pointer; }

        @keyframes entrarPanel { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}