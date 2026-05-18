"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function PerfilPro() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
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

    if (passwords.actual === passwords.nueva) return alert("❌ La nueva contraseña no puede ser igual a la actual.");
    if (passwords.nueva !== passwords.confirmar) return alert("❌ Las contraseñas nuevas no coinciden.");

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwords.actual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.nueva);
      
      setMostrarModalExito(true);
      setPasswords({ actual: "", nueva: "", confirmar: "" });
    } catch (error) {
      alert("❌ Error: La contraseña actual es incorrecta.");
    }
    setLoading(false);
  };

  if (!userData) return <div className="cargando">Cargando perfil de SISLEXI...</div>;

  return (
    <div className="main-wrapper">
      
      {/* MODAL DE ÉXITO CENTRAL */}
      <AnimatePresence>
        {mostrarModalExito && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="success-modal">
              <div className="success-icon">🛡️</div>
              <h3>Seguridad Actualizada</h3>
              <p>Tu contraseña ha sido cambiada exitosamente siguiendo los protocolos de seguridad de CANTV.</p>
              <button onClick={() => setMostrarModalExito(false)} className="modal-btn">Entendido</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="perfil-card shadow-pro">
        
        <header className="modal-header">
          <button className="back-link" onClick={() => router.back()}>← Volver al Panel</button>
          <h2>Mi Expediente Digital</h2>
          <p className="sub">Consulta de datos personales e institucionales en SISLEXI.</p>
        </header>

        <section className="section-info">
          <h3 className="section-title">👤 Datos Personales</h3>
          <div className="info-grid">
            <div className="info-item"><label>Nombres y Apellidos</label> <span>{userData.nombre}</span></div>
            <div className="info-item"><label>Cédula de Identidad</label> <span>{userData.cedula}</span></div>
            <div className="info-item"><label>Nacionalidad</label> <span>{userData.nacionalidad}</span></div>
            <div className="info-item"><label>Fecha de Nacimiento</label> <span>{userData.fechaNacimiento || userData.fechaNac}</span></div>
            <div className="info-item"><label>Teléfono</label> <span>{userData.telefono}</span></div>
            <div className="info-item span-all"><label>Dirección de Habitación</label> <span>{userData.direccion}</span></div>
          </div>
          
          <h3 className="section-title lab">🏢 Ficha Laboral (CANTV)</h3>
          <div className="info-grid laboral">
            <div className="info-item"><label>Código P00</label> <span className="highlight-p00">{userData.p00}</span></div>
            <div className="info-item"><label>Sede Administrativa</label> <span>{userData.sede}</span></div>
            <div className="info-item"><label>Cargo</label> <span>{userData.cargo}</span></div>
            <div className="info-item"><label>Unidad / Departamento</label> <span>{userData.departamento}</span></div>
            <div className="info-item"><label>Fecha de Ingreso</label> <span>{userData.fechaIngreso}</span></div>
            <div className="info-item"><label>Correo Institucional</label> <span>{auth.currentUser.email}</span></div>
          </div>
        </section>

        <hr className="divider" />

        <section className="section-security">
          <h3 className="section-title">🔑 Gestión de Seguridad</h3>
          <p className="sec-desc">Para modificar su contraseña, complete los requisitos de seguridad.</p>
          
          <form className="pass-form" onSubmit={handleUpdate}>
            <div className="field-pass">
              <input type={showPass.actual ? "text" : "password"} placeholder="Contraseña Actual" required
                value={passwords.actual} onChange={(e) => setPasswords({...passwords, actual: e.target.value})} />
              <button type="button" className="eye-btn" onClick={() => setShowPass({...showPass, actual: !showPass.actual})}>
                {showPass.actual ? "👁️" : "🙈"}
              </button>
            </div>

            <div className="field-pass">
              <input type={showPass.nueva ? "text" : "password"} placeholder="Nueva Contraseña" required
                value={passwords.nueva} onChange={(e) => setPasswords({...passwords, nueva: e.target.value})} />
              <button type="button" className="eye-btn" onClick={() => setShowPass({...showPass, nueva: !showPass.nueva})}>
                {showPass.nueva ? "👁️" : "🙈"}
              </button>
            </div>

            <ul className="pass-rules">
              <li className={fuerza.longitudOk ? "ok" : ""}>{fuerza.longitudOk ? "✅" : "○"} Mínimo 10 caracteres.</li>
              <li className={fuerza.tieneMayuscula ? "ok" : ""}>{fuerza.tieneMayuscula ? "✅" : "○"} Una letra mayúscula.</li>
              <li className={fuerza.tieneNumero ? "ok" : ""}>{fuerza.tieneNumero ? "✅" : "○"} Un número.</li>
              <li className={fuerza.tieneEspecial ? "ok" : ""}>{fuerza.tieneEspecial ? "✅" : "○"} Carácter especial (!@#$%^&).</li>
            </ul>

            <div className="field-pass">
              <input type={showPass.confirmar ? "text" : "password"} placeholder="Confirmar Nueva Contraseña" required
                value={passwords.confirmar} onChange={(e) => setPasswords({...passwords, confirmar: e.target.value})} />
              <button type="button" className="eye-btn" onClick={() => setShowPass({...showPass, confirmar: !showPass.confirmar})}>
                {showPass.confirmar ? "👁️" : "🙈"}
              </button>
            </div>

            <button type="submit" className="btn-save-pro" disabled={loading || !passValida}>
              {loading ? "🔐 Procesando..." : "ACTUALIZAR CONTRASEÑA"}
            </button>
          </form>
        </section>
      </motion.div>

      <style jsx>{`
        .main-wrapper { display: flex; justify-content: center; min-height: 100vh; background: #f0f4f8; padding: 40px 20px; font-family: 'Inter', sans-serif; }
        .perfil-card { background: white; padding: 40px; border-radius: 24px; width: 100%; max-width: 800px; border: 1px solid #e2e8f0; }
        
        .modal-header { margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
        .modal-header h2 { margin: 10px 0 0; color: #002d72; font-size: 1.4rem; font-weight: 800; }
        .modal-header p.sub { margin: 5px 0 0; color: #94a3b8; font-size: 0.85rem; font-weight: 600; }
        .back-link { border: none; background: transparent; color: #3b82f6; font-weight: 800; cursor: pointer; font-size: 0.85rem; transition: 0.3s; }
        .back-link:hover { transform: translateX(-5px); }

        .section-title { font-size: 0.75rem; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; border-left: 4px solid #3b82f6; padding-left: 10px; margin: 25px 0 15px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px 30px; }
        .span-all { grid-column: span 2; }
        
        .info-item { display: flex; flex-direction: column; gap: 4px; }
        .info-item label { font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; }
        .info-item span { font-size: 0.9rem; color: #1e293b; font-weight: 700; }
        .highlight-p00 { color: #002d72 !important; font-weight: 900 !important; }

        .divider { border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0; }

        .pass-form { display: flex; flex-direction: column; gap: 15px; max-width: 450px; }
        .sec-desc { font-size: 0.8rem; color: #64748b; margin-bottom: 15px; }
        
        .field-pass { position: relative; }
        .field-pass input { width: 100%; padding: 12px 45px 12px 15px; border-radius: 12px; border: 1.5px solid #f1f5f9; font-size: 0.9rem; background: #f8fafc; transition: 0.2s; outline: none; }
        .field-pass input:focus { border-color: #002d72; background: white; }
        .eye-btn { position: absolute; right: 15px; top: 12px; background: none; border: none; cursor: pointer; }

        .pass-rules { list-style: none; padding: 0; margin: 0; font-size: 0.75rem; display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
        .pass-rules li { color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 5px; }
        .pass-rules li.ok { color: #10b981; }

        .btn-save-pro { background: #002d72; color: white; padding: 16px; border: none; border-radius: 16px; font-weight: 900; cursor: pointer; font-size: 0.9rem; transition: 0.3s; box-shadow: 0 8px 15px rgba(0,45,114,0.1); }
        .btn-save-pro:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,45,114,0.2); }
        .btn-save-pro:disabled { background: #cbd5e1; cursor: not-allowed; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0, 45, 114, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; }
        .success-modal { background: white; padding: 40px; border-radius: 30px; text-align: center; max-width: 380px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .success-icon { font-size: 3.5rem; margin-bottom: 15px; }
        .modal-btn { background: #002d72; color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 800; cursor: pointer; margin-top: 20px; }

        .cargando { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #002d72; }
      `}</style>
    </div>
  );
}