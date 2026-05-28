"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

export default function ChatTrabajadorIndividual() {
  const { userId: idTicket } = useParams(); // Usamos el ID del ticket
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const scrollRef = useRef(null);
  const user = auth.currentUser;
  const idSalaChat = `ticket_${idTicket}`;

  useEffect(() => {
    const q = query(collection(db, "chats", idSalaChat, "mensajes"), orderBy("fechaEnvio", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMensajes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [idSalaChat]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    await addDoc(collection(db, "chats", idSalaChat, "mensajes"), {
      texto: texto,
      tipo: "texto",
      remitenteId: user.uid,
      fechaEnvio: serverTimestamp(),
      leido: false
    });
    setTexto("");
  };

  return (
    <div className="chat-interface">
      <div className="mensajes-area">
        {mensajes.map(msg => (
          <div key={msg.id} className={`bubble ${msg.remitenteId === user.uid ? "mio" : "recibido"}`}>
            <p>{msg.texto}</p>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={enviarMensaje} className="input-area">
        <input value={texto} onChange={e => setTexto(e.target.value)} />
        <button type="submit">Enviar</button>
      </form>
      <style jsx>{`
        .chat-interface { height: 100vh; display: flex; flex-direction: column; }
        .mensajes-area { flex: 1; overflow-y: auto; padding: 20px; }
        .bubble { padding: 10px; margin: 5px; border-radius: 10px; max-width: 70%; }
        .mio { align-self: flex-end; background: #002d72; color: white; margin-left: auto; }
        .recibido { align-self: flex-start; background: #e5e7eb; }
        .input-area { padding: 20px; display: flex; gap: 10px; }
      `}</style>
    </div>
  );
}