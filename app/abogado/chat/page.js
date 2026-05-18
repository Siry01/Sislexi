"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function BandejaMensajeriaPorCaso() {
  const router = useRouter();
  const [conversaciones, setConversaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const idAbogado = auth.currentUser?.uid;
    if (!idAbogado) return;

    // Buscamos en la colección de chats las salas activas de este abogado
    const q = query(collection(db, "chats"), where("idAbogado", "==", idAbogado));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaSalas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar por el mensaje más reciente de forma segura
      setConversaciones(listaSalas.sort((a, b) => (b.fechaUltimoMensaje?.seconds || 0) - (a.fechaUltimoMensaje?.seconds || 0)));
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtro inteligente para buscar por ticket, tipo de trámite o nombre del trabajador
  const chatsFiltrados = conversaciones.filter(chat => 
    chat.idTicket?.toString().includes(busqueda) ||
    chat.tipoTicket?.toLowerCase().includes(busqueda.toLowerCase()) ||
    chat.nombreTrabajador?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="layout-whatsapp">
      <header className="navbar-superior">
        <div className="marca-capsula">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" />
          <span>SISLEXI MENSAJERÍA</span>
        </div>
        <button className="btn-volver" onClick={() => router.push("/abogado/solicitudes")}>⬅ Bandeja de Casos</button>
      </header>

      <div className="contenedor-comunicacion">
        <aside className="panel-izquierdo">
          <div className="buscador-contenedor">
            <input 
              type="text" 
              placeholder="🔍 Buscar por Ticket, Trámite o Solicitante..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda-chat"
            />
          </div>

          <div className="lista-conversaciones">
            {cargando ? (
              <p className="txt-status-chat">Cargando salas de mensajería...</p>
            ) : chatsFiltrados.length > 0 ? (
              chatsFiltrados.map((chat) => (
                <div 
                  key={chat.id} 
                  className="item-conversacion-link"
                  onClick={() => router.push(`/abogado/chat/${chat.idTicket}`)} // El enlace ahora es por Ticket ID
                >
                  <div className="avatar-simulado">📄</div>
                  <div className="detalles-hilo-chat">
                    <div className="fila-superior-hilo">
                      <h4>{chat.tipoTicket} #{chat.idTicket}</h4>
                      <span className="badge-p00-chat">{chat.p00Trabajador || "P00"}</span>
                    </div>
                    <p className="trabajador-subtext">👤 Solicitante: {chat.nombreTrabajador}</p>
                    <p className="ultimo-msg-txt">
                      {chat.tipoUltimoMensaje === "archivo" ? "🖼️ [Archivo adjunto / Foto]" : chat.ultimoMensaje || "Iniciar conversación..."}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="txt-status-chat">No hay canales de comunicación abiertos.</p>
            )}
          </div>
        </aside>

        <section className="panel-derecho-placeholder">
          <div className="contenido-vacio-informativo">
            <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV Watermark" className="logo-background-watermark" />
            <h3>Canal de Comunicación Orientado a Casos</h3>
            <p>Seleccione un ticket legal en el panel de la izquierda para revisar dudas, solicitar correcciones o recibir archivos multimedia en tiempo real.</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        .layout-whatsapp { height: 100vh; display: flex; flex-direction: column; background: #f4f7f9; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; }
        .navbar-superior { background: white; padding: 14px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; }
        .marca-capsula { display: flex; align-items: center; gap: 12px; font-weight: 800; color: #002d72; font-size: 1.3rem; }
        .marca-capsula img { height: 38px; }
        .btn-volver { padding: 9px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 700; color: #475569; }

        .contenedor-comunicacion { flex: 1; display: grid; grid-template-columns: 400px 1fr; overflow: hidden; background: white; }
        .panel-izquierdo { border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; background: #f8fafc; }
        .buscador-contenedor { padding: 15px; background: white; border-bottom: 1px solid #e2e8f0; }
        .input-busqueda-chat { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; box-sizing: border-box; }
        
        .lista-conversaciones { flex: 1; overflow-y: auto; }
        .item-conversacion-link { display: flex; align-items: center; gap: 14px; padding: 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; background: white; transition: 0.2s; }
        .item-conversacion-link:hover { background: #f1f5f9; }
        
        .avatar-simulado { width: 44px; height: 44px; border-radius: 12px; background: #e0e7ff; color: #002d72; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
        .detalles-hilo-chat { flex: 1; min-width: 0; }
        .fila-superior-hilo { display: flex; justify-content: space-between; align-items: center; }
        .fila-superior-hilo h4 { margin: 0; color: #002d72; font-size: 0.95rem; font-weight: 800; }
        .badge-p00-chat { font-family: monospace; font-size: 0.75rem; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
        .trabajador-subtext { margin: 2px 0; font-size: 0.8rem; color: #475569; font-weight: 600; }
        .ultimo-msg-txt { margin: 0; font-size: 0.8rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .panel-derecho-placeholder { display: flex; align-items: center; justify-content: center; background: #f4f7f9; padding: 40px; text-align: center; }
        .contenido-vacio-informativo { max-width: 450px; display: flex; flex-direction: column; align-items: center; }
        .logo-background-watermark { height: 70px; opacity: 0.15; margin-bottom: 20px; filter: grayscale(100%); }
        .panel-derecho-placeholder h3 { color: #002d72; font-size: 1.4rem; margin: 0 0 10px 0; font-weight: 800; }
        .panel-derecho-placeholder p { color: #64748b; font-size: 0.9rem; line-height: 1.6; }
        .txt-status-chat { text-align: center; padding: 30px; color: #94a3b8; font-style: italic; }

        @media (max-width: 768px) {
          .contenedor-comunicacion { grid-template-columns: 1fr; }
          .panel-derecho-placeholder { display: none; }
        }
      `}</style>
    </div>
  );
}