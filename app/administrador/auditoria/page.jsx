"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase"; 
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function Auditoria() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, "auditoria"), orderBy("fecha", "desc"), limit(150));
        const querySnapshot = await getDocs(q);
        
        const docs = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const d = new Date(data.fecha);
          const fechaFinal = d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return {
            id: doc.id,
            ...data,
            fechaCompleta: fechaFinal,
            responsable: data.responsable || data.usuarioP00 || "SISTEMA",
            estadoTexto: (data.tipo === "success" || data.resultado === "Exitoso") ? "EXITOSO" : "FALLIDO",
            // Si el registro es viejo y no tiene IP, ponemos un guion
            origenIp: data.dispositivo || "IP no registrada"
          };
        });
        setLogs(docs);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  return (
    <div className="container">
      <header className="header-audit">
        <div className="brand-group">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" className="logo-cantv" />
          <div className="v-line"></div>
          <div className="title-box">
            <h1>SISELXI</h1>
            <p>Monitoreo de Seguridad de Red - CANTV</p>
          </div>
        </div>
        <div className="ip-live">SISTEMA DE TRAZABILIDAD IP ACTIVO</div>
        <button className="btn-return" onClick={() => router.push("/administrador")}>Volver</button>
      </header>

      <main className="content">
        <div className="monitor-card">
          <div className="table-responsive">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>FECHA / HORA</th>
                  <th>RESPONSABLE / ROL</th>
                  <th>ACCIÓN</th>
                  <th>ESTADO</th>
                  <th>IP Y ORIGEN</th>
                  <th>DETALLE TÉCNICO</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="loading">Cargando registros forenses...</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id}>
                    <td className="time-col">{log.fechaCompleta}</td>
                    <td className="user-col">
                      <span className="name">{log.responsable}</span>
                      <span className={`role-tag ${(log.rol || "admin").toLowerCase()}`}>{log.rol || "ADMIN"}</span>
                    </td>
                    <td className="action-col">{log.accion}</td>
                    <td>
                      <span className={`status-pill ${log.estadoTexto.toLowerCase()}`}>
                        {log.estadoTexto}
                      </span>
                    </td>
                    <td className="ip-col">
                        <span className="ip-text">🌐 {log.origenIp}</span>
                    </td>
                    <td className="detail-col">{log.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <style jsx>{`
        .container { min-height: 100vh; background: #f0f2f5; padding: 0 30px; font-family: sans-serif; }
        .header-audit { height: 90px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #003366; }
        .brand-group { display: flex; align-items: center; gap: 15px; }
        .logo-cantv { height: 45px; }
        .v-line { width: 1px; height: 30px; background: #ccc; }
        .title-box h1 { margin: 0; color: #003366; font-size: 1.5rem; font-weight: 900; }
        .title-box p { margin: 0; font-size: 0.75rem; color: #666; font-weight: bold; }
        .ip-live { background: #003366; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; }
        .btn-return { background: white; border: 2px solid #003366; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .monitor-card { background: white; margin-top: 20px; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .audit-table { width: 100%; border-collapse: collapse; }
        .audit-table th { background: #003366; color: white; padding: 12px; text-align: left; font-size: 0.7rem; text-transform: uppercase; }
        .audit-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 0.8rem; }
        .time-col { color: #2563eb; font-weight: bold; font-family: monospace; }
        .user-col { display: flex; flex-direction: column; }
        .name { font-weight: 800; color: #1e293b; }
        .role-tag { font-size: 0.6rem; font-weight: 900; padding: 2px 5px; border-radius: 4px; width: fit-content; text-transform: uppercase; margin-top: 3px; }
        .role-tag.admin { background: #e0f2fe; color: #0369a1; }
        .status-pill { padding: 4px 10px; border-radius: 50px; font-size: 0.7rem; font-weight: 900; }
        .status-pill.exitoso { background: #d1fae5; color: #065f46; }
        .status-pill.fallido { background: #fee2e2; color: #991b1b; }
        .ip-col { font-weight: bold; color: #475569; }
        .ip-text { background: #f8fafc; padding: 4px 8px; border-radius: 5px; border: 1px solid #e2e8f0; }
      `}</style>
    </div>
  );
}