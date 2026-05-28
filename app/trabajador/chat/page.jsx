"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function BandejaMensajeriaTrabajador() {
  const router = useRouter();
  const [conversaciones, setConversaciones] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("idTrabajador", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversaciones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="lista-chats-container">
      <h2>Mis Conversaciones Jurídicas</h2>
      {conversaciones.map(chat => (
        <div key={chat.id} className="item-chat" onClick={() => router.push(`/trabajador/chat/${chat.idTicket}`)}>
          <h4>{chat.tipoTicket} #{chat.idTicket}</h4>
          <p>Abogado: {chat.nombreAbogado || "Asesoría Legal"}</p>
          <small>{chat.ultimoMensaje}</small>
        </div>
      ))}
      <style jsx>{`
        .lista-chats-container { padding: 20px; }
        .item-chat { padding: 15px; border-bottom: 1px solid #ccc; cursor: pointer; background: white; margin: 10px 0; border-radius: 8px; }
      `}</style>
    </div>
  );
}