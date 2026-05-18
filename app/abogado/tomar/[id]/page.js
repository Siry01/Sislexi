"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../../lib/firebase"; 
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";

export default function PaginaTomar() {
  const router = useRouter();
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      const snap = await getDoc(doc(db, "solicitudes", id));
      if (snap.exists()) setTicket({ id: snap.id, ...snap.data() });
    };
    cargar();
  }, [id]);

  const asignar = async () => {
    try {
      await updateDoc(doc(db, "solicitudes", id), {
        idAbogado: auth.currentUser?.uid,
        nombreAbogado: auth.currentUser?.displayName || "Especialista",
        estado: "en revisión",
        fechaAsignacion: serverTimestamp()
      });
      router.push("/abogado/solicitudes");
    } catch (e) { console.error(e); }
  };

  if (!ticket) return <div className="load">Cargando datos...</div>;

  return (
    <div className="view">
      <div className="modal-tomar">
        <h2>Asignación de Caso #{ticket.idTicket}</h2>
        <div className="info">
          <p><strong>Tipo:</strong> {ticket.tipo}</p>
          <p><strong>Descripción:</strong> {ticket.descripcion}</p>
        </div>
        <div className="actions">
          <button onClick={() => router.back()} className="cancel">Cancelar</button>
          <button onClick={asignar} className="confirm">Aceptar y Tomar Caso</button>
        </div>
      </div>
      <style jsx>{`
        .view { height: 100vh; display: flex; justify-content: center; align-items: center; background: #f1f5f9; }
        .modal-tomar { background: white; padding: 40px; border-radius: 25px; width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .info { background: #f8fafc; padding: 20px; border-radius: 15px; margin: 20px 0; text-align: left; }
        .actions { display: flex; gap: 10px; }
        .confirm { flex: 2; padding: 15px; background: #002d72; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }
        .cancel { flex: 1; background: #eee; border: none; border-radius: 12px; cursor: pointer; }
      `}</style>
    </div>
  );
}