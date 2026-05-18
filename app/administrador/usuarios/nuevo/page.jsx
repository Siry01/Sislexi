"use client";

import { useState } from "react";
import { db, auth } from "../../../lib/firebase";
import { collection, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function RegistroUsuarioFinal() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "", cedula: "", p00: "", fechaNacimiento: "",
    telefono: "", direccion: "", fechaIngreso: "", 
    cargo: "", departamento: "", sede: "San Juan I", 
    nacionalidad: "", correo: "", 
    password: "", rol: "trabajador"
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Crear el usuario en Authentication
      const userCred = await createUserWithEmailAndPassword(auth, form.correo, form.password);
      const uid = userCred.user.uid; 
      
      // 2. Guardar en Firestore
      await setDoc(doc(db, "usuarios", uid), {
        uid: uid, ...form, fechaRegistro: serverTimestamp() 
      });

      // 3. Auditoría
      await addDoc(collection(db, "auditoria"), {
        usuarioP00: "ADMIN-SISTEMA", 
        accion: "Registro de Nuevo Usuario",
        detalle: `Se registró a ${form.nombre} exitosamente`,
        modulo: "Usuarios", resultado: "Exitoso", tipo: "success",
        fecha: new Date().toISOString()
      });

      // ACTIVAR MODAL CENTRAL
      setLoading(false);
      setMostrarModalExito(true);

    } catch (err) {
      setError(err.message);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir si hay error para que vea el mensaje
    }
  };

  const irALista = () => {
    setMostrarModalExito(false);
    router.push("/administrador/usuarios");
  };

  return (
    <div className="page-wrapper">
      
      {/* MODAL DE ÉXITO CENTRALIZADO */}
      <AnimatePresence>
        {mostrarModalExito && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="success-modal"
            >
              <div className="success-icon">✅</div>
              <h3>¡Registro Exitoso!</h3>
              <p>El trabajador <strong>{form.nombre}</strong> ha sido dado de alta correctamente en el sistema SISLEXI.</p>
              <button onClick={irALista} className="modal-btn">Entendido</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="form-card">
        <header className="form-header">
          <div className="empty-spacer"></div>
          <div className="header-title">
            <span className="main-icon">🔐</span>
            <h2>Ficha de Registro de Personal</h2>
          </div>
          <button className="back-button" type="button" onClick={() => router.back()}>
            Volver ⬅
          </button>
        </header>

        {error && <div className="error-banner">❌ Error: {error}</div>}

        <form onSubmit={handleRegister} className="compact-form">
          
          <div className="form-section">
            <h3 className="section-subtitle">🔑 Credenciales de Seguridad</h3>
            <div className="input-grid">
              <div className="input-box">
                <label>Correo Electrónico Institucional</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input type="email" required placeholder="nombre@cantv.com.ve" onChange={e => setForm({...form, correo: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Contraseña Temporal</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input type="password" required placeholder="Mínimo 6 caracteres" onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-subtitle">👤 Datos de Identidad</h3>
            <div className="input-grid-3">
              <div className="input-box span-2">
                <label>Nombres y Apellidos Completos</label>
                <div className="input-wrapper">
                  <span className="input-icon">✍️</span>
                  <input type="text" required onChange={e => setForm({...form, nombre: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Cédula de Identidad</label>
                <div className="input-wrapper">
                  <span className="input-icon">🆔</span>
                  <input type="text" required placeholder="V-00.000.000" onChange={e => setForm({...form, cedula: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Teléfono de Contacto</label>
                <div className="input-wrapper">
                  <span className="input-icon">📞</span>
                  <input type="tel" required placeholder="04XX-XXXXXXX" onChange={e => setForm({...form, telefono: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Nacionalidad</label>
                <div className="input-wrapper">
                  <span className="input-icon">🌍</span>
                  <input type="text" required placeholder="Ej: Venezolana" onChange={e => setForm({...form, nacionalidad: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Fecha de Nacimiento</label>
                <div className="input-wrapper">
                  <span className="input-icon">📅</span>
                  <input type="date" required onChange={e => setForm({...form, fechaNacimiento: e.target.value})} />
                </div>
              </div>
              <div className="input-box span-3">
                <label>Dirección de Habitación Completa</label>
                <div className="input-wrapper">
                  <span className="input-icon textarea-icon">🏠</span>
                  <textarea required placeholder="Indique calle, sector, casa o apartamento..." onChange={e => setForm({...form, direccion: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section labor">
            <h3 className="section-subtitle">🏢 Información Laboral CANTV</h3>
            <div className="input-grid-3">
              <div className="input-box">
                <label>Código P00 del Trabajador</label>
                <div className="input-wrapper">
                  <span className="input-icon">🎫</span>
                  <input type="text" required placeholder="P00XXXXX" onChange={e => setForm({...form, p00: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Cargo Desempeñado</label>
                <div className="input-wrapper">
                  <span className="input-icon">💼</span>
                  <input type="text" required placeholder="Ej: Analista de Gestión" onChange={e => setForm({...form, cargo: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Departamento o Unidad</label>
                <div className="input-wrapper">
                  <span className="input-icon">🏗️</span>
                  <input type="text" required placeholder="Ej: Asesoría Jurídica" onChange={e => setForm({...form, departamento: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Sede Administrativa</label>
                <div className="input-wrapper">
                  <span className="input-icon">📍</span>
                  <select required value={form.sede} onChange={e => setForm({...form, sede: e.target.value})}>
                    <option value="San Juan I">San Juan I</option>
                    <option value="San Juan II">San Juan II</option>
                  </select>
                </div>
              </div>
              <div className="input-box">
                <label>Rol de Usuario en Sistema</label>
                <div className="input-wrapper">
                  <span className="input-icon">🎖️</span>
                  <select required value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                    <option value="trabajador">Trabajador</option>
                    <option value="abogado">Abogado</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
               <div className="input-box">
                <label>Fecha de Ingreso</label>
                <div className="input-wrapper">
                  <span className="input-icon">📥</span>
                  <input type="date" required onChange={e => setForm({...form, fechaIngreso: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="submit-btn-pro" disabled={loading}>
            {loading ? "⚙️ Sincronizando..." : "🚀 FINALIZAR Y REGISTRAR"}
          </button>
        </form>
      </motion.div>

      <style jsx>{`
        .page-wrapper { min-height: 100vh; background: #f0f4f8; display: flex; flex-direction: column; align-items: center; padding: 20px; font-family: 'Inter', sans-serif; position: relative; }
        
        /* MODAL OVERLAY */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 45, 114, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; }
        
        .success-modal { background: white; padding: 40px; border-radius: 30px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 50px rgba(0,0,0,0.2); border: 1px solid #e2e8f0; }
        .success-icon { font-size: 4rem; margin-bottom: 20px; }
        .success-modal h3 { color: #002d72; font-size: 1.8rem; margin-bottom: 10px; font-weight: 800; }
        .success-modal p { color: #64748b; margin-bottom: 30px; line-height: 1.5; }
        
        .modal-btn { background: #002d72; color: white; border: none; padding: 15px 40px; border-radius: 15px; font-weight: 800; cursor: pointer; transition: 0.3s; font-size: 1rem; }
        .modal-btn:hover { background: #001f4d; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,45,114,0.2); }

        .error-banner { width: 100%; background: #fee2e2; color: #ef4444; padding: 15px; border-radius: 12px; margin-bottom: 20px; font-weight: 700; text-align: center; border: 1px solid #fecaca; }

        /* EL RESTO DEL CSS SE MANTIENE IGUAL */
        .form-card { background: white; width: 100%; max-width: 850px; border-radius: 24px; padding: 30px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
        .form-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 25px; }
        .empty-spacer { width: 100px; } 
        .header-title { display: flex; align-items: center; gap: 10px; flex: 1; justify-content: center; }
        h2 { color: #002d72; font-weight: 800; margin: 0; font-size: 1.2rem; }
        .back-button { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 10px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.3s; font-size: 0.75rem; width: 100px; }
        .section-subtitle { font-size: 0.7rem; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 12px; border-left: 3px solid #3b82f6; padding-left: 8px; }
        .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .input-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .span-2 { grid-column: span 2; }
        .span-3 { grid-column: span 3; }
        .input-box { display: flex; flex-direction: column; gap: 4px; }
        label { font-size: 0.65rem; font-weight: 700; color: #64748b; margin-left: 3px; }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 12px; font-size: 1rem; opacity: 0.7; }
        .textarea-icon { top: 12px; }
        input, select, textarea { width: 100%; padding: 10px 10px 10px 38px; border: 1.5px solid #f1f5f9; border-radius: 12px; font-size: 0.8rem; font-weight: 600; outline: none; transition: 0.2s; background: #f8fafc; color: #1e293b; }
        input:focus, select:focus, textarea:focus { border-color: #002d72; background: white; }
        textarea { height: 65px; resize: none; padding-top: 10px;}
        .submit-btn-pro { width: 100%; background: #002d72; color: white; border: none; padding: 15px; border-radius: 16px; font-weight: 800; font-size: 0.9rem; cursor: pointer; margin-top: 30px; transition: 0.3s; box-shadow: 0 8px 20px rgba(0,45,114,0.15); }
        .submit-btn-pro:hover { transform: translateY(-2px); background: #001f4d; }
      `}</style>
    </div>
  );
}