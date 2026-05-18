"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth, storage } from "../../lib/firebase"; // 👈 IMPORTACIÓN DIRECTA Y SEGURA DEL STORAGE
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { registrarAuditoriaReal } from "../../lib/auditoria";

export default function FormularioSislexi() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [ticketGenerado, setTicketGenerado] = useState(null);
  
  const [form, setForm] = useState({ 
    tipo: "", organismo: "", urgencia: "", telefono: "", descripcion: "" 
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setArchivos(Array.from(e.target.files));
  const generarTicket = () => Math.floor(100000 + Math.random() * 900000).toString();

  // 🧠 MOTOR MATEMÁTICO ALGORÍTMICO HÍBRIDO (AHP + TOPSIS) - REAL
  const calcularPrioridadTopsis = (tipo, urgencia) => {
    const pesoC1 = 0.60;
    const pesoC2 = 0.40;

    let valorC1 = 20; 
    if (tipo === "Amparo Constitucional") valorC1 = 100;
    else if (tipo === "Reclamación Colectiva LOTTT") valorC1 = 80;
    else if (tipo === "Impugnación de Actas") valorC1 = 60;
    else if (tipo === "Revisión de Contrato / Convenio") valorC1 = 40;

    let valorC2 = 30; 
    if (urgencia === "Alta") valorC2 = 100;

    const normC1 = valorC1 / Math.sqrt(Math.pow(valorC1, 2) + Math.pow(20, 2));
    const normC2 = valorC2 / Math.sqrt(Math.pow(valorC2, 2) + Math.pow(30, 2));

    const v1 = normC1 * pesoC1;
    const v2 = normC2 * pesoC2;

    const v1_ideal_positivo = 1.0 * pesoC1;
    const v2_ideal_positivo = 1.0 * pesoC2;
    const v1_ideal_negativo = 0.1 * pesoC1;
    const v2_ideal_negativo = 0.1 * pesoC2;

    const S_positivo = Math.sqrt(Math.pow(v1 - v1_ideal_positivo, 2) + Math.pow(v2 - v2_ideal_positivo, 2));
    const S_negativo = Math.sqrt(Math.pow(v1 - v1_ideal_negativo, 2) + Math.pow(v2 - v2_ideal_negativo, 2));

    const coeficienteProximidad = S_negativo / (S_positivo + S_negativo);
    return Math.round(coeficienteProximidad * 100);
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setLoading(true);
    const idTicket = generarTicket();
    const user = auth.currentUser;
    
    const scorePrioridadMatematico = calcularPrioridadTopsis(form.tipo, form.urgencia);
    const uploadedFilesData = [];

    try {
      // 🚀 SUBIDA EN CALIENTE AL STORAGE EXPORTADO
      if (archivos.length > 0) {
        for (const archivo of archivos) {
          const pathRef = `solicitudes/${idTicket}/${archivo.name}`;
          const storageRef = ref(storage, pathRef); // Usa la instancia importada directamente
          
          // Ejecuta la carga binaria en la nube
          const uploadResult = await uploadBytes(storageRef, archivo);
          // Descarga el link público real persistente
          const downloadUrl = await getDownloadURL(uploadResult.ref);
          
          uploadedFilesData.push({
            nombre: archivo.name,
            url: downloadUrl
          });
        }
      }

      // 📝 REGISTRO EN LA BASE DE DATOS FIRESTORE
      await setDoc(doc(db, "solicitudes", idTicket), {
        idTicket,
        usuarioId: user?.uid || "uid-anonimo-trabajador",
        nombreSolicitante: user?.displayName || "Trabajador CANTV",
        tipo: form.tipo,
        organismo: form.organismo,
        urgencia: form.urgencia,
        telefono: form.telefono,
        descripcion: form.descripcion,
        prioridadTopsis: scorePrioridadMatematico, 
        estado: "pendiente",
        fecha: serverTimestamp(), 
        nombresArchivos: archivos.map(f => f.name),
        urlsArchivos: uploadedFilesData 
      });

      // Bitácora de auditoría real
      await registrarAuditoriaReal(
        "Generación Solicitud", 
        "SOLICITUDES", 
        "success", 
        `Ticket #${idTicket} creado con Índice TOPSIS del ${scorePrioridadMatematico}%`, 
        user?.displayName || "Trabajador", 
        "TRABAJADOR"
      );
      
      setTicketGenerado(idTicket);
    } catch (error) {
      console.error("Error crítico de persistencia en SISELXI:", error);
      alert("Hubo un inconveniente al comunicarse con la base de datos de Firebase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      {ticketGenerado && (
        <div className="modal-overlay">
          <div className="modal-success">
            <div className="icon-check">✓</div>
            <h2>Registro Exitoso</h2>
            <p>Su solicitud ha sido procesada por SISELXI e introducida en la base de datos jurídica.</p>
            <div className="ticket-info">
              <span>NÚMERO DE TICKET</span>
              <h3>#{ticketGenerado}</h3>
            </div>
            <button className="btn-confirm" onClick={() => router.push("/trabajador/solicitudes")}>
              Ir a mis solicitudes
            </button>
          </div>
        </div>
      )}

      <header className="navbar-sislexi">
        <div className="brand">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" className="logo-img" alt="CANTV" />
          <span className="logo-text">SISLEXI</span>
        </div>
        <button className="btn-nav" onClick={() => router.back()}>⬅ Regresar</button>
      </header>

      <main className="container">
        <div className="card">
          <div className="card-header">
            <h3>Nuevo Trámite Legal Inteligente</h3>
            <p>Complete los campos obligatorios. La información se registrará de manera íntegra en los servicios cloud de la Sede San Juan II.</p>
          </div>

          <form className="legal-form" onSubmit={enviarSolicitud}>
            <div className="form-grid">
              <div className="group">
                <label>TIPO DE TRÁMITE *</label>
                <select name="tipo" value={form.tipo} onChange={handleChange} required>
                  <option value="">Seleccione...</option>
                  <option value="Amparo Constitucional">Amparo Constitucional</option>
                  <option value="Reclamación Colectiva LOTTT">Reclamación Colectiva LOTTT</option>
                  <option value="Impugnación de Actas">Impugnación de Actas</option>
                  <option value="Revisión de Contrato / Convenio">Revisión de Contrato / Convenio</option>
                  <option value="Asesoría Jurídica General">Asesoría Jurídica General</option>
                </select>
              </div>

              <div className="group">
                <label>ORGANISMO DESTINO *</label>
                <input name="organismo" type="text" placeholder="Ej: Consultoría / Inspectoría" value={form.organismo} onChange={handleChange} required />
              </div>

              <div className="group">
                <label>URGENCIA DECLARADA *</label>
                <select name="urgencia" value={form.urgencia} onChange={handleChange} required>
                  <option value="">Seleccione...</option>
                  <option value="Baja">Baja (Trámite Ordinario)</option>
                  <option value="Alta">Alta (Riesgo de Sanción / Multa)</option>
                </select>
              </div>

              <div className="group">
                <label>TELÉFONO DE CONTACTO *</label>
                <input name="telefono" type="tel" placeholder="0412..." value={form.telefono} onChange={handleChange} required />
              </div>
            </div>

            <div className="group full-width">
              <label>DESCRIPCIÓN DETALLADA DE MOTIVOS *</label>
              <textarea name="descripcion" placeholder="Explique detalladamente los hechos reales para la ponderación del caso..." value={form.descripcion} onChange={handleChange} required></textarea>
            </div>

            <div className="file-section">
              <label className="file-label">
                <input type="file" multiple onChange={handleFileChange} hidden />
                <span>📎 Adjuntar Documentación Sustentatoria (PDF/Fotos)</span>
              </label>
              <div className="file-list">
                {archivos.map((f, i) => <span key={i} className="file-item">📄 {f.name}</span>)}
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Subiendo Adjuntos y Calculando..." : "+ Generar Solicitud con Priorización"}
            </button>
          </form>
        </div>
      </main>

      <style jsx>{`
        .main-wrapper { min-height: 100vh; background: #f4f6f9; font-family: 'Inter', sans-serif; letter-spacing: -0.15px; }
        .navbar-sislexi { height: 75px; background: white; padding: 0 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #002d72; }
        .logo-img { height: 42px; }
        .logo-text { color: #002d72; font-weight: 900; font-size: 1.3rem; letter-spacing: -0.5px; }
        .btn-nav { padding: 9px 18px; border-radius: 10px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-weight: 700; color: #475569; font-size: 0.85rem; }
        .container { display: flex; justify-content: center; padding: 30px 20px; }
        .card { background: white; width: 100%; max-width: 800px; padding: 35px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.02); }
        .card-header { margin-bottom: 25px; text-align: left; }
        .card-header h3 { color: #002d72; font-size: 1.4rem; margin: 0; font-weight: 800; }
        .card-header p { color: #64748b; font-size: 0.85rem; margin: 5px 0; font-weight: 500; }
        .legal-form { display: flex; flex-direction: column; gap: 18px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; width: 100%; }
        .group { display: flex; flex-direction: column; gap: 6px; text-align: left; }
        .group label { font-size: 0.7rem; font-weight: 800; color: #002d72; letter-spacing: 0.5px; }
        input, select, textarea { padding: 11px 14px; border: 1px solid #cbd5e1; border-radius: 10px; background: #f8fafc; font-size: 0.9rem; width: 100%; box-sizing: border-box; font-family: inherit; font-weight: 600; color: #1e293b; outline: none; }
        input:focus, select:focus, textarea:focus { border-color: #002d72; background: white; }
        .full-width { width: 100%; }
        textarea { height: 110px; resize: none; }
        .file-section { border: 2px dashed #cbd5e1; padding: 20px; border-radius: 14px; text-align: center; background: #f8fafc; cursor: pointer; }
        .file-label { cursor: pointer; font-weight: 700; color: #475569; display: block; font-size: 0.85rem; }
        .file-list { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .file-item { background: #eff6ff; color: #1e40af; padding: 5px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; border: 1px solid #bfdbfe; }
        .btn-submit { background: #002d72; color: white; border: none; padding: 15px; border-radius: 14px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(0,45,114,0.15); }
        .btn-submit:hover { background: #001a45; transform: translateY(-1px); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0, 45, 114, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-success { background: white; padding: 35px; border-radius: 24px; text-align: center; width: 380px; border: 1px solid #e2e8f0; }
        .icon-check { width: 55px; height: 55px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 15px; box-shadow: 0 4px 10px rgba(16,185,129,0.3); }
        .modal-success h2 { font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0; }
        .modal-success p { font-size: 0.85rem; color: #64748b; margin: 6px 0 0 0; font-weight: 500; }
        .ticket-info { background: #f8fafc; padding: 15px; border-radius: 16px; margin: 15px 0; border: 1px solid #e2e8f0; }
        .ticket-info span { font-size: 0.7rem; font-weight: 800; color: #64748b; letter-spacing: 1px; }
        .ticket-info h3 { color: #002d72; font-size: 1.8rem; margin: 4px 0 0 0; font-weight: 900; letter-spacing: 1px; }
        .btn-confirm { width: 100%; background: #002d72; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
        @media (max-width: 650px) { .form-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}