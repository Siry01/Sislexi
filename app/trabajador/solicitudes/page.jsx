"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase"; 
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) { obtenerSolicitudes(user.uid); } 
      else { router.push("/"); }
    });

    const obtenerSolicitudes = async (uid) => {
      try {
        const q = query(collection(db, "solicitudes"), where("usuarioId", "==", uid), orderBy("fecha", "desc"));
        const querySnapshot = await getDocs(q);
        const datos = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const idVisual = data.idTicket || doc.id.replace(/\D/g, '').substring(0, 6);
          return { id: doc.id, displayId: idVisual, ...data };
        });
        setSolicitudes(datos);
      } catch (e) { console.error(e); } finally { setCargando(false); }
    };
    return () => unsubscribe();
  }, [router]);

  const filtradas = solicitudes.filter(s => 
    s.tipo?.toLowerCase().includes(busqueda.toLowerCase()) || s.displayId.includes(busqueda)
  );

  return (
    <div className="app-container">
      {/* HEADER ESTILO "NUEVA SOLICITUD" */}
      <header className="main-header">
        <div className="header-content">
          <div className="brand">
            <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="Logo" className="logo" />
            <div className="brand-text">
              <h1>SISLEXI</h1>
              <p>Mis Casos Registrados</p>
            </div>
          </div>
          <button className="btn-back" onClick={() => router.push("/trabajador")}>
            <span>⬅</span> Regresar
          </button>
        </div>
      </header>

      {/* CONTENIDO SOBRE FONDO GRIS */}
      <main className="content">
        <div className="section-header">
          <h2>Historial de Trámites</h2>
          <p>Gestiona y revisa el estado de tus solicitudes legales.</p>
        </div>

        {/* BUSCADOR ESTILIZADO */}
        <div className="search-box">
          <input 
            type="tel" 
            placeholder="Buscar por número de ticket..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* GRID DE TARJETAS BLANCAS */}
        <div className="requests-grid">
          {cargando ? (
            <div className="loader">Cargando trámites...</div>
          ) : filtradas.length > 0 ? (
            filtradas.map(s => (
              <div className="white-card" key={s.id} onClick={() => setSeleccionado(s)}>
                <div className="card-top">
                  <span className="ticket-number">#{s.displayId}</span>
                  <span className={`status-pill ${s.estado?.toLowerCase()}`}>{s.estado}</span>
                </div>
                <div className="card-body">
                  <h3>{s.tipo}</h3>
                  <p>{s.descripcion?.substring(0, 65)}...</p>
                </div>
                <div className="card-footer">
                  <span className="date">📅 {s.fecha?.toDate?.().toLocaleDateString()}</span>
                  <button className="btn-view">Ver Detalles</button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No se encontraron casos.</div>
          )}
        </div>
      </main>

      {/* MODAL DE DETALLES (Igual al estilo de confirmación) */}
      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionado(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-detail">
              <span className="modal-label">DETALLES DEL TICKET</span>
              <h2>#{seleccionado.displayId}</h2>
              <button className="btn-close" onClick={() => setSeleccionado(null)}>✕</button>
            </div>
            
            <div className="modal-scroll">
              <div className="detail-group">
                <label>Tipo de Trámite</label>
                <p>{seleccionado.tipo}</p>
              </div>
              <div className="detail-group">
                <label>Descripción</label>
                <p className="desc-box">{seleccionado.descripcion}</p>
              </div>
              <div className="detail-group">
                <label>Documentos</label>
                {seleccionado.archivosEnviados?.length > 0 ? (
                  <div className="file-list">
                    {seleccionado.archivosEnviados.map((f, i) => (
                      <a key={i} href={f.data} download={f.nombre} className="file-item">
                        📄 {f.nombre} <span>(Descargar)</span>
                      </a>
                    ))}
                  </div>
                ) : <p className="no-data">Sin archivos adjuntos.</p>}
              </div>
            </div>

            <div className="modal-footer-actions">
              <button className="btn-ia" onClick={() => router.push(`/trabajador/lexi?ticket=${seleccionado.displayId}`)}>
                🤖 Consultar Lexi
              </button>
              <button className="btn-chat" onClick={() => router.push(`/trabajador/chat/${seleccionado.id}`)}>
                ⚖️ Abogado
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* BASE IGUAL A NUEVA SOLICITUD */
        .app-container { background: #f0f3f6; min-height: 100vh; font-family: 'Inter', sans-serif; color: #1e293b; }
        
        /* HEADER IGUAL AL DE LA IMAGEN 1 */
        .main-header { background: white; padding: 20px; border-bottom: 1px solid #e2e8f0; }
        .header-content { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .brand { display: flex; align-items: center; gap: 15px; }
        .logo { height: 40px; }
        .brand-text h1 { margin: 0; font-size: 1.5rem; font-weight: 900; color: #002d72; }
        .brand-text p { margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 600; }
        
        .btn-back { border: 1px solid #e2e8f0; background: white; padding: 10px 20px; border-radius: 12px; cursor: pointer; color: #002d72; font-weight: 700; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

        /* CONTENIDO PRINCIPAL */
        .content { max-width: 1100px; margin: 0 auto; padding: 40px 20px; }
        .section-header { margin-bottom: 30px; }
        .section-header h2 { font-size: 1.8rem; color: #002d72; margin: 0; }
        .section-header p { color: #64748b; margin: 5px 0 0; }

        /* BUSCADOR */
        .search-box { position: relative; max-width: 500px; margin-bottom: 30px; }
        .search-box input { width: 100%; padding: 15px 20px 15px 50px; border-radius: 15px; border: 1px solid #e2e8f0; outline: none; font-size: 1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
        .search-icon { position: absolute; left: 18px; top: 16px; color: #94a3b8; }

        /* TARJETAS BLANCAS (NUEVO DISEÑO) */
        .requests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        
        .white-card { 
          background: white; border-radius: 20px; padding: 25px; cursor: pointer;
          border: 1px solid #eef2f6; box-shadow: 0 10px 25px rgba(0,0,0,0.03);
          transition: 0.3s; display: flex; flex-direction: column; gap: 15px;
        }
        .white-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.08); border-color: #00a9e0; }
        
        .card-top { display: flex; justify-content: space-between; align-items: center; }
        .ticket-number { font-weight: 900; color: #00a9e0; font-size: 0.9rem; }
        .status-pill { font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; }
        .status-pill.pendiente { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
        
        .card-body h3 { margin: 0 0 8px; color: #1e293b; font-size: 1.2rem; }
        .card-body p { margin: 0; color: #64748b; font-size: 0.9rem; line-height: 1.5; }
        
        .card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #f1f5f9; }
        .date { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
        .btn-view { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 8px; color: #002d72; font-size: 0.75rem; font-weight: 700; }

        /* MODAL ESTILO "CONFIRMACIÓN" */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0, 25, 65, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: white; width: 100%; max-width: 500px; border-radius: 25px; padding: 30px; animation: popUp 0.3s ease; box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
        @keyframes popUp { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        
        .modal-header-detail { text-align: center; margin-bottom: 25px; position: relative; }
        .modal-label { font-size: 0.65rem; font-weight: 800; color: #00a9e0; letter-spacing: 1px; }
        .modal-header-detail h2 { margin: 5px 0 0; font-size: 2rem; color: #002d72; font-weight: 900; }
        .btn-close { position: absolute; top: -10px; right: -10px; background: #f1f5f9; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; }

        .modal-scroll { max-height: 50vh; overflow-y: auto; padding-right: 10px; }
        .detail-group { margin-bottom: 20px; }
        .detail-group label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 6px; }
        .detail-group p { font-size: 1rem; color: #1e293b; margin: 0; font-weight: 500; }
        .desc-box { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; line-height: 1.6; }
        
        .file-item { display: block; padding: 10px; background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 10px; margin-top: 8px; text-decoration: none; color: #0369a1; font-size: 0.85rem; font-weight: 600; }
        .file-item span { font-size: 0.7rem; opacity: 0.7; margin-left: 5px; }

        .modal-footer-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 25px; }
        .btn-ia, .btn-chat { padding: 15px; border-radius: 15px; border: none; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-ia { background: #002d72; color: white; }
        .btn-chat { background: #10b981; color: white; }
        .btn-ia:hover { background: #00a9e0; }

        @media (max-width: 600px) {
          .modal-footer-actions { grid-template-columns: 1fr; }
          .requests-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}