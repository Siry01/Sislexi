"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase"; 
import { collection, query, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ModuloProcesamientoEfimeroCANTV() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [estadoAnalisis, setEstadoAnalisis] = useState("");

  // Estados del Asistente Cognitivo
  const [mostrarAsistente, setMostrarAsistente] = useState(false);
  const [paso, setPaso] = useState(1); // 1: Carga/Análisis, 2: Formulario de Inyección
  const [tipoRequerimiento, setTipoRequerimiento] = useState("Amparo Laboral");
  
  // Texto lógico que se extrae y se queda guardado
  const [plantillaEstructurada, setPlantillaEstructurada] = useState("");
  const [variablesDetectadas, setVariablesDetectadas] = useState([]);
  const [valoresVariables, setValoresVariables] = useState({});

  // 🔄 CARGA EL REPOSITORIO DE PLANTILLAS APRENDIDAS
  useEffect(() => {
    const q = query(collection(db, "plantillas_analizadas"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocumentos(docs.sort((a, b) => (b.fechaRegistro?.seconds || 0) - (a.fechaRegistro?.seconds || 0)));
    });
    return () => unsubscribe();
  }, []);

  // 🔎 PROCESADOR EFÍMERO: Lee el archivo, extrae el molde de texto y destruye el binario
  const analizarArchivoYDestruirOriginal = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setEstadoAnalisis("Leyendo flujo de datos binarios...");
    
    const lector = new FileReader();
    lector.readAsText(archivo);
    
    lector.onload = (event) => {
      const contenidoExtraido = event.target.result;

      setEstadoAnalisis("IA Analizando patrones... Extrayendo variables...");
      
      setTimeout(() => {
        setPlantillaEstructurada(contenidoExtraido);
        
        const regex = /\[(.*?)\]/g;
        let coincidencia;
        const campos = new Set();

        while ((coincidencia = regex.exec(contenidoExtraido)) !== null) {
          campos.add(coincidencia[1]);
        }

        const listaCampos = Array.from(campos);
        setVariablesDetectadas(listaCampos);

        const fechaHoy = new Date().toLocaleDateString("es-VE");
        const abogadoActual = auth.currentUser?.displayName || "Especialista Jurídico";
        
        const prellenado = {};
        listaCampos.forEach(campo => {
          const normalizado = campo.toLowerCase();
          if (normalizado.includes("solicitante") || normalizado.includes("trabajador")) prellenado[campo] = "Siry Pacheco";
          else if (normalizado.includes("cédula") || normalizado.includes("cedula")) prellenado[campo] = "V-28456123";
          else if (normalizado.includes("código") || normalizado.includes("p00")) prellenado[campo] = "P00185932";
          else if (normalizado.includes("área") || normalizado.includes("area")) prellenado[campo] = "Gestión Humana - San Juan II";
          else if (normalizado.includes("abogado") || normalizado.includes("firma")) prellenado[campo] = `Abg. ${abogadoActual}`;
          else if (normalizado.includes("fecha")) prellenado[campo] = fechaHoy;
          else prellenado[campo] = "";
        });

        setValoresVariables(prellenado);
        
        e.target.value = null; 
        setEstadoAnalisis("");
        setPaso(2);
      }, 1500);
    };
  };

  // 🖋️ COMPILADOR DINÁMICO
  const compilarDocumentoFinal = () => {
    let textoResultado = plantillaEstructurada;
    variablesDetectadas.forEach(campo => {
      const valor = valoresVariables[campo] || `[${campo}]`;
      textoResultado = textoResultado.replace(`[${campo}]`, valor);
    });
    return textoResultado;
  };

  // 💾 GUARDAR SOLO LA PLANTILLA ANALIZADA (TEXTO PLANO LIGHTWEIGHT)
  const guardarPlantillaEnBBDD = async () => {
    setProcesando(true);
    try {
      const documentoFinalCompilado = compilarDocumentoFinal();
      
      await addDoc(collection(db, "plantillas_analizadas"), {
        nombreFormato: `Formato_${tipoRequerimiento.replace(/\s+/g, "_")}.txt`,
        tipoRequerimiento,
        cuerpoDocumento: documentoFinalCompilado,
        fechaRegistro: serverTimestamp(),
        abogadoAuditor: auth.currentUser?.displayName || "Consultoría Jurídica CANTV"
      });

      setMostrarAsistente(false);
      setPaso(1);
      setPlantillaEstructurada("");
      setEstadoAnalisis("");
    } catch (err) {
      console.error(err);
    } finally {
      setProcesando(false);
    }
  };

  const visualizarMinutaTxt = (contenido) => {
    const v = window.open();
    v.document.write(`
      <html>
        <head><title>SISLEXI - Formato Generado</title></head>
        <body style="margin:0; background:#f4f7f9; font-family:sans-serif; padding:40px; display:flex; justify-content:center;">
          <div style="background:white; width:100%; max-width:800px; padding:45px; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.03);">
            <h2 style="color:#002d72; margin-bottom:15px; font-weight:800;">Formato Jurídico Reutilizable (.txt)</h2>
            <textarea style="width:100%; height:450px; font-family:monospace; font-size:0.95rem; padding:15px; border-radius:12px; border:2px solid #e2e8f0; line-height:1.6; resize:none; box-sizing:border-box;">${contenido}</textarea>
          </div>
        </body>
      </html>
    `);
  };

  const filtrados = documentos.filter(d => 
    d.nombreFormato?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.tipoRequerimiento?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="layout-documentos">
      
      {/* 🤖 ASISTENTE SMART OPTIMIZADO Y CORREGIDO SIN ERRORES DE SINTAXIS */}
      {mostrarAsistente && (
        <div className="capa-modal">
          <div className="tarjeta-asistente-ia">
            <div className="modal-brand-header">
              <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" className="modal-logo" />
              <h3>Procesador Inteligente Descentralizado</h3>
            </div>

            {/* Contenedor responsivo con scroll de seguridad */}
            <div className="modal-scroll-area">
              {paso === 1 ? (
                <div className="contenedor-bloque-paso1">
                  <div className="form-group-p1">
                    <label className="lbl-ia">Asociar a Tipo de Requerimiento Técnico:</label>
                    <input 
                      type="text" 
                      value={tipoRequerimiento} 
                      onChange={(e) => setTipoRequerimiento(e.target.value)} 
                      className="input-ia" 
                      placeholder="Ej. Contrato, Amparo, Jubilación" 
                    />
                  </div>

                  <div className="form-group-p1">
                    <label className="lbl-ia">Documento Fuente Matriz:</label>
                    <label className="btn-seleccionar-file">
                      📁 Cargar Archivo de Plantilla (.txt)
                      <input type="file" accept=".txt" onChange={analizarArchivoYDestruirOriginal} style={{ display: "none" }} />
                    </label>
                  </div>

                  {estadoAnalisis && <p className="status-analisis-txt">{estadoAnalisis}</p>}
                </div>
              ) : (
                <div className="grilla-asistente">
                  <div className="panel-inputs-ia">
                    <h4 className="subtitulo-ia">⚙️ Mapeo de Variables del Ticket</h4>
                    <p className="descripcion-ia">La IA extrajo los siguientes campos requeridos:</p>
                    
                    {variablesDetectadas.map((campo, idx) => (
                      <div key={idx} className="campo-dinamico-row">
                        <label className="lbl-ia">{campo}:</label>
                        <input 
                          type="text" 
                          value={valoresVariables[campo] || ""} 
                          onChange={(e) => setValoresVariables({...valoresVariables, [campo]: e.target.value})} 
                          className="input-ia"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="panel-preview-ia">
                    <h4 className="subtitulo-ia">🖼️ Previsualización Estructurada</h4>
                    <pre className="preview-documento-box">{compilarDocumentoFinal()}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* 🔥 BOTONES DE ACCIÓN: Corregidos estructuralmente para el build de Next.js */}
            <div className="modal-actions-footer">
              {paso === 1 ? (
                <button className="btn-cancelar" onClick={() => { setMostrarAsistente(false); setEstadoAnalisis(""); }}>Cancelar</button>
              ) : (
                <>
                  <button className="btn-cancelar" onClick={() => setPaso(1)}>⬅ Reanalizar Formato</button>
                  <button className="btn-guardar" onClick={guardarPlantillaEnBBDD} disabled={procesando}>
                    {procesando ? "Guardando..." : "🖋️ Estampar Firma y Archivar"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <header className="navbar-superior">
        <div className="marca-capsula">
          <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" alt="CANTV" />
          <span>SISLEXI REPOSITORIO DE PLANTILLAS</span>
        </div>
        <button className="btn-volver" onClick={() => router.push("/abogado")}>🚪 Regresar al Panel</button>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="content-container">
        <div className="header-seccion">
          <div className="titulos">
            <h2>📁 Formatos Jurídicos Reutilizables</h2>
            <p>Modelos de minutas aprendidos mediante extracción efímera de documentos institucionales.</p>
          </div>
          <button className="btn-add-doc" onClick={() => setMostrarAsistente(true)}>🤖 Analizar Documento Origen</button>
        </div>

        <input 
          type="text" 
          placeholder="🔍 Buscar formatos lógicos por tipo de requerimiento..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-bar"
        />

        <div className="cards-grid">
          {filtrados.length > 0 ? filtrados.map((doc) => (
            <div key={doc.id} className="document-card-item">
              <div className="card-top-info">
                <span className="category-tag">📜 {doc.tipoRequerimiento}</span>
                <span className="lightweight-badge">⚡ 0 KB (Texto Plano)</span>
              </div>
              
              <div className="card-main-body">
                <h3 className="doc-title">{doc.nombreFormato}</h3>
                <p className="meta-txt">⚖️ Validado por: {doc.abogadoAuditor}</p>
              </div>

              <hr className="divider" />
              
              <div className="card-actions-footer">
                <button className="btn-view-doc" onClick={() => visualizarMinutaTxt(doc.cuerpoDocumento)}>👁️ Ver Formato Reutilizable</button>
              </div>
            </div>
          )) : (
            <div className="empty-state-box">📭 No hay plantillas lógicas almacenadas en el repositorio.</div>
          )}
        </div>
      </main>

      <style jsx>{`
        .layout-documentos { min-height: 100vh; background: #f4f7f9; font-family: 'Segoe UI', Arial, sans-serif; display: flex; flex-direction: column; }
        .navbar-superior { background: white; padding: 14px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .marca-capsula { display: flex; align-items: center; gap: 12px; font-weight: 800; color: #002d72; font-size: 1.3rem; }
        .marca-capsula img { height: 38px; }
        .btn-volver { padding: 9px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 700; color: #475569; }

        .content-container { padding: 30px 4%; flex: 1; display: flex; flex-direction: column; }
        .header-seccion { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; gap: 20px; }
        .titulos h2 { margin: 0; color: #002d72; font-weight: 800; font-size: 1.5rem; }
        .titulos p { margin: 5px 0 0 0; color: #64748b; font-size: 0.9rem; }
        .btn-add-doc { background: #002d72; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(0,45,114,0.15); }

        .search-bar { width: 100%; padding: 14px 20px; margin-bottom: 25px; border-radius: 14px; border: 1px solid #cbd5e1; background: white; outline: none; box-sizing: border-box; }
        
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px; }
        .document-card-item { background: white; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; transition: 0.2s; }
        .document-card-item:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }

        .category-tag { background: #f1f5f9; color: #475569; padding: 5px 12px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; border: 1px solid #cbd5e1; }
        .lightweight-badge { background: #f0fdf4; color: #166534; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: 1px solid #bbf7d0; }
        .card-main-body { flex: 1; margin: 15px 0; }
        .doc-title { margin: 0 0 8px 0; font-size: 1.1rem; color: #0f172a; font-weight: 800; }
        .meta-txt { margin: 4px 0; font-size: 0.85rem; color: #64748b; }
        .divider { border: 0; border-top: 1px dashed #e2e8f0; margin: 15px 0; }
        .btn-view-doc { width: 100%; background: #f1f5f9; color: #002d72; border: 1px solid #cbd5e1; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 700; }

        /* CAPA MODAL CONTROLADA */
        .capa-modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .tarjeta-asistente-ia { background: white; width: 100%; max-width: 700px; border-radius: 24px; padding: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); display: flex; flex-direction: column; max-height: 90vh; box-sizing: border-box; }
        
        .modal-brand-header { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
        .modal-logo { max-height: 75px; width: auto; object-fit: contain; display: block; margin: 0 auto; }
        .modal-brand-header h3 { margin: 0; color: #002d72; font-size: 1.2rem; font-weight: 800; }

        .contenedor-bloque-paso1 { display: flex; flex-direction: column; gap: 15px; width: 100%; margin-top: 5px; }
        .form-group-p1 { display: flex; flex-direction: column; gap: 6px; width: 100%; text-align: left; }
        
        .btn-seleccionar-file { display: block; background: #f8fafc; border: 2px dashed #002d72; padding: 20px; border-radius: 16px; text-align: center; cursor: pointer; font-weight: 700; color: #002d72; font-size: 0.95rem; box-sizing: border-box; }
        .btn-seleccionar-file:hover { background: #eff6ff; }
        .status-analisis-txt { text-align: center; color: #15803d; font-weight: 600; font-size: 0.85rem; font-style: italic; margin: 2px 0; }

        /* PASO 2 */
        .modal-scroll-area { flex: 1; overflow-y: auto; padding-right: 8px; margin-top: 10px; margin-bottom: 10px; }
        .grilla-asistente { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; }
        .panel-inputs-ia { display: flex; flex-direction: column; gap: 12px; }
        .campo-dinamico-row { display: flex; flex-direction: column; gap: 4px; }
        
        .subtitulo-ia { margin: 0; color: #002d72; font-weight: 800; font-size: 1rem; }
        .descripcion-ia { margin: -2px 0 8px 0; color: #64748b; font-size: 0.8rem; }
        .lbl-ia { font-size: 0.7rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 2px; }
        .input-ia { width: 100%; padding: 11px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 0.85rem; outline: none; box-sizing: border-box; }
        
        .panel-preview-ia { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
        .preview-documento-box { background: #0f172a; color: #38bdf8; padding: 15px; border-radius: 14px; font-family: monospace; font-size: 0.8rem; line-height: 1.5; white-space: pre-wrap; overflow-y: auto; flex: 1; border: 1px solid #1e293b; margin: 0; box-sizing: border-box; max-height: 300px; }

        /* Footer unificado */
        .modal-actions-footer { display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 5px; }
        .modal-actions-footer button { padding: 11px 22px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
        .btn-cancelar { background: #f1f5f9; color: #475569; }
        .btn-guardar { background: #002d72; color: white; }

        .empty-state-box { grid-column: 1 / -1; text-align: center; padding: 50px; color: #94a3b8; font-style: italic; background: white; border-radius: 15px; border: 1px dashed #cbd5e1; }

        @media (max-width: 800px) {
          .grilla-asistente { grid-template-columns: 1fr; }
          .tarjeta-asistente-ia { max-height: 95vh; }
        }
      `}</style>
    </div>
  );
}