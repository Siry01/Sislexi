"use client";

import { useRouter } from "next/navigation";

export default function FormularioSislexi() {
  const router = useRouter();

  return (
    <div className="main-wrapper">
      {/* NAVBAR: Botones simétricos y fondo limpio */}
      <header className="navbar-sislexi">
        <div className="brand">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" />
          <span className="sislexi-text">SISLEXI</span>
        </div>
        
        {/* Contenedor de botones con el mismo tamaño */}
        <div className="user-controls-container">
          <button className="nav-button" onClick={() => router.back()}>
            <span className="icon">⬅</span> Regresar
          </button>
          <div className="vertical-divider"></div>
          <button className="nav-button" onClick={() => router.push("/login")}>
            <span className="icon orange-icon">🚪</span> Cerrar Sesión
          </button>
        </div>
      </header>

      {/* CUERPO: Fondo gris sólido sin degradados */}
      <main className="content-area">
        <div className="form-card">
          <div className="form-header">
            <h2>Formulario de Trámite Legal</h2>
            <p>Complete los datos para generar su ticket.</p>
          </div>

          <form className="legal-form">
            <div className="form-row">
              <div className="input-group">
                <label>TIPO DE TRÁMITE</label>
                <select><option>Seleccione...</option></select>
              </div>
              <div className="input-group">
                <label>ORGANISMO</label>
                <input type="text" placeholder="Ej: Tribunal Supremo" />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>NIVEL DE URGENCIA</label>
                <select><option>Seleccione...</option></select>
              </div>
              <div className="input-group">
                <label>TELÉFONO DE CONTACTO</label>
                <input type="text" placeholder="Ej: 0412..." />
              </div>
            </div>

            <div className="input-group">
              <label>DESCRIPCIÓN DETALLADA</label>
              <textarea placeholder="Resuma su requerimiento aquí..."></textarea>
            </div>

            <div className="upload-section">
              <span>📎 Adjuntar Documentación (PDF/Fotos)</span>
            </div>

            <button type="submit" className="main-submit-btn">
              + Generar Solicitud
            </button>
          </form>
        </div>
      </main>

      <style jsx>{`
        .main-wrapper {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f4f7f9; /* Gris sólido uniforme */
          margin: 0;
          padding: 0;
        }

        .navbar-sislexi {
          background: white;
          padding: 12px 4%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .brand { display: flex; align-items: center; gap: 12px; }
        .brand img { height: 38px; }
        .sislexi-text { color: #002d72; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.5px; }

        /* Estilo para que los botones sean idénticos */
        .user-controls-container {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .nav-button {
          border: none;
          background: transparent;
          color: #475569;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 45px; /* Altura idéntica */
          min-width: 160px; /* Ancho idéntico */
          padding: 0 20px;
          transition: background 0.2s;
        }

        .nav-button:hover { background: #f1f5f9; }
        .vertical-divider { width: 1px; height: 25px; background: #e2e8f0; }
        .orange-icon { color: #f59e0b; }

        .content-area {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .form-card {
          background: white;
          width: 100%;
          max-width: 750px;
          padding: 30px 40px;
          border-radius: 24px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .form-header h2 { color: #002d72; font-size: 1.5rem; margin: 0; }
        .form-header p { color: #64748b; font-size: 0.9rem; margin-top: 5px; margin-bottom: 25px; }

        .legal-form { display: flex; flex-direction: column; gap: 18px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 0.8rem; font-weight: 700; color: #002d72; }

        input, select, textarea {
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 1rem;
        }

        textarea { height: 90px; resize: none; }

        .upload-section {
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          padding: 15px;
          text-align: center;
          background: #f1f5f9;
          color: #334155;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .main-submit-btn {
          background: #3b82f6; /* Azul sólido SISLEXI */
          color: white;
          border: none;
          padding: 16px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }

        .main-submit-btn:hover { background: #2563eb; transform: translateY(-2px); }

        @media (max-width: 768px) {
          .form-row { grid-template-columns: 1fr; }
          .nav-button { min-width: 120px; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
}