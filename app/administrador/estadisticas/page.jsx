"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

export default function EstadisticasPremiumFinal() {
  const router = useRouter();
  const [dataFull, setDataFull] = useState([]);
  const [statsGrafico, setStatsGrafico] = useState([]);
  const [statsEstado, setStatsEstado] = useState([]);
  const [indicadores, setIndicadores] = useState({ total: 0, eficiencia: 0, criticos: 0 });
  const [filtroTiempo, setFiltroTiempo] = useState("mes"); 
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formato, setFormato] = useState("pdf");
  const [loading, setLoading] = useState(true);

  const [columnas, setColumnas] = useState({
    idTicket: true, tipo: true, organismo: true, usuarioNombre: true,
    abogadoAtendio: true, fecha: true, hora: true, estado: true
  });

  const COLORS = ["#002d72", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

  useEffect(() => { fetchData(); }, [filtroTiempo]);

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "solicitudes"));
      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let f = null;
        if (data.fecha && typeof data.fecha.toDate === 'function') f = data.fecha.toDate();
        else if (data.fecha) f = new Date(data.fecha);
        if (!f || isNaN(f.getTime())) return null;

        return { 
          ...data, f, 
          fechaStr: f.toLocaleDateString(),
          mes: f.toLocaleString('es-ES', { month: 'short' }),
          año: f.getFullYear().toString(),
          dia: f.getDate() + "/" + (f.getMonth() + 1)
        };
      }).filter(d => d !== null);

      setDataFull(docs);
      procesarEstadisticas(docs);
      calcularKPIs(docs);
      setLoading(false);
    } catch (e) { 
      console.error(e);
      setLoading(false); 
    }
  };

  const calcularKPIs = (docs) => {
    const total = docs.length;
    const finalizados = docs.filter(d => (d.estado || "").toUpperCase() === "FINALIZADO").length;
    const criticos = docs.filter(d => (d.urgencia || "").toUpperCase() === "ALTA").length;
    const eficiencia = total > 0 ? ((finalizados / total) * 100).toFixed(1) : "0.0";
    setIndicadores({ total, eficiencia, criticos });
  };

  const procesarEstadisticas = (docs) => {
    let agrupT = {};
    docs.forEach(d => {
      const clave = filtroTiempo === "dia" ? d.dia : filtroTiempo === "mes" ? d.mes : d.año;
      agrupT[clave] = (agrupT[clave] || 0) + 1;
    });
    setStatsGrafico(Object.keys(agrupT).map(k => ({ label: k, cantidad: agrupT[k] })));

    let agrupE = {};
    docs.forEach(d => {
      const est = (d.estado || "PENDIENTE").toUpperCase();
      agrupE[est] = (agrupE[est] || 0) + 1;
    });
    setStatsEstado(Object.keys(agrupE).map(k => ({ name: k, value: agrupE[k] })));
  };

  const ejecutarExportacion = async () => {
    if (typeof window === "undefined") return;

    const dataExportar = dataFull.map(item => {
      let obj = {};
      if (columnas.idTicket) obj["Ticket"] = item.idTicket || "N/A";
      if (columnas.tipo) obj["Trámite"] = item.tipo || "N/A";
      if (columnas.organismo) obj["Organismo"] = item.organismo || "N/A";
      if (columnas.usuarioNombre) obj["Solicitante"] = item.usuarioNombre || "N/A";
      if (columnas.abogadoAtendio) obj["Abogado"] = item.abogadoAtendio || "Pendiente";
      if (columnas.fecha) obj["Fecha"] = item.fechaStr;
      if (columnas.estado) obj["Estatus"] = item.estado || "PENDIENTE";
      return obj;
    });

    try {
      if (formato === "excel") {
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(dataExportar);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Solicitudes");
        XLSX.writeFile(wb, `Reporte_SISLEXI_${Date.now()}.xlsx`);
      } else {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(18);
        doc.setTextColor(0, 45, 114);
        doc.text("CANTV - SISLEXI: REPORTE ESTRATÉGICO", 14, 20);
        
        autoTable(doc, {
          head: [Object.keys(dataExportar[0])],
          body: dataExportar.map(obj => Object.values(obj)),
          startY: 30,
          theme: 'grid',
          headStyles: { fillColor: [0, 45, 114] }
        });
        doc.save(`Reporte_SISLEXI_${Date.now()}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert("Error al generar archivo");
    }
    setMostrarModal(false);
  };

  if (loading) return <div className="loader">Sincronizando ...</div>;

  return (
    <div className="page-container">
      <AnimatePresence>
        {mostrarModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal-card">
              <div className="modal-header">
                <h3>Opciones de Reporte</h3>
                <button onClick={() => setMostrarModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="checks-grid">
                  {Object.keys(columnas).map(col => (
                    <label key={col} className="check-item">
                      <input type="checkbox" checked={columnas[col]} onChange={() => setColumnas({...columnas, [col]: !columnas[col]})} />
                      <span>{col.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
                <div className="format-row">
                  <button className={formato === 'pdf' ? 'active' : ''} onClick={() => setFormato('pdf')}>PDF</button>
                  <button className={formato === 'excel' ? 'active' : ''} onClick={() => setFormato('excel')}>EXCEL</button>
                </div>
                <button onClick={ejecutarExportacion} className="btn-confirm">DESCARGAR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="bento-wrapper">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="main-card">
          <header className="header-pro">
            <button onClick={() => router.back()} className="btn-vol">← Volver</button>
            <div className="brand-center">
              <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" />
              <h1>Panel Estratégico <span>SISELXI</span></h1>
            </div>
            <div className="nav-actions">
              <div className="time-pills">
                {['dia', 'mes', 'año'].map(t => (
                  <button key={t} className={filtroTiempo === t ? 'active' : ''} onClick={() => setFiltroTiempo(t)}>{t.toUpperCase()}</button>
                ))}
              </div>
              <button onClick={() => setMostrarModal(true)} className="btn-rep">REPORTE</button>
            </div>
          </header>

          <section className="kpi-row">
            <div className="kpi-box">
              <div className="kpi-icon">📂</div>
              <div className="kpi-txt"><label>SOLICITUDES</label><h3>{indicadores.total}</h3></div>
            </div>
            <div className="kpi-box">
              <div className="kpi-icon green">📈</div>
              <div className="kpi-txt"><label>EFICIENCIA</label><h3>{indicadores.eficiencia}%</h3></div>
            </div>
            <div className="kpi-box">
              <div className="kpi-icon red">🚨</div>
              <div className="kpi-txt"><label>CRÍTICOS</label><h3>{indicadores.criticos}</h3></div>
            </div>
          </section>

          <div className="charts-grid">
            <div className="bento-chart">
              <h3>📊 Evolución de Trámites</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statsGrafico}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="cantidad" fill="#002d72" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bento-chart">
              <h3>📌 Estatus General</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statsEstado} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {statsEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </main>

      <style jsx>{`
        .page-container { min-height: 100vh; background: #f0f2f5; padding: 20px; font-family: 'Inter', sans-serif; display: flex; justify-content: center; }
        .bento-wrapper { width: 100%; max-width: 1100px; }
        .main-card { background: white; border-radius: 30px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; }
        .header-pro { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px; }
        .btn-vol { background: white; border: 1px solid #ddd; padding: 8px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.75rem; color: #64748b; }
        .brand-center img { height: 40px; }
        .brand-center h1 { font-size: 1rem; color: #002d72; font-weight: 900; margin: 0; }
        .brand-center span { color: #aaa; font-weight: 300; }
        .time-pills { background: #f0f2f5; padding: 3px; border-radius: 10px; display: flex; gap: 3px; }
        .time-pills button { border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.6rem; font-weight: 800; cursor: pointer; color: #64748b; }
        .time-pills button.active { background: #002d72; color: white; }
        .btn-rep { background: #002d72; color: white; border: none; padding: 8px 18px; border-radius: 10px; font-weight: 700; margin-left: 10px; font-size: 0.75rem; cursor: pointer; }
        .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
        .kpi-box { background: #f8fafc; padding: 15px; border-radius: 18px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px; }
        .kpi-icon { background: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .kpi-txt label { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
        .kpi-txt h3 { font-size: 1.2rem; color: #002d72; font-weight: 900; margin: 0; }
        .charts-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 15px; }
        .bento-chart { background: white; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; }
        .bento-chart h3 { font-size: 0.85rem; font-weight: 800; margin-bottom: 15px; color: #1e293b; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .modal-card { background: white; width: 400px; border-radius: 25px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); border: 1px solid #eee; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h3 { margin: 0; font-size: 1.1rem; color: #002d72; font-weight: 900; }
        .modal-header button { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #aaa; }
        .checks-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .check-item { background: #f8fafc; padding: 10px; border-radius: 12px; display: flex; align-items: center; gap: 10px; font-size: 0.65rem; font-weight: 700; cursor: pointer; border: 1px solid #eee; }
        .format-row { display: flex; gap: 10px; margin-bottom: 20px; }
        .format-row button { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid #eee; background: white; font-weight: 800; cursor: pointer; font-size: 0.75rem; color: #64748b; }
        .format-row button.active { border-color: #002d72; color: #002d72; background: #f0f7ff; }
        .btn-confirm { width: 100%; background: #002d72; color: white; border: none; padding: 15px; border-radius: 15px; font-weight: 900; cursor: pointer; }
        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #002d72; }
      `}</style>
    </div>
  );
}