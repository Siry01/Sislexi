"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function RegistrarSolicitud() {
  const router = useRouter();

  const [tipo, setTipo] = useState("Asesoría Jurídica General");
  const [organismo, setOrganismo] = useState("");
  const [urgencia, setUrgencia] = useState("Baja");
  const [codigoArea, setCodigoArea] = useState("0416");
  const [restoTelefono, setRestoTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [documentos, setDocumentos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [estadoProcesamiento, setEstadoProcesamiento] = useState("");
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [ticketGenerado, setTicketGenerado] = useState("");
  const [mostrarModalAlerta, setMostrarModalAlerta] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState("");

  const generarNumeroTicket = (firestoreId) => {
    if (!firestoreId) return "000000";
    let hash = 0;
    for (let i = 0; i < firestoreId.length; i++) {
      hash = firestoreId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const numeroAbsoluto = Math.abs(hash);
    return String((numeroAbsoluto % 900000) + 100000);
  };

  const manejarCambioRestoTelefono = (e) => {
    const soloNumeros = e.target.value.replace(/\D/g, "");
    if (soloNumeros.length <= 7) {
      setRestoTelefono(soloNumeros);
    }
  };

  const optimizarYConvertirImagen = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrlComprimida = canvas.toDataURL("image/jpeg", 0.4);
          resolve(dataUrlComprimida);
        };
      };
    });

  const convertirPdfABase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => resolve(reader.result);
    });

  const manejarArchivos = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (file.type === "application/pdf" && file.size > 2 * 1024 * 1024) {
        dispararAlerta(
          `El PDF "${file.name}" es demasiado pesado. Intente subir una versión de menor tamaño.`
        );
        continue;
      }

      let dataFinal = "";

      if (file.type.startsWith("image/")) {
        dataFinal = await optimizarYConvertirImagen(file);
      } else if (file.type === "application/pdf") {
        dataFinal = await convertirPdfABase64(file);
      } else {
        dispararAlerta(
          "Formato no soportado. Solo se permiten imágenes y archivos PDF."
        );
        continue;
      }

      setDocumentos((prev) => [
        ...prev,
        {
          idTemporal: `${file.name}-${Date.now()}-${Math.random()}`,
          nombre: file.name,
          tipoArchivo: file.type,
          data: dataFinal,
        },
      ]);
    }
    e.target.value = "";
  };

  const eliminarDocumento = (idTemporal) => {
    setDocumentos((prev) => prev.filter((doc) => doc.idTemporal !== idTemporal));
  };

  const dispararAlerta = (mensaje) => {
    setMensajeAlerta(mensaje);
    setMostrarModalAlerta(true);
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (!organismo.trim() || !descripcion.trim()) {
      dispararAlerta("Por favor, rellene todos los campos obligatorios.");
      return;
    }

    if (restoTelefono.length !== 7) {
      dispararAlerta("El número telefónico debe tener exactamente 7 dígitos.");
      return;
    }

    setEnviando(true);
    setEstadoProcesamiento("Validando credenciales...");

    const user = auth.currentUser;

    if (!user) {
      dispararAlerta("Sesión inválida. Inicie sesión nuevamente.");
      setEnviando(false);
      router.push("/login");
      return;
    }

    try {
      setEstadoProcesamiento("Consultando información institucional...");

      const usuarioRef = doc(db, "usuarios", user.uid);
      const usuarioSnap = await getDoc(usuarioRef);

      if (!usuarioSnap.exists()) {
        dispararAlerta("No se encontró la información del trabajador.");
        setEnviando(false);
        return;
      }

      const datosUsuario = usuarioSnap.data();

      setEstadoProcesamiento("Guardando requerimiento legal...");

      const numeroCompleto = `${codigoArea}${restoTelefono}`;

      const nuevaSolicitud = {
        ticket: "",
        trabajadorUid: user.uid,
        nombreTrabajador: datosUsuario.nombre || "",
        cedula: datosUsuario.cedula || "",
        correo: datosUsuario.correo || user.email || "",
        telefono: numeroCompleto,
        p00: datosUsuario.p00 || "",
        departamento: datosUsuario.departamento || "",
        cargo: datosUsuario.cargo || "",
        sede: datosUsuario.sede || "",
        direccion: datosUsuario.direccion || "",
        tipoRequerimiento: tipo,
        organismoDestino: organismo.trim(),
        urgencia: urgencia,
        descripcion: descripcion.trim(),
        documentosAdjuntos: documentos,
        prioridadTopsis: urgencia === "Alta" ? 85 : 35,
        prioridadAHP: urgencia === "Alta" ? 80 : 30,
        nivelPrioridad: urgencia === "Alta" ? "Alta" : "Baja",
        estado: "pendiente",
        abogadoUid: null,
        abogadoNombre: "",
        abogadoCorreo: "",
        citaAgendada: false,
        fechaCita: null,
        horaCita: "",
        observacionFinal: "",
        motivoRechazo: "",
        fechaRegistro: new Date(),
        fechaAsignacion: null,
        fechaCierre: null,
      };

      const docRef = await addDoc(collection(db, "solicitudes"), nuevaSolicitud);

      const ticketCalculado = generarNumeroTicket(docRef.id);
      const ticketFinal = `SISLEXI-${ticketCalculado}`;

      await updateDoc(doc(db, "solicitudes", docRef.id), {
        ticket: ticketFinal,
      });

      setTicketGenerado(ticketFinal);
      setMostrarModalExito(true);
    } catch (error) {
      console.error("Error Firestore:", error);
      dispararAlerta("Error al registrar la solicitud.");
    } finally {
      setEnviando(false);
      setEstadoProcesamiento("");
    }
  };

  return (
    <div className="container-registro">
      {mostrarModalExito && (
        <div className="modal-exito-overlay" role="dialog" aria-modal="true">
          <div className="card-confirmacion-ticket">
            <div className="header-badge-success">
              <span className="icon-check">✓</span>
            </div>
            <h3>¡Registro Procesado con Éxito!</h3>
            <p className="descripcion-modal">
              El requerimiento legal ha sido indexado correctamente en la base de datos de
              SISLEXI.
            </p>
            <div className="ticket-display-container">
              <span className="lbl-ticket-premium">NÚMERO DE TICKET</span>
              <span className="num-ticket-premium">{ticketGenerado}</span>
            </div>
            <button
              type="button"
              className="btn-entendido-modal"
              onClick={() => {
                setMostrarModalExito(false);
                router.push("/trabajador/solicitudes");
              }}
            >
              Continuar al Historial ➔
            </button>
          </div>
        </div>
      )}

      {mostrarModalAlerta && (
        <div className="modal-exito-overlay" role="alertdialog" aria-modal="true">
          <div class="card-confirmacion-ticket border-warning">
            <div className="header-badge-warning">
              <span className="icon-check">!</span>
            </div>
            <h3 className="title-warning">Verifique los Datos</h3>
            <p className="descripcion-modal text-alert-body">{mensajeAlerta}</p>
            <button
              type="button"
              className="btn-entendido-modal btn-warning-action"
              onClick={() => setMostrarModalAlerta(false)}
            >
              Corregir Información
            </button>
          </div>
        </div>
      )}

      <header className="topbar">
        <div className="logo-section">
          <img
            src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png"
            alt="CANTV"
            className="logo-main"
          />
          <h2 className="brand-title">SISLEXI</h2>
        </div>
      </header>

      <main className="form-wrapper" role="main">
        <div className="form-header">
          <h3>Formulario de Requerimiento Legal</h3>
          <p>
            Ingrese minuciosamente los detalles del caso. Todos los campos son
            estrictamente obligatorios.
          </p>
        </div>

        <form onSubmit={manejarEnvio} className="main-form" noValidate>
          <div className="input-group">
            <label htmlFor="tipo">TIPO DE TRÁMITE JURÍDICO *</label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
              disabled={enviando}
            >
              <option value="Asesoría Jurídica General">Asesoría Jurídica General</option>
              <option value="Amparo Constitucional">Amparo Constitucional</option>
              <option value="Reclamación Colectiva LOTTT">Reclamación Colectiva LOTTT</option>
              <option value="Impugnación de Actas">Impugnación de Actas</option>
              <option value="Revisión de Contrato / Convenio">
                Revisión de Contrato / Convenio
              </option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="organismo">ORGANISMO O ENTE DESTINO *</label>
            <input
              id="organismo"
              type="text"
              placeholder="Ej. INPSASEL, Inspectoría del Trabajo"
              value={organismo}
              onChange={(e) => setOrganismo(e.target.value)}
              required
              disabled={enviando}
            />
          </div>

          <div className="input-group">
            <label htmlFor="urgencia">NIVEL DE URGENCIA DEL CASO *</label>
            <select
              id="urgencia"
              value={urgencia}
              onChange={(e) => setUrgencia(e.target.value)}
              required
              disabled={enviando}
            >
              <option value="Baja">Baja (Trámite ordinario / Consultivo)</option>
              <option value="Alta">Alta (Vencimiento de lapsos / Notificación)</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="telefono">TELÉFONO DE CONTACTO DIRECTO *</label>
            <div className="telefono-split-container">
              <select
                id="codigoArea"
                className="select-codigo"
                value={codigoArea}
                onChange={(e) => setCodigoArea(e.target.value)}
                required
                disabled={enviando}
              >
                <option value="0416">0416</option>
                <option value="0426">0426</option>
                <option value="0414">0414</option>
                <option value="0424">0424</option>
                <option value="0412">0412</option>
                <option value="0246">0246</option>
                <option value="0212">0212</option>
              </select>
              <input
                id="restoTelefono"
                type="text"
                placeholder="1234567"
                className="input-resto"
                value={restoTelefono}
                onChange={manejarCambioRestoTelefono}
                maxLength={7}
                required
                pattern="\d{7}"
                title="Debe ingresar 7 números"
                disabled={enviando}
              />
            </div>
          </div>

          <div className="input-group full-width">
            <label htmlFor="descripcion">DESCRIPCIÓN SUSTANTIVA DEL CASO *</label>
            <textarea
              id="descripcion"
              placeholder="Exponga detalladamente los, fechas esenciales..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              disabled={enviando}
              rows={6}
            />
          </div>

          <div className="input-group full-width">
            <label htmlFor="documentos" className="file-dropzone" tabIndex={0}>
              📁 Adjuntar Evidencias (Múltiples imágenes o PDFs optimizados)
              <input
                type="file"
                id="documentos"
                multiple
                onChange={manejarArchivos}
                accept="image/*,application/pdf"
                disabled={enviando}
              />
            </label>

            {documentos.length > 0 && (
              <div className="archivos-cargados-badge-list" aria-live="polite">
                {documentos.map((doc) => (
                  <div key={doc.idTemporal} className="badge-file-item">
                    <span className="file-name-txt" title={doc.nombre}>
                      📄 {doc.nombre}
                    </span>
                    <button
                      type="button"
                      className="btn-remove-file"
                      aria-label={`Eliminar archivo ${doc.nombre}`}
                      onClick={() => eliminarDocumento(doc.idTemporal)}
                      disabled={enviando}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions-footer">
            <button
              type="button"
              className="btn-cancelar-inline"
              onClick={() => router.push("/trabajador/solicitudes")}
              disabled={enviando}
            >
              Cancelar Trámite
            </button>
            <button type="submit" className="btn-submit-form" disabled={enviando}>
              {enviando ? estadoProcesamiento : "Proceder con el Registro 🔒"}
            </button>
          </div>
        </form>
      </main>

      <style jsx>{`
        .container-registro {
          min-height: 100vh;
          background: #f0f4f9;
          padding: 30px 4%;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1e293b;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
        }
        .topbar {
          width: 100%;
          max-width: 750px;
          display: flex;
          align-items: center;
          padding: 18px 0;
          border-bottom: 2px solid #cbd5e1;
          gap: 15px;
          margin-bottom: 30px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-main {
          height: 48px;
          filter: drop-shadow(0 0 5px #1e40afaa);
        }
        .brand-title {
          font-size: 2rem;
          font-weight: 900;
          color: #1e40af;
          letter-spacing: 0.05em;
          user-select: none;
        }
        .form-wrapper {
          background: white;
          box-shadow: 0 10px 34px -8px rgba(30, 64, 175, 0.25);
          border-radius: 24px;
          width: 100%;
          max-width: 750px;
          padding: 40px 40px 50px 40px;
          box-sizing: border-box;
          color: #334155;
        }
        .form-header h3 {
          margin: 0 0 6px;
          font-weight: 700;
          font-size: 1.6rem;
          color: #1e40af;
          user-select: none;
        }
        .form-header p {
          margin: 0 0 28px;
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.4;
          user-select: none;
        }
        .main-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 26px 20px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-group.full-width {
          grid-column: 1 / -1;
        }
        .input-group label {
          font-weight: 700;
          color: #334155;
          font-size: 0.78rem;
          user-select: none;
          letter-spacing: 0.02em;
        }
        .input-group input,
        .input-group select,
        .input-group textarea {
          border: 1.7px solid #cbd5e1;
          border-radius: 16px;
          background: #f9fafb;
          padding: 14px 18px;
          font-size: 1rem;
          color: #1e293b;
          font-weight: 600;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          box-sizing: border-box;
        }
        .input-group input:focus,
        .input-group select:focus,
        .input-group textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 10px #93c5fdaa;
          background: white;
        }
        .input-group textarea {
          resize: vertical;
          min-height: 120px;
        }
        .telefono-split-container {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .select-codigo {
          flex: 0 0 100px;
          font-weight: 600;
          border-radius: 16px;
        }
        .input-resto {
          flex: 2 0 150px;
          min-width: 140px;
          font-weight: 600;
          letter-spacing: 1.3px;
        }
        .file-dropzone {
          border: 2px dashed #93c5fd;
          background: #eff6ff;
          border-radius: 20px;
          padding: 22px;
          cursor: pointer;
          text-align: center;
          user-select: none;
          transition: border-color 0.3s ease, background-color 0.3s ease;
          box-sizing: border-box;
        }
        .file-dropzone:hover,
        .file-dropzone:focus-within {
          border-color: #2563eb;
          background-color: #dbeafe;
        }
        .file-dropzone span {
          font-weight: 700;
          font-size: 1rem;
          color: #2563eb;
        }
        .file-dropzone input {
          display: none;
        }
        .archivos-cargados-badge-list {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          user-select: text;
          max-width: 100%;
          overflow-x: auto;
        }
        .badge-file-item {
          background: #e0e7ff;
          color: #1e40af;
          font-weight: 700;
          font-size: 0.9rem;
          padding: 8px 18px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .btn-remove-file {
          background: transparent;
          border: none;
          color: #ef4444;
          font-weight: 900;
          font-size: 1.3rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          user-select: none;
        }
        .form-actions-footer {
          margin-top: 38px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .btn-submit-form,
        .btn-cancelar-inline {
          padding: 16px 26px;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 20px;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4);
          transition: all 0.3s ease;
          user-select: none;
          border: none;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          flex: 1 1 200px;
          min-width: 140px;
          text-align: center;
        }
        .btn-submit-form {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          max-width: 60%;
          box-shadow: 0 6px 22px rgba(37, 99, 235, 0.7);
        }
        .btn-submit-form:hover,
        .btn-submit-form:focus {
          background: linear-gradient(135deg, #1e40af, #2563eb);
          box-shadow: 0 8px 28px rgba(30, 58, 138, 0.9);
          outline: none;
        }
        .btn-submit-form:disabled {
          background: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
          color: #f1f5f9;
        }
        .btn-cancelar-inline {
          background: white;
          border: 2px solid #cbd5e1;
          color: #334155;
        }
        .btn-cancelar-inline:hover,
        .btn-cancelar-inline:focus {
          background: #e2e8f0;
          border-color: #2563eb;
          color: #2563eb;
          outline: none;
        }
        .modal-exito-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 6000;
          animation: fadeIn 0.3s ease-out;
        }
        .card-confirmacion-ticket {
          background: white;
          width: 480px;
          max-width: 95vw;
          padding: 36px 40px;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .header-badge-success {
          background: #dcfce7;
          color: #15803d;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 26px;
          font-size: 2rem;
          font-weight: 900;
          user-select: none;
        }
        .header-badge-warning {
          background: #fee2e2;
          color: #ef4444;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 26px;
          font-size: 2rem;
          font-weight: 900;
          user-select: none;
        }
        .card-confirmacion-ticket h3 {
          color: #1e293b;
          margin-bottom: 14px;
          font-weight: 900;
          font-size: 1.4rem;
          user-select: none;
        }
        .descripcion-modal {
          color: #64748b;
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 28px;
          user-select: none;
        }
        .ticket-display-container {
          background: #eff6ff;
          border: 1.5px dashed #2563eb;
          width: 100%;
          padding: 22px 24px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 30px;
          box-sizing: border-box;
          user-select: none;
        }
        .lbl-ticket-premium {
          font-size: 0.75rem;
          font-weight: 900;
          color: #2563eb;
          letter-spacing: 1.5px;
        }
        .num-ticket-premium {
          font-family: monospace;
          font-size: 2.5rem;
          font-weight: 900;
          color: #2563eb;
          letter-spacing: 3px;
          line-height: 1.1;
        }
        .btn-entendido-modal {
          background: #2563eb;
          color: white;
          border: none;
          width: 100%;
          padding: 18px 20px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          user-select: none;
        }
        .btn-entendido-modal:hover,
        .btn-entendido-modal:focus {
          background: #1e40af;
          box-shadow: 0 8px 28px rgb(30 58 138 / 0.85);
          outline: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (max-width: 640px) {
          .main-form {
            grid-template-columns: 1fr !important;
          }
          .form-actions-footer {
            flex-direction: column;
            gap: 14px;
          }
          .btn-submit-form,
          .btn-cancelar-inline {
            max-width: 100% !important;
            width: 100% !important;
          }
            
/* Header: logo, título y raya */
.topbar {
  width: 100%;
  max-width: 750px;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Logo a la izquierda, botones a la derecha */
  padding: 0 20px; /* para que no quede muy pegado a los bordes */
  border-bottom: 2px solid #cbd5e1;
  height: 85px;
  box-sizing: border-box;
  margin: 0 auto 30px auto;
  user-select: none;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-main {
  height: 48px;
  filter: drop-shadow(0 0 5px #1e40afaa);
}

.brand-title {
  font-size: 2rem;
  font-weight: 900;
  color: #1e40af;
  letter-spacing: 0.05em;
}


/* Botones con tamaños y estilos iguales */
.btn-cancelar-inline,
.btn-submit-form {
  min-width: 140px;
  height: 44px;
  padding: 0 22px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease;
  user-select: none;
}

/* Botón regresar */
.btn-cancelar-inline {
  background: #fff;
  border: 2px solid #cbd5e1;
  color: #334155;
}

.btn-cancelar-inline:hover,
.btn-cancelar-inline:focus {
  background: #e2e8f0;
  border-color: #2563eb;
  color: #2563eb;
  outline: none;
}

/* Botón enviar */
.btn-submit-form {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  box-shadow: 0 6px 22px rgba(37, 99, 235, 0.7);
}

.btn-submit-form:hover,
.btn-submit-form:focus {
  background: linear-gradient(135deg, #1e40af, #2563eb);
  box-shadow: 0 8px 28px rgba(30, 58, 138, 0.9);
  outline: none;
}

.btn-submit-form:disabled {
  background: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
  color: #f1f5f9;
}

/* Responsive: apilar en móviles */
@media (max-width: 640px) {
  .topbar {
    flex-direction: column;
    height: auto;
    padding: 12px;
  }

  .logo-section {
    margin-bottom: 16px;
  }

  .top-buttons {
    width: 100%;
    justify-content: space-between;
    gap: 12px;
  }

  .topbar {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Logo a la izquierda, botones a la derecha */
  padding: 0 20px;
  border-bottom: 2px solid #cbd5e1;
  height: 85px; /* fija la altura para buena alineación */
  max-width: 750px;
  margin: 0 auto 30px auto;
  box-sizing: border-box;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-main {
  height: 48px;
  filter: drop-shadow(0 0 5px #1e40afaa);
}

.brand-title {
  font-size: 2rem;
  font-weight: 900;
  color: #1e40af;
  letter-spacing: 0.05em;
  user-select: none;
}

.top-buttons {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: nowrap; /* Evita que se quiebren en varias líneas */
}

.btn-cancelar-inline,
.btn-submit-form {
  min-width: 140px;
  height: 44px;
  padding: 0 22px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease;
  user-select: none;
}

/* Estilos botónes */
.btn-cancelar-inline {
  background: white;
  border: 2px solid #cbd5e1;
  color: #334155;
}

.btn-cancelar-inline:hover,
.btn-cancelar-inline:focus {
  background: #e2e8f0;
  border-color: #2563eb;
  color: #2563eb;
  outline: none;
}

.btn-submit-form {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  box-shadow: 0 6px 22px rgba(37, 99, 235, 0.7);
}

.btn-submit-form:hover,
.btn-submit-form:focus {
  background: linear-gradient(135deg, #1e40af, #2563eb);
  box-shadow: 0 8px 28px rgba(30, 58, 138, 0.9);
  outline: none;
}

.btn-submit-form:disabled {
  background: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
  color: #f1f5f9;
}

/* Adaptación móvil: apilar correctamente */
@media (max-width: 640px) {
  .topbar {
    flex-direction: column;
    height: auto;
    padding: 12px;
  }

  .logo-section {
    margin-bottom: 16px;
  }

  .top-buttons {
    flex-wrap: wrap;
    width: 100%;
    gap: 12px;
    justify-content: flex-start;
  }

  .btn-cancelar-inline,
  .btn-submit-form {
    width: calc(50% - 6px);
    min-width: unset;
    height: 42px;
  }
}

      `}</style>
    </div>
  );
}
