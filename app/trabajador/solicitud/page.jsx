"use client";

import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleFiles = (e) => {
    setArchivos(Array.from(e.target.files));
  };

  // 🔥 convertir archivos
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

    if (!user) {
      alert("Usuario no autenticado");
      return;
    }

    try {
      setSubiendo(true);

      let archivosFinal = [];

      if (archivos.length > 0) {
        const lista = [];

        for (const file of archivos) {
          const base64 = await convertirBase64(file);
          lista.push({
            nombre: file.name,
            data: base64
          });
        }

        archivosFinal = lista;
      }

      await addDoc(collection(db, "solicitudes"), {
        ...form,
        usuarioId: user.uid,
        estado: "pendiente",
        fecha: serverTimestamp(),
        archivosEnviados: archivosFinal
      });

      // 🔥 REDIRECCIÓN QUE NO FALLA
      window.location.href = "/trabajador/solicitudes";

    } catch (error) {
      console.error(error);
      alert("Error al enviar solicitud");
      setSubiendo(false);
    }
  };

  return (
    <div className="container">

      {/* HEADER */}
      <header className="header">
        <div className="logo-section">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" className="logo" />
          <h1>Sislexi</h1>
        </div>

        <button onClick={() => router.push("/trabajador")} className="btn-back">
          ⬅ Regresar
        </button>
      </header>

      <div className="card">

        <h2>Nueva Solicitud</h2>
        <p className="subtitle">Completa la información del trámite</p>

        {/* FORM */}
        <div className="grid">

          <select name="tipo" onChange={handleChange}>
            <option value="">Tipo</option>
            <option>Amparo</option>
            <option>Contrato</option>
            <option>Oficio</option>
          </select>

          <input
            name="organismo"
            placeholder="Organismo"
            onChange={handleChange}
          />

          <select name="urgencia" onChange={handleChange}>
            <option value="">Urgencia</option>
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
          </select>

          <input
            name="telefono"
            placeholder="Teléfono"
            onChange={handleChange}
          />

        </div>

        <textarea
          name="descripcion"
          placeholder="Describe tu solicitud..."
          onChange={handleChange}
        />

        {/* ARCHIVOS */}
        <div className="upload">
          <label>📎 Adjuntar documentos</label>
          <input type="file" multiple onChange={handleFiles} />

          {archivos.length > 0 && (
            <div className="files">
              {archivos.map((f, i) => (
                <span key={i}>📄 {f.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* BOTONES */}
        <div className="buttons">

          <button
            className="cancel"
            onClick={() => router.push("/trabajador")}
          >
            Cancelar
          </button>

          <button
            className="send"
            onClick={enviarSolicitud}
            disabled={subiendo}
          >
            {subiendo ? "⏳ Enviando..." : "🚀 Enviar Solicitud"}
          </button>

        </div>

      </div>

      {/* ESTILOS BONITOS */}
      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #e8eaee, #fbfdff);
          padding: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          margin-bottom: 20px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo {
          height: 60px;
        }

        h1 {
          font-size: 1.8rem;
        }

        .btn-back {
          background: white;
          color: #1e3a8a;
          border: none;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
        }

        .card {
          background: white;
          padding: 25px;
          border-radius: 20px;
          max-width: 800px;
          margin: auto;
        }

        h2 {
          color: #1e3a8a;
        }

        .subtitle {
          color: gray;
          margin-bottom: 15px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        input, select, textarea {
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #462ad5;
          width: 100%;
        }

        textarea {
          margin-top: 10px;
          min-height: 100px;
        }

        .upload {
          margin-top: 10px;
        }

        .files {
          margin-top: 5px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .buttons {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }

        .cancel {
          flex: 1;
          background: #1260c7;
          border: none;
          padding: 10px;
          border-radius: 10px;
        }

        .send {
          flex: 2;
          background: #1e3a8a;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 10px;
        }

        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}