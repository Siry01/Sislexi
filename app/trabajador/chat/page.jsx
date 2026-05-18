"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { registrarAuditoriaReal } from "../../lib/auditoria"; // Importación

export default function Perfil() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [passwords, setPasswords] = useState({ actual: "", nueva: "", confirmar: "" });
  const [showPass, setShowPass] = useState({ actual: false, nueva: false, confirmar: false });

  const validarFuerza = (pass) => {
    return {
      longitudOk: pass.length >= 10,
      tieneMayuscula: /[A-Z]/.test(pass),
      tieneNumero: /[0-9]/.test(pass),
      tieneEspecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass),
    };
  };

  const fuerza = validarFuerza(passwords.nueva);
  const passValida = fuerza.longitudOk && fuerza.tieneMayuscula && fuerza.tieneNumero && fuerza.tieneEspecial;

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      }
    };
    fetchUser();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const nombreUsuario = userData?.nombre || user.email;

    if (passwords.actual === passwords.nueva) return alert("❌ La nueva contraseña no puede ser igual a la actual.");
    if (passwords.nueva !== passwords.confirmar) return alert("❌ Las contraseñas nuevas no coinciden.");
    if (!passValida) return alert("❌ La contraseña nueva no cumple con los requisitos.");

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwords.actual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.nueva);
      
      // AUDITORÍA: Cambio exitoso
      await registrarAuditoriaReal("Cambio Contraseña", "PERFIL", "success", "Actualización de credenciales de seguridad exitosa", nombreUsuario, "TRABAJADOR");
      
      alert("✅ Contraseña actualizada con éxito.");
      setPasswords({ actual: "", nueva: "", confirmar: "" });
    } catch (error) {
      // AUDITORÍA: Intento fallido
      await registrarAuditoriaReal("Intento Cambio Fallido", "PERFIL", "error", "Clave actual incorrecta al intentar actualizar", nombreUsuario, "TRABAJADOR");
      alert("❌ Error: La contraseña actual es incorrecta.");
    }
    setLoading(false);
  };

  if (!userData) return <div className="cargando">Cargando perfil...</div>;

  return (
    /* Tu JSX de perfil se mantiene igual */
    <div className="main-wrapper">...</div>
  );
}
     
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
   
