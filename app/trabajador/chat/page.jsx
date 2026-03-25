"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { auth, db } from "../../lib/firebase"; 
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";

// Necesitamos envolver el contenido en Suspense para usar useSearchParams en Next.js
function LexiContent() {
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState("");
  const [pasoActual, setPasoActual] = useState("menu"); 
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef();
  const router = useRouter();
  
  // 🔥 LEER EL TICKET DE LA URL
  const searchParams = useSearchParams();
  const ticketUrl = searchParams.get("ticket");

  const opcionesFrecuentes = [
    { id: "estatus", titulo: "📊 Consultar Estatus", descripcion: "Saber cómo va mi trámite actual." },
    { id: "requisitos", titulo: "📋 Requisitos por Tipo", descripcion: "Qué documentos necesito subir." },
    { id: "soporte", titulo: "🛠 Soporte Técnico", descripcion: "Problemas con la plataforma Sislexi." },
    { id: "abogado", titulo: "⚖ Hablar con Abogado", descripcion: "Solicitar asesoría legal directa." }
  ];

  useEffect(() => {
    setMounted(true);
    const user = auth.currentUser;
    
    // Saludo inicial
    const saludoInicial = { 
      texto: `¡Hola ${user?.displayName || "Trabajador"}! Soy Lexi. ¿En qué puedo ayudarte hoy?`, 
      tipo: "lexi" 
    };
    setMensajes([saludoInicial]);

    // 🔥 SI HAY TICKET EN LA URL, BUSCARLO AUTOMÁTICAMENTE
    if (ticketUrl) {
      buscarTicketAutomatico(ticketUrl);
    }
  }, [ticketUrl]);

  useEffect(() => {
    if (mounted) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, mounted]);

  // FUNCIÓN PARA BUSCAR TICKET DIRECTAMENTE
  const buscarTicketAutomatico = async (id) => {
    setMensajes(prev => [...prev, { texto: `Consultando información del caso #${id}...`, tipo: "usuario" }]);
    
    try {
      // Buscamos directamente por el ID del documento (que es el ticket de 6 dígitos)
      const docRef = doc(db, "solicitudes", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const s = docSnap.data();
        setTimeout(() => {
          setMensajes(prev => [...prev, { 
            texto: `🤖 He localizado tu caso #${id}. 
            \n• Trámite: ${s.tipo}
            \n• Estado: ${s.estado.toUpperCase()}
            \n• Fecha: ${s.fecha?.toDate().toLocaleDateString()}
            \n\n¿Deseas hacer alguna otra consulta?`, 
            tipo: "lexi" 
          }]);
        }, 800);
      } else {
        setMensajes(prev => [...prev, { texto: `❌ No logré encontrar el ticket #${id} en mis registros.`, tipo: "lexi" }]);
      }
    } catch (err) {
      setMensajes(prev => [...prev, { texto: "Error al conectar con la base de datos.", tipo: "lexi" }]);
    }
  };

  if (!mounted) return null;

  const seleccionarOpcion = (opcion) => {
    setMensajes(prev => [...prev, { texto: opcion.titulo, tipo: "usuario" }]);

    setTimeout(() => {
      if (opcion.id === "estatus") {
        setMensajes(prev => [...prev, { texto: "Por favor, ingresa el ID de tu solicitud para buscarlo en el sistema.", tipo: "lexi" }]);
        setPasoActual("esperando_estatus");
      } else if (opcion.id === "requisitos") {
        setMensajes(prev => [...prev, { texto: "Los requisitos básicos son: Cédula de Identidad (PDF), RIF vigente y el documento de la solicitud. ¿Necesitas saber de un trámite específico?", tipo: "lexi" }]);
      } else if (opcion.id === "soporte") {
        setMensajes(prev => [...prev, { texto: "Describe brevemente el problema técnico que presentas.", tipo: "lexi" }]);
        setPasoActual("esperando_dato");
      } else if (opcion.id === "abogado") {
        router.push("/trabajador/solicitudes");
      }
    }, 600);
  };

  const manejarEnvioDato = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const dato = input;
    setInput("");
    setMensajes(prev => [...prev, { texto: dato, tipo: "usuario" }]);

    if (pasoActual === "esperando_estatus") {
      buscarTicketAutomatico(dato);
    } else {
      setMensajes(prev => [...prev, { texto: "Entendido, he registrado tu mensaje. ¿Hay algo más en lo que pueda ayudarte?", tipo: "lexi" }]);
    }
    setPasoActual("menu");
  };

  return (
    <div className="lexi-container">
      <header className="lexi-header">
        <div className="lexi-brand">
          <div className="lexi-avatar">L</div>
          <div>
            <h2>Lexi AI</h2>
            <span>Asistente Sislexi</span>
          </div>
        </div>
        <button onClick={() => router.push("/trabajador")} className="btn-close">Regresar</button>
      </header>

      <div className="chat-area">
        <div className="messages">
          {mensajes.map((m, i) => (
            <div key={i} className={`msg-row ${m.tipo}`}>
              <div className="msg-bubble" style={{ whiteSpace: 'pre-line' }}>{m.texto}</div>
            </div>
          ))}

          {pasoActual === "menu" && (
            <div className="options-grid">
              {opcionesFrecuentes.map(opc => (
                <button key={opc.id} className="option-card" onClick={() => seleccionarOpcion(opc)}>
                  <strong>{opc.titulo}</strong>
                  <span>{opc.descripcion}</span>
                </button>
              ))}
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {pasoActual !== "menu" && (
          <form className="lexi-input" onSubmit={manejarEnvioDato}>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe aquí..."
              autoFocus
            />
            <button type="submit">Enviar</button>
            <button type="button" className="btn-cancel" onClick={() => setPasoActual("menu")}>Volver</button>
          </form>
        )}
      </div>

      <style jsx>{`
        .lexi-container { height: 100vh; display: flex; flex-direction: column; background: #f0f4f8; font-family: sans-serif; }
        .lexi-header { background: #002d72; color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; }
        .lexi-brand { display: flex; align-items: center; gap: 12px; }
        .lexi-avatar { width: 40px; height: 40px; background: #00a9e0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .lexi-header h2 { margin: 0; font-size: 1.1rem; }
        .lexi-header span { font-size: 0.75rem; opacity: 0.8; }
        .btn-close { background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 15px; border-radius: 8px; cursor: pointer; }

        .chat-area { flex: 1; max-width: 800px; width: 100%; margin: 20px auto; display: flex; flex-direction: column; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .messages { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 15px; }
        .msg-row { display: flex; width: 100%; }
        .msg-row.lexi { justify-content: flex-start; }
        .msg-row.usuario { justify-content: flex-end; }
        .msg-bubble { max-width: 80%; padding: 12px 18px; border-radius: 18px; font-size: 0.9rem; line-height: 1.4; }
        .lexi .msg-bubble { background: #f1f5f9; color: #334155; border-bottom-left-radius: 2px; }
        .usuario .msg-bubble { background: #002d72; color: white; border-bottom-right-radius: 2px; }

        .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; width: 100%; }
        .option-card { background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; text-align: left; cursor: pointer; transition: 0.2s; }
        .option-card:hover { border-color: #00a9e0; background: #f0f9ff; transform: translateY(-2px); }
        .option-card strong { display: block; color: #002d72; margin-bottom: 4px; }
        .option-card span { font-size: 0.75rem; color: #64748b; }

        .lexi-input { padding: 20px; border-top: 1px solid #f1f5f9; display: flex; gap: 10px; background: #f8fafc; }
        .lexi-input input { flex: 1; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; outline: none; }
        .lexi-input button { background: #002d72; color: white; border: none; padding: 0 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }
        
        @media (max-width: 600px) { .options-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// Exportación principal con Suspense
export default function ModuloLexi() {
  return (
    <Suspense fallback={<div>Cargando Lexi...</div>}>
      <LexiContent />
    </Suspense>
  );
}