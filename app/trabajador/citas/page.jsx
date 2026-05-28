"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";

export default function MisCitasTrabajador() {
  const router = useRouter();
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "citas"), where("usuarioId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      // Ordenar por fecha (más cercanas primero)
      docs.sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita));
      setCitas(docs);
    });

    return () => unsubscribe();
  }, []);

  const cancelarCita = async (id) => {
    if (confirm("¿Estás seguro de cancelar esta cita?")) {
      await deleteDoc(doc(db, "citas", id));
    }
  };

  return (
    <div className="container-citas">
      <header className="topbar">
        <div className="logo-section">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" className="logo-main" alt="CANTV" />
          <h2 className="brand-title">SISLEXI</h2>
        </div>
        <button className="btn-volver" onClick={() => router.push("/trabajador")}>🚪 Volver</button>
      </header>

      <main className="main-layout">
        <div className="section-title">
          <h2>🗓️ Mis Citas Agendadas</h2>
          <p>Gestión de encuentros presenciales o virtuales con el área legal.</p>
        </div>

        <div className="citas-grid">
          {citas.length > 0 ? citas.map((cita) => (
            <div key={cita.id} className="cita-card">
              <div className="cita-info">
                <h4>{cita.motivo}</h4>
                <p><strong>👤 Abogado:</strong> {cita.abogadoNombre}</p>
                <p><strong>📅 Fecha:</strong> {new Date(cita.fechaCita).toLocaleDateString()}</p>
                <p><strong>⏰ Hora:</strong> {cita.horaCita}</p>
                <span className={`status-badge ${cita.estado}`}>{cita.estado || "Programada"}</span>
              </div>
              
              {cita.estado !== "finalizada" && (
                <button className="btn-cancelar" onClick={() => cancelarCita(cita.id)}>
                  ❌ Cancelar Cita
                </button>
              )}
            </div>
          )) : (
            <div className="empty-state">📭 No tienes citas agendadas actualmente.</div>
          )}
        </div>
      </main>

  <style jsx>{`
  .container-citas { 
    min-height: 100vh; 
    background-color: #f4f6f9; 
    padding: 0 4% 40px; 
    font-family: 'Inter', sans-serif; 
  }
  
  .topbar { 
    height: 85px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
  }
  
  .logo-section { display: flex; align-items: center; gap: 12px; }
  .logo-main { height: 45px; }
  .brand-title { color: #002d72; font-size: 1.4rem; font-weight: 900; margin: 0; }
  
  .btn-volver { 
    padding: 9px 20px; 
    border-radius: 10px; 
    border: 1px solid #cbd5e1; 
    background: white; 
    cursor: pointer; 
    font-weight: 700; 
    color: #475569; 
    transition: 0.2s;
  }
  .btn-volver:hover { background: #f8fafc; }

  .section-title { margin-bottom: 25px; }
  .section-title h2 { color: #0f172a; font-weight: 800; font-size: 1.4rem; margin: 0; }
  .section-title p { color: #64748b; font-size: 0.85rem; margin: 4px 0 0; }

  .citas-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
    gap: 20px; 
  }
  
  .cita-card { 
    background: white; 
    padding: 24px; 
    border-radius: 20px; 
    border: 1px solid #e2e8f0; 
    display: flex; 
    flex-direction: column; 
    gap: 15px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .cita-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }

  .cita-info h4 { margin: 0; color: #002d72; font-size: 1.1rem; font-weight: 800; }
  .cita-info p { margin: 8px 0 0 0; color: #475569; font-size: 0.85rem; }
  .cita-info p strong { color: #1e293b; }

  .status-badge { 
    display: inline-block; 
    padding: 4px 12px; 
    border-radius: 8px; 
    font-size: 0.75rem; 
    font-weight: 800; 
    text-transform: uppercase; 
    margin-top: 15px;
    width: fit-content;
  }
  .status-badge.programada { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .status-badge.finalizada { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  
  .btn-cancelar { 
    background: white; 
    color: #b91c1c; 
    border: 1px solid #fca5a5; 
    padding: 10px; 
    border-radius: 10px; 
    cursor: pointer; 
    font-weight: 700; 
    font-size: 0.8rem;
    transition: 0.2s;
  }
  .btn-cancelar:hover { background: #fef2f2; border-color: #ef4444; }

  .empty-state { 
    grid-column: 1 / -1; 
    text-align: center; 
    padding: 60px; 
    color: #94a3b8; 
    font-style: italic; 
    background: white;
    border: 2px dashed #e2e8f0;
    border-radius: 20px;
  }
`}</style>
    </div>
  );
}