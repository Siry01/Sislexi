"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// Iconos según tipo de archivo
const iconoArchivo = (nombre) => {
  if (!nombre) return "📄";
  const ext = nombre.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "📕";
  if (["doc", "docx"].includes(ext)) return "📘";
  if (["png", "jpg", "jpeg", "gif"].includes(ext)) return "🖼️";
  return "📄";
};

export default function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const obtenerSolicitudes = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, "solicitudes"), where("usuarioId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const datos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSolicitudes(datos);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    obtenerSolicitudes();
  }, []);

  const filtradas = busqueda
    ? solicitudes.filter(s =>
        s.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.abogado?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : solicitudes;

  const estadoClass = (estado) => {
    switch (estado.toLowerCase()) {
      case "pendiente": return "badge pendiente";
      case "proceso": return "badge proceso";
      case "aceptada": return "badge aceptada";
      case "finalizada": return "badge finalizado";
      case "cancelada": return "badge cancel";
      case "rechazada": return "badge rechazado";
      default: return "badge";
    }
  };

  const estadoTexto = (estado) => {
    switch (estado.toLowerCase()) {
      case "pendiente": return "Pendiente";
      case "proceso": return "En proceso";
      case "aceptada": return "Aceptada";
      case "finalizada": return "Finalizada";
      case "cancelada": return "Cancelada";
      case "rechazada": return "Rechazada";
      default: return estado;
    }
  };

  const cancelarSolicitud = async (s) => {
    const confirm = window.confirm("¿Está seguro que desea cancelar esta solicitud?");
    if (!confirm) return;

    await updateDoc(doc(db, "solicitudes", s.id), { estado: "cancelada" });
    setSolicitudes(prev => prev.map(sol => sol.id === s.id ? { ...sol, estado: "cancelada" } : sol));
    alert("La solicitud ha sido cancelada y el abogado será notificado.");
  };

  return (
    <div className="container">

      {/* HEADER */}
      <header className="header">
        <div className="logo-section">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="Logo CANTV" className="logo"/>
          <span className="system-name">SISLEXI</span>
        </div>
        <button className="back" onClick={() => router.push("/trabajador")}>⬅ Regresar</button>
      </header>

      {/* BUSCADOR */}
      <input
        className="search"
        placeholder="Buscar trámite, abogado o tipo..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      {/* LISTA DE SOLICITUDES */}
      <div className="list">
        {filtradas.length === 0 ? (
          <p className="no-results">No hay solicitudes que coincidan</p>
        ) : filtradas.map(s => (
          <div className="card" key={s.id}>

            <div className="top">
              <h3>{s.tipo || "Solicitud Legal"}</h3>
              <span className={estadoClass(s.estado)}>{estadoTexto(s.estado)}</span>
            </div>

            <div className="info">
              <span>👨‍⚖️ {s.abogado || "Sin asignar"}</span>
              <span>📌 Caso: {s.id}</span>
              <span>📅 {s.fecha?.toDate?.().toLocaleDateString() || "Fecha no disponible"}</span>
              <span>⏰ {s.fecha?.toDate?.().toLocaleTimeString() || "Hora no disponible"}</span>
            </div>

            <p className="desc">{s.descripcion || "Sin descripción"}</p>

            <div className="actions">
              <button className="view" onClick={() => setSeleccionado(s)}>👁 Ver Detalles</button>
              {s.estado.toLowerCase() !== "finalizada" && s.estado.toLowerCase() !== "cancelada" &&
                <button className="cancel" onClick={() => cancelarSolicitud(s)}>❌ Cancelar</button>}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DETALLES */}
      {seleccionado && (
        <div className="modal">
          <div className="modal-content">
            <h2>{seleccionado.tipo}</h2>
            <p><b>Descripción:</b> {seleccionado.descripcion}</p>
            <p><b>Abogado:</b> {seleccionado.abogado}</p>
            <p><b>Estado:</b> {estadoTexto(seleccionado.estado)}</p>

            <div className="docs-section">
              <h3>📥 Documentos recibidos</h3>
              <ul>
                {(seleccionado.archivosRecibidos || []).map((a, i) => (
                  <li key={i}>
                    <span>{iconoArchivo(a.nombre)}</span>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">{a.nombre}</a>
                  </li>
                ))}
              </ul>

              <h3>📤 Documentos enviados</h3>
              <ul>
                {(seleccionado.archivosEnviados || []).map((a, i) => (
                  <li key={i}>
                    <span>{iconoArchivo(a.nombre)}</span>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">{a.nombre}</a>
                  </li>
                ))}
              </ul>
            </div>

            <button className="close-modal" onClick={() => setSeleccionado(null)}>✖ Cerrar</button>
          </div>
        </div>
      )}

      {/* ESTILOS */}
      <style jsx>{`
        .container { padding: 20px; background: #f1f5f9; min-height: 100vh; font-family: Arial, sans-serif;}
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo { height: 60px; }
        .system-name { font-size: 1.8rem; font-weight: bold; color: #1e3a8a; }
        .back { padding: 10px 15px; border-radius: 12px; border: none; background: #1d4ed8; color: white; cursor: pointer; font-weight: bold; }
        .search { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #93c5fd; margin-bottom: 20px; }
        .list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .info { display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.9rem; color: #475569; margin-bottom: 10px; }
        .desc { color: #1e40af; margin-bottom: 10px; }
        .actions { display: flex; gap: 10px; flex-wrap: wrap; }
        button { padding: 10px 15px; border-radius: 10px; border: none; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 5px; transition: background 0.3s; }
        .view { background: #2563eb; color: white; }
        .view:hover { background: #1d4ed8; }
        .cancel { background: #ef4444; color: white; }
        .cancel:hover { background: #dc2626; }
        .badge { padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
        .pendiente { background: #fef9c3; color: #ca8a04; }
        .proceso { background: #e0f2fe; color: #0369a1; }
        .aceptada { background: #60a5fa; color: white; }
        .finalizado { background: #dcfce7; color: #16a34a; }
        .cancel { background: #fca5a5; color: white; }
        .rechazado { background: #f87171; color: white; }
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; padding: 10px; }
        .modal-content { background: white; padding: 25px; border-radius: 15px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
        .docs-section h3 { margin-top: 15px; color: #1e3a8a; }
        .docs-section ul { list-style: none; padding-left: 0; }
        .docs-section li { margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
        .docs-section a { color: #2563eb; text-decoration: underline; }
        .close-modal { margin-top: 15px; background: #1d4ed8; color: white; width: 100%; justify-content: center; }
        .no-results { text-align: center; color: #1e40af; font-weight: bold; margin-top: 20px; }
        @media(max-width: 500px){ .info{flex-direction: column; gap:5px;} .actions{flex-direction: column;} }
      `}</style>
    </div>
  );
}