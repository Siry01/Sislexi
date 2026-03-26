"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Perfil() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Estados para contraseñas y visibilidad
  const [passwords, setPasswords] = useState({ actual: "", nueva: "", confirmar: "" });
  const [showPass, setShowPass] = useState({ actual: false, nueva: false, confirmar: false });

  // 🔥 VALIDACIÓN DE FUERZA (LÓGICA BANCA)
  const validarFuerza = (pass) => {
    return {
      longitudOk: pass.length >= 10, // Más seguro (10)
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
        // Obtenemos los datos detallados del usuario
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

    // Validaciones de seguridad
    if (passwords.actual === passwords.nueva) return alert("❌ La nueva contraseña no puede ser igual a la actual.");
    if (passwords.nueva !== passwords.confirmar) return alert("❌ Las contraseñas nuevas no coinciden.");
    if (!passValida) return alert("❌ La contraseña nueva no cumple con los requisitos de seguridad.");

    setLoading(true);
    try {
      // 1. Re-autenticar (Paso Banca Obligatorio)
      const credential = EmailAuthProvider.credential(user.email, passwords.actual);
      await reauthenticateWithCredential(user, credential);

      // 2. Actualizar contraseña
      await updatePassword(user, passwords.nueva);
      alert("✅ Contraseña actualizada con éxito en SISLEXI.");
      setPasswords({ actual: "", nueva: "", confirmar: "" });
    } catch (error) {
      console.error(error);
      alert("❌ Error: La contraseña actual es incorrecta o hubo un problema de conexión.");
    }
    setLoading(false);
  };

  if (!userData) return <div className="cargando">Cargando perfil...</div>;

  return (
    <div className="main-wrapper">
      <div className="perfil-card">
        {/* HEADER */}
        <header className="modal-header">
          <button className="back-link" onClick={() => router.back()}>← Volver al Panel</button>
          <h2>SISLEXI - Mi Perfil Seguro</h2>
          <p className="sub">Gestión de datos personales y seguridad.</p>
        </header>

        {/* ✅ NUEVA SECCIÓN: DATOS DEL TRABAJADOR DETALLADOS */}
        <section className="section-info">
          <h3>Información Personal</h3>
          <div className="info-grid">
            <div className="info-item"><label>Nombres y Apellidos:</label> <span>{userData.nombre || "No asignado"}</span></div>
            <div className="info-item"><label>Cédula:</label> <span>{userData.cedula || "Pendiente"}</span></div>
            <div className="info-item"><label>Fecha de Nacimiento:</label> <span>{userData.fechaNac || "No registrada"}</span></div>
            <div className="info-item"><label>Dirección:</label> <span>{userData.direccion || "No asignada"}</span></div>
            <div className="info-item"><label>Nacionalidad:</label> <span>{userData.nacionalidad || "No asignada"}</span></div>
             <div className="info-item"><label>Teléfono:</label> <span>{userData.telefono || "No asignado"}</span></div>
          </div>
          
          <h3 className="lab">Información Laboral (CANTV)</h3>
          <div className="info-grid laboral">
            <div className="info-item"><label>P00:</label> <span className="p00">{userData.p00 || "Pendiente"}</span></div>
            <div className="info-item"><label>Fecha de Ingreso:</label> <span>{userData.fechaIngreso || "No asignada"}</span></div>
            <div className="info-item"><label>Cargo:</label> <span>{userData.cargo || "Asignando"}</span></div>
            <div className="info-item"><label>Departamento:</label> <span>{userData.departamento || "Asignando"}</span></div>
            <div className="info-item"><label>Correo Institucional:</label> <span>{auth.currentUser.email}</span></div>
          </div>
        </section>

        <hr />

        {/* ✅ SECCIÓN SEGURIDAD CON OJITO Y REGLAS UNIFICADAS */}
        <section className="section-security">
          <h3>Actualización de Seguridad</h3>
          <p className="sec-desc">Para cambiar la contraseña, debe re-autenticarse.</p>
          
          <form className="pass-form" onSubmit={handleUpdate}>
            
            {/* Contraseña Actual con Ojito */}
            <div className="field-pass">
              <input type={showPass.actual ? "text" : "password"} placeholder="Contraseña Actual" required
                value={passwords.actual} onChange={(e) => setPasswords({...passwords, actual: e.target.value})} />
              <button type="button" className="eye-btn" onClick={() => setShowPass({...showPass, actual: !showPass.actual})}>
                {showPass.actual ? "👁️" : "🙈"}
              </button>
            </div>

            {/* Contraseña Nueva con Ojito */}
            <div className="field-pass">
              <input type={showPass.nueva ? "text" : "password"} placeholder="Nueva Contraseña (8+ car.)" required
                value={passwords.nueva} onChange={(e) => setPasswords({...passwords, nueva: e.target.value})} />
              <button type="button" className="eye-btn" onClick={() => setShowPass({...showPass, nueva: !showPass.nueva})}>
                {showPass.nueva ? "👁️" : "🙈"}
              </button>
            </div>

            {/* 🔥 REGLAS UNIFICADAS A UN SOLO LADO (DISEÑO BANCO) */}
            <ul className="pass-rules">
              <li className={fuerza.longitudOk ? "ok" : ""}>{fuerza.longitudOk ? "✅" : "○"} Mínimo 10 caracteres.</li>
              <li className={fuerza.tieneMayuscula ? "ok" : ""}>{fuerza.tieneMayuscula ? "✅" : "○"} Una letra mayúscula.</li>
              <li className={fuerza.tieneNumero ? "ok" : ""}>{fuerza.tieneNumero ? "✅" : "○"} Un número.</li>
              <li className={fuerza.tieneEspecial ? "ok" : ""}>{fuerza.tieneEspecial ? "✅" : "○"} Caracter especial (!@#$%^&).</li>
            </ul>

            {/* Confirmar con Ojito */}
            <div className="field-pass last">
              <input type={showPass.confirmar ? "text" : "password"} placeholder="Confirmar Nueva Contraseña" required
                value={passwords.confirmar} onChange={(e) => setPasswords({...passwords, confirmar: e.target.value})} />
              <button type="button" className="eye-btn" onClick={() => setShowPass({...showPass, confirmar: !showPass.confirmar})}>
                {showPass.confirmar ? "👁️" : "🙈"}
              </button>
            </div>

            <button type="submit" className="btn-save" disabled={loading || !passValida}>
              {loading ? "Actualizando Seguridad..." : "Guardar Cambios Seguro"}
            </button>
          </form>
        </section>
      </div>

      <style jsx>{`
        /*Reset básico para el estilo de banca */
        .main-wrapper { display: flex; justify-content: center; min-height: 100vh; background: #f4f6f9; font-family: 'Inter', -apple-system, sans-serif; padding: 40px 20px; }
        .perfil-card { background: white; padding: 40px; border-radius: 20px; width: 100%; max-width: 600px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
        
        /* Header */
        .modal-header { margin-bottom: 30px; border-bottom: 1px solid #eef2f6; padding-bottom: 15px; }
        .modal-header h2 { margin: 10px 0 0; color: #002d72; font-size: 1.5rem; font-weight: 800; }
        .modal-header p.sub { margin: 5px 0 0; color: #64748b; font-size: 0.85rem; }
        .back-link { border: none; background: transparent; color: #00a9e0; font-weight: bold; cursor: pointer; }

        /* 🔥 Datos Personales/Laborales Grilla */
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px 20px; margin-top: 15px; }
        .section-info h3 { font-size: 1rem; color: #1e293b; font-weight: 700; margin-bottom: 15px; }
        .section-info h3.lab { margin-top: 25px; }
        .info-item { display: flex; flex-direction: column; gap: 3px; border-bottom: 1px solid #f8fafc; padding-bottom: 5px; }
        .info-item label { font-size: 0.65rem; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-item span { font-size: 0.95rem; color: #334155; font-weight: 500; }
        .info-item span.p00 { font-weight: bold; color: #002d72; }

        hr { border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0; }

        /* 🔥 Seguridad / Banca Lógica */
        .section-security h3 { font-size: 1rem; color: #1e293b; margin-bottom: 5px; }
        .sec-desc { font-size: 0.8rem; color: #64748b; margin-bottom: 20px; }
        .pass-form { display: flex; flex-direction: column; gap: 12px; }

        /* 🔥 Campo Contraseña con Ojito (Blindado) */
        .field-pass { position: relative; width: 100%; }
        .field-pass input { width: 100%; padding: 14px 45px 14px 15px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; transition: 0.2s; background: #fff; box-sizing: border-box; }
        .field-pass input:focus { border-color: #00a9e0; outline: none; box-shadow: 0 0 0 3px rgba(0, 169, 224, 0.1); }
        .field-pass.last { margin-top: 5px; }

        .eye-btn { position: absolute; right: 12px; top: 12px; background: transparent; border: none; font-size: 1.1rem; cursor: pointer; padding: 5px; line-height: 1; }

        /* 🔥 Reglas Unificadas Un Solo Lado */
        .pass-rules { list-style: none; padding: 0; margin: 0; font-size: 0.8rem; color: #94a3b8; }
        .pass-rules li { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
        .pass-rules li.ok { color: #10b981; font-weight: 600; }

        .btn-save { background: #002d72; color: white; padding: 16px; border: none; border-radius: 14px; font-weight: bold; cursor: pointer; margin-top: 15px; font-size: 0.95rem; }
        .btn-save:disabled { background: #cbd5e1; cursor: not-allowed; }
        .btn-save:hover:not(:disabled) { background: #001a4f; }

        .cargando { display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #64748b; font-weight: 500; }
      `}</style>
    </div>
  );
}