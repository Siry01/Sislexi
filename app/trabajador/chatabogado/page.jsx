"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ListaChats() {
  const [chats, setChats] = useState([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 🔍 Filtramos: Mis solicitudes que están en estado 'asesoria'
    const q = query(
      collection(db, "solicitudes"),
      where("usuarioId", "==", user.uid),
      where("estado", "==", "asesoria")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(lista);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container-lista">
      <header className="header-simple">
        <button onClick={() => router.push("/trabajador")} className="btn-back">⬅ Volver</button>
        <h2>Mis Asesorías Legales</h2>
      </header>

      <main className="lista-area">
        {cargando ? (
          <p className="status-msg">Cargando conversaciones...</p>
        ) : chats.length === 0 ? (
          <div className="empty-state">
            <p>No tienes chats activos. Los chats aparecerán cuando un abogado acepte tu solicitud.</p>
            <button onClick={() => router.push("/trabajador/solicitudes")}>Ver mis solicitudes</button>
          </div>
        ) : (
          chats.map((chat) => (
            <div 
              key={chat.id} 
              className="chat-item" 
              onClick={() => router.push(`/trabajador/chat/${chat.id}`)}
            >
              <div className="chat-avatar">⚖️</div>
              <div className="chat-info">
                <div className="chat-top">
                  <strong>{chat.abogadoAsignado || "Asesor Jurídico"}</strong>
                  <span className="ticket-tag">#{chat.id}</span>
                </div>
                <p className="tipo-tramite">{chat.tipo} - {chat.organismo}</p>
                {chat.chat?.length > 0 && (
                  <p className="ultimo-msg">
                    💬 {chat.chat[chat.chat.length - 1].texto || "Archivo enviado..."}
                  </p>
                )}
              </div>
              <div className="chat-arrow">➡</div>
            </div>
          ))
        )}
      </main>

      <style jsx>{`
        .container-lista { min-height: 100vh; background: #f4f7fa; padding: 20px; font-family: sans-serif; }
        .header-simple { max-width: 600px; margin: 0 auto 20px; display: flex; align-items: center; gap: 20px; }
        .header-simple h2 { color: #002d72; font-size: 1.2rem; }
        .btn-back { background: white; border: 1px solid #d1d9e6; padding: 8px 15px; border-radius: 8px; cursor: pointer; }

        .lista-area { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
        
        .chat-item { 
          background: white; padding: 18px; border-radius: 15px; display: flex; align-items: center; gap: 15px;
          cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid transparent;
        }
        .chat-item:hover { border-color: #00a9e0; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.08); }

        .chat-avatar { width: 50px; height: 50px; background: #e0f2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .chat-info { flex: 1; }
        
        .chat-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .chat-top strong { color: #1e293b; font-size: 1rem; }
        .ticket-tag { background: #f1f5f9; color: #64748b; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
        
        .tipo-tramite { font-size: 0.85rem; color: #00a9e0; font-weight: 600; margin: 0; }
        .ultimo-msg { font-size: 0.8rem; color: #94a3b8; margin: 5px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }
        
        .chat-arrow { color: #cbd5e1; font-size: 1.2rem; }
        .empty-state { text-align: center; padding: 40px; color: #64748b; }
        .empty-state button { margin-top: 15px; background: #002d72; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
}