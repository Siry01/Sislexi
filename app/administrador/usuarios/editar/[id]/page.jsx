"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function EditarUsuarioFinal() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "", cedula: "", p00: "", fechaNacimiento: "",
    telefono: "", direccion: "", fechaIngreso: "", 
    cargo: "", departamento: "", sede: "San Juan I", 
    nacionalidad: "", rol: "trabajador"
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const docRef = doc(db, "usuarios", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setForm(docSnap.data());
        } else {
          setError("Usuario no encontrado en la base de datos.");
        }
      } catch (err) {
        setError("Error al cargar los datos: " + err.message);
      }
      setLoading(false);
    };
    fetchUser();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const userRef = doc(db, "usuarios", id);
      
      // 1. Actualizamos los datos
      await updateDoc(userRef, form);

      // 2. Registro de Auditoría
      await addDoc(collection(db, "auditoria"), {
        usuarioP00: "ADMIN-SISTEMA", 
        accion: "Actualización de perfil",
        detalle: `Se modificaron los datos de ${form.nombre} (P00: ${form.p00})`,
        modulo: "Usuarios",
        resultado: "Exitoso",
        tipo: "info",
        fecha: new Date().toISOString()
      });

      setMostrarModalExito(true);
    } catch (err) {
      setError("❌ Error al actualizar: " + err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setUpdating(false);
  };

  if (loading) return <div className="cargando">Cargando datos del personal...</div>;

  return (
    <div className="page-wrapper">
      
      {/* MODAL DE ÉXITO CENTRALIZADO */}
      <AnimatePresence>
        {mostrarModalExito && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="success-modal"
            >
              <div className="success-icon">✅</div>
              <h3>¡Actualización Exitosa!</h3>
              <p>Los datos de <strong>{form.nombre}</strong> han sido actualizados correctamente en el sistema SISLEXI.</p>
              <button onClick={() => router.push("/administrador/usuarios")} className="modal-btn">Volver a la lista</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="form-card">
        <header className="form-header">
          <div className="empty-spacer"></div>
          <div className="header-title">
            <span className="main-icon">📝</span>
            <h2>Editar Perfil de Usuario</h2>
          </div>
          <button className="back-button" type="button" onClick={() => router.back()}>
            Volver ⬅
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleUpdate} className="compact-form">
          
          <div className="form-section">
            <h3 className="section-subtitle">👤 Datos de Identidad</h3>
            <div className="input-grid-3">
              <div className="input-box span-2">
                <label>Nombres y Apellidos Completos</label>
                <div className="input-wrapper">
                  <span className="input-icon">✍️</span>
                  <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Cédula de Identidad</label>
                <div className="input-wrapper">
                  <span className="input-icon">🆔</span>
                  <input type="text" required value={form.cedula} onChange={e => setForm({...form, cedula: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Teléfono de Contacto</label>
                <div className="input-wrapper">
                  <span className="input-icon">📞</span>
                  <input type="tel" required value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Nacionalidad</label>
                <div className="input-wrapper">
                  <span className="input-icon">🌍</span>
                  <input type="text" required value={form.nacionalidad} onChange={e => setForm({...form, nacionalidad: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Fecha de Nacimiento</label>
                <div className="input-wrapper">
                  <span className="input-icon">📅</span>
                  <input type="date" required value={form.fechaNacimiento} onChange={e => setForm({...form, fechaNacimiento: e.target.value})} />
                </div>
              </div>
              <div className="input-box span-3">
                <label>Dirección de Habitación Completa</label>
                <div className="input-wrapper">
                  <span className="input-icon textarea-icon">🏠</span>
                  <textarea required value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section labor">
            <h3 className="section-subtitle">🏢 Información Laboral CANTV</h3>
            <div className="input-grid-3">
              <div className="input-box">
                <label>Código P00</label>
                <div className="input-wrapper">
                  <span className="input-icon">🎫</span>
                  <input type="text" required value={form.p00} onChange={e => setForm({...form, p00: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Cargo Desempeñado</label>
                <div className="input-wrapper">
                  <span className="input-icon">💼</span>
                  <input type="text" required value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} />
                </div>
              </div>
              <div className="input-box">
                <label>Departamento o Unidad</label>
                <div className="input-wrapper">
                  <span className="input-icon">🏗️</span>
                  <input type="text" required value={form.departamento} onChange={e => setForm({...form, departamento: e.target.value})} />
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
                  <input type="date" required value={form.fechaIngreso} onChange={e => setForm({...form, fechaIngreso: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="submit-btn-pro" disabled={updating}>
            {updating ? "⚙️ Actualizando..." : "🚀 ACTUALIZAR INFORMACIÓN"}
          </button>
        </form>
      </motion.div>

      <style jsx>{`
        .page-wrapper { min-height: 100vh; background: #f0f4f8; display: flex; flex-direction: column; align-items: center; padding: 20px; font-family: 'Inter', sans-serif; position: relative; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 45, 114, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; }
        .success-modal { background: white; padding: 40px; border-radius: 30px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
        .success-icon { font-size: 4rem; margin-bottom: 20px; }
        .success-modal h3 { color: #002d72; font-size: 1.8rem; margin-bottom: 10px; font-weight: 800; }
        .modal-btn { background: #002d72; color: white; border: none; padding: 15px 40px; border-radius: 15px; font-weight: 800; cursor: pointer; transition: 0.3s; font-size: 1rem; }
        .modal-btn:hover { background: #001f4d; transform: translateY(-3px); }

        .form-card { background: white; width: 100%; max-width: 850px; border-radius: 24px; padding: 30px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
        .form-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 25px; }
        .empty-spacer { width: 100px; } 
        .header-title { display: flex; align-items: center; gap: 10px; flex: 1; justify-content: center; }
        h2 { color: #002d72; font-weight: 800; margin: 0; font-size: 1.2rem; }
        .back-button { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 10px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.3s; font-size: 0.75rem; width: 100px; }

        .section-subtitle { font-size: 0.7rem; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 12px; border-left: 3px solid #3b82f6; padding-left: 8px; }
        
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
        
        .error-banner { width: 100%; background: #fee2e2; color: #ef4444; padding: 15px; border-radius: 12px; margin-bottom: 20px; font-weight: 700; text-align: center; }
        .cargando { padding-top: 100px; color: #002d72; font-weight: 800; }
      `}</style>
    </div>
  );
}