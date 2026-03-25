"use client";

import { useState } from "react";
import { db, auth } from "../../lib/firebase"; 
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NuevaSolicitud() {
  const router = useRouter();

  const [form, setForm] = useState({
    tipo: "",
    organismo: "",
    urgencia: "",
    descripcion: "",
    telefono: ""
  });

  const [archivos, setArchivos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);

  // 🔥 ESTADO PARA EL NUEVO MODAL (Reemplaza al alert)
  const [mostrarExito, setMostrarExito] = useState(false);
  const [ticketGenerado, setTicketGenerado] = useState("");

  const generarTicket6Digitos = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFiles = (e) => {
    setArchivos(Array.from(e.target.files));
  };

  const convertirBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const enviarSolicitud = async () => {
    const user = auth.currentUser;

    if (!user) { return; }
    if (!form.tipo || !form.descripcion) { return; }

    try {
      setSubiendo(true);
      const ticketId = generarTicket6Digitos();

      let archivosFinal = [];
      if (archivos.length > 0) {
        for (const file of archivos) {
          const base64 = await convertirBase64(file);
          archivosFinal.push({ nombre: file.name, data: base64 });
        }
      }

      await setDoc(doc(db, "solicitudes", ticketId), {
        ...form,
        idTicket: ticketId,
        usuarioId: user.uid,
        estado: "pendiente",
        fecha: serverTimestamp(),
        archivosEnviados: archivosFinal
      });

      // ✅ REEMPLAZAMOS EL ALERT POR EL MODAL
      setTicketGenerado(ticketId);
      setMostrarExito(true);
      setSubiendo(false);

    } catch (error) {
      console.error("Error al enviar:", error);
      setSubiendo(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo-section">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" className="logo" alt="Logo" />
          <div className="title-group">
            <span className="system-name">SISLEXI</span>
            <span className="user-portal">Nueva Solicitud</span>
          </div>
        </div>
        <button onClick={() => router.push("/trabajador")} className="btn-back">⬅ Regresar</button>
      </header>

      <div className="card">
        <div className="card-header-internal">
          <h2>Formulario de Trámite Legal</h2>
          <p>Complete los datos para generar su ticket de atención.</p>
        </div>
        
        <div className="grid">
          <div className="field">
            <label>Tipo de Trámite</label>
            <select name="tipo" onChange={handleChange} value={form.tipo}>
              <option value="">Seleccione...</option>
              <option>Amparo</option>
              <option>Contrato</option>
              <option>Oficio</option>
            </select>
          </div>
          
          <div className="field">
            <label>Organismo</label>
            <input name="organismo" placeholder="Ej: Tribunal Supremo" onChange={handleChange} />
          </div>

          <div className="field">
            <label>Nivel de Urgencia</label>
            <select name="urgencia" onChange={handleChange} value={form.urgencia}>
              <option value="">Seleccione...</option>
              <option>Baja</option>
              <option>Media</option>
              <option>Alta</option>
            </select>
          </div>

          <div className="field">
            <label>Teléfono de contacto</label>
            <input name="telefono" placeholder="Ej: 0412..." onChange={handleChange} />
          </div>
        </div>

        <div className="field full">
          <label>Descripción detallada</label>
          <textarea name="descripcion" placeholder="Explique brevemente su requerimiento legal..." onChange={handleChange} />
        </div>
        
        <div className="upload-box">
          <label className="upload-label">
            <span>📎 Adjuntar Documentación (PDF/Fotos)</span>
            <input type="file" multiple onChange={handleFiles} hidden />
          </label>
          <div className="file-preview">
            {archivos.length > 0 ? (
              archivos.map((f, i) => <div key={i} className="file-tag">📄 {f.name}</div>)
            ) : <span className="no-files">No hay archivos seleccionados</span>}
          </div>
        </div>

        <div className="actions">
          <button className="btn-cancel" onClick={() => router.push("/trabajador")}>Descartar</button>
          <button className="btn-send" onClick={enviarSolicitud} disabled={subiendo}>
            {subiendo ? "Generando Ticket..." : "🚀 Enviar y Generar Ticket"}
          </button>
        </div>
      </div>

      {/* 🔥 MODAL PERSONALIZADO (Aparece en lugar del Alert de localhost) */}
      {mostrarExito && (
        <div className="overlay">
          <div className="success-modal">
            <div className="check-icon">✓</div>
            <h3>¡Solicitud Enviada!</h3>
            <p>Tu requerimiento ha sido procesado con éxito.</p>
            <div className="ticket-display">
              <small>NÚMERO DE TICKET</small>
              <strong>#{ticketGenerado}</strong>
            </div>
            <button className="btn-final" onClick={() => router.push("/trabajador/solicitudes")}>
              Ir a Mis Trámites
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .container { min-height: 100vh; background: #f4f7fa; padding: 40px 20px; font-family: 'Inter', sans-serif; }
        .header { display: flex; justify-content: space-between; align-items: center; max-width: 800px; margin: 0 auto 30px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo { height: 50px; }
        .system-name { font-size: 1.5rem; font-weight: 800; color: #002d72; display: block; }
        .user-portal { font-size: 0.8rem; color: #64748b; font-weight: 600; }
        .btn-back { background: white; border: 1px solid #d1d9e6; padding: 8px 15px; border-radius: 10px; cursor: pointer; color: #002d72; font-weight: 600; }

        .card { background: white; padding: 40px; border-radius: 24px; max-width: 800px; margin: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .card-header-internal { margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
        .card-header-internal h2 { color: #002d72; margin: 0; font-size: 1.4rem; }
        .card-header-internal p { color: #64748b; font-size: 0.9rem; margin: 5px 0 0; }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field label { font-size: 0.8rem; font-weight: 700; color: #1e293b; text-transform: uppercase; }
        
        input, select, textarea { 
          padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; 
          background: #f8fafc; font-size: 0.95rem; transition: border 0.2s;
        }
        
        .full { margin-top: 20px; }
        textarea { min-height: 120px; resize: vertical; }

        .upload-box { margin-top: 25px; background: #f0f9ff; padding: 20px; border-radius: 15px; border: 2px dashed #00a9e0; }
        .upload-label { cursor: pointer; color: #00a9e0; font-weight: 700; display: block; text-align: center; }
        .file-preview { margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px; }
        .file-tag { background: white; padding: 5px 12px; border-radius: 8px; font-size: 0.8rem; border: 1px solid #d1d9e6; }
        .no-files { font-size: 0.8rem; color: #94a3b8; width: 100%; text-align: center; }

        .actions { margin-top: 35px; display: flex; gap: 15px; }
        .btn-cancel { flex: 1; background: #f1f5f9; color: #64748b; border: none; padding: 15px; border-radius: 12px; font-weight: 600; cursor: pointer; }
        .btn-send { flex: 2; background: #002d72; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-send:hover { background: #00a9e0; }

        /* ESTILOS DEL MODAL EXITOSO */
        .overlay { position: fixed; inset: 0; background: rgba(0, 45, 114, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .success-modal { background: white; padding: 40px; border-radius: 28px; text-align: center; width: 90%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); animation: scaleUp 0.3s ease; }
        @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        .check-icon { background: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; font-size: 30px; line-height: 60px; margin: 0 auto 20px; }
        .success-modal h3 { color: #002d72; font-size: 1.5rem; margin-bottom: 10px; }
        .success-modal p { color: #64748b; margin-bottom: 25px; }
        
        .ticket-display { background: #f0f9ff; border: 1px solid #00a9e0; padding: 15px; border-radius: 15px; margin-bottom: 30px; }
        .ticket-display small { display: block; color: #00a9e0; font-weight: 800; font-size: 0.7rem; margin-bottom: 5px; }
        .ticket-display strong { font-size: 2rem; color: #002d72; letter-spacing: 1px; }
        
        .btn-final { background: #002d72; color: white; border: none; width: 100%; padding: 16px; border-radius: 15px; font-weight: 700; cursor: pointer; }

        @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } .actions { flex-direction: column; } }
      `}</style>
    </div>
  );
}