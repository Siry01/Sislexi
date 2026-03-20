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
  .container {
    padding: 20px;
    background: #e2e8f0;
    min-height: 100vh;
    font-family: Arial, sans-serif;
  }

  /* HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    flex-wrap: wrap;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo {
    height: 50px;
  }

  .system-name {
    font-size: 1.6rem;
    font-weight: bold;
    color: #1e3a8a;
  }

  .back {
    padding: 10px 18px;
    border-radius: 12px;
    border: none;
    background: #2563eb;
    color: white;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }

  .back:hover {
    background: #1d4ed8;
  }

  /* BUSCADOR */
  .search {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #60a5fa;
    margin-bottom: 20px;
    outline: none;
    color: #1f2937;
  }

  .search::placeholder {
    color: #6b7280;
  }

  /* LISTA */
  .list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }

  /* CARD */
  .card {
    background: white;
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 6px 15px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    transition: 0.3s;
    color: #1f2937;
  }

  .card:hover {
    transform: translateY(-5px);
    background: #f8fafc;
  }

  .top h3 {
    color: #1e3a8a;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  /* INFO */
  .info {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 0.9rem;
    color: #475569;
    margin-bottom: 10px;
  }

  /* DESCRIPCIÓN */
  .desc {
    color: #374151;
    margin-bottom: 12px;
  }

  /* BOTONES */
  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  button {
    padding: 10px 15px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: 0.3s;
  }

  .view {
    background: #2563eb;
    color: white;
  }

  .view:hover {
    background: #1d4ed8;
  }

  .cancel {
    background: #ef4444;
    color: white;
  }

  .cancel:hover {
    background: #dc2626;
  }

  /* BADGES */
  .badge {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .pendiente {
    background: #fef3c7;
    color: #b45309;
  }

  .proceso {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .aceptada {
    background: #60a5fa;
    color: white;
  }

  .finalizado {
    background: #dcfce7;
    color: #15803d;
  }

  .cancel {
    background: #fca5a5;
    color: white;
  }

  .rechazado {
    background: #f87171;
    color: white;
  }

  /* MODAL */
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
  }

  .modal-content {
    background: white;
    padding: 25px;
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 8px 25px rgba(0,0,0,0.25);
    color: #1f2937;
  }

  .modal-content h2 {
    color: #1e3a8a;
  }

  .docs-section h3 {
    margin-top: 15px;
    color: #1e3a8a;
  }

  .docs-section ul {
    list-style: none;
    padding-left: 0;
  }

  .docs-section li {
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .docs-section a {
    color: #2563eb;
    text-decoration: underline;
  }

  .close-modal {
    margin-top: 15px;
    background: #1d4ed8;
    color: white;
    width: 100%;
    justify-content: center;
  }

  .close-modal:hover {
    background: #1e40af;
  }

  /* MENSAJE VACÍO */
  .no-results {
    text-align: center;
    color: #1e3a8a;
    font-weight: bold;
    margin-top: 20px;
  }

  /* RESPONSIVE */
  @media(max-width: 500px){
    .info {
      flex-direction: column;
      gap: 5px;
    }

    .actions {
      flex-direction: column;
    }
  }
`}</style>
    </div>
  );
}