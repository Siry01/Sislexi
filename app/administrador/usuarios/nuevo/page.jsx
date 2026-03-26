"use client";

import { useState } from "react";
import { db, auth } from "../../../lib/firebase";
// Cambiamos addDoc por setDoc y añadimos doc
import { collection, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function NuevoUsuario() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "", 
    cedula: "", 
    p00: "", 
    fechaNac: "",
    telefono: "", 
    direccion: "", 
    fechaIngreso: "", 
    cargo: "", 
    departamento: "",
    nacionalidad: "", 
    correo: "", 
    password: "", 
    rol: "trabajador"
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Crear el usuario en Authentication
      const userCred = await createUserWithEmailAndPassword(auth, form.correo, form.password);
      const uid = userCred.user.uid; // Obtenemos el ID único del nuevo usuario
      
      // 2. Guardar en Firestore usando setDoc con el UID como nombre del documento
      // Esto asegura que el Login encuentre el rol correctamente
      await setDoc(doc(db, "usuarios", uid), {
        uid: uid,
        ...form,
        fechaRegistro: serverTimestamp() 
      });

      // 3. Registro en Auditoría
      await addDoc(collection(db, "auditoria"), {
        usuarioP00: "ADMIN-SISTEMA", 
        accion: "Registro de nuevo personal",
        detalle: `Se registró a ${form.nombre} con P00: ${form.p00}`,
        modulo: "Usuarios",
        resultado: "Exitoso",
        tipo: "success",
        fecha: new Date().toISOString()
      });

      alert("✅ Usuario registrado exitosamente en SISLEXI");
      router.push("/administrador/usuarios"); 
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="form-card">
        <header>
          <button className="btn-back" onClick={() => router.back()}>⬅ Volver</button>
          <h2>Registro de Nuevo Personal</h2>
        </header>

        <form onSubmit={handleRegister} className="grid-form">
          <div className="section-title">Credenciales de Acceso</div>
          <div className="input-group">
            <label>Correo Institucional</label>
            <input type="email" required placeholder="ejemplo@cantv.com.ve" onChange={e => setForm({...form, correo: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Contraseña Temporal</label>
            <input type="password" required placeholder="********" onChange={e => setForm({...form, password: e.target.value})} />
          </div>

          <div className="section-title">Información Personal</div>
          <div className="input-group">
            <label>Nombres y Apellidos</label>
            <input type="text" required onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Cédula de Identidad</label>
            <input type="text" required onChange={e => setForm({...form, cedula: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Teléfono de Contacto</label>
            <input type="tel" required placeholder="04XX-XXXXXXX" onChange={e => setForm({...form, telefono: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Fecha de Nacimiento</label>
            <input type="date" required onChange={e => setForm({...form, fechaNac: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Nacionalidad</label>
            <input type="text" required placeholder="Venezolana" onChange={e => setForm({...form, nacionalidad: e.target.value})} />
          </div>
          
          <div className="full-width">
            <label>Dirección de Habitación</label>
            <textarea required placeholder="Indique dirección completa..." onChange={e => setForm({...form, direccion: e.target.value})} />
          </div>

          <div className="section-title">Ficha Laboral</div>
          <div className="input-group">
            <label>Código P00 (Manual)</label>
            <input type="text" required placeholder="Ej: P0012345" onChange={e => setForm({...form, p00: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Rol de Usuario</label>
            <select onChange={e => setForm({...form, rol: e.target.value})}>
              <option value="trabajador">Trabajador</option>
              <option value="abogado">Abogado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="input-group">
            <label>Cargo</label>
            <input type="text" required placeholder="Analista de Gestión Humana" onChange={e => setForm({...form, cargo: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Departamento / Unidad</label>
            <input type="text" required placeholder="Gerencia de Asesoría Legal" onChange={e => setForm({...form, departamento: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Fecha de Ingreso</label>
            <input type="date" required onChange={e => setForm({...form, fechaIngreso: e.target.value})} />
          </div>

          <button type="submit" className="btn-register" disabled={loading}>
            {loading ? "Procesando Registro..." : "Registrar en el Sistema"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .container { display: flex; justify-content: center; padding: 40px; background: #f1f5f9; min-height: 100vh; font-family: sans-serif; }
        .form-card { background: white; padding: 40px; border-radius: 20px; width: 100%; max-width: 850px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
        .btn-back { background: transparent; border: 1.5px solid #cbd5e1; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; color: #64748b; }
        h2 { color: #002d72; margin: 0; }
        .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .section-title { grid-column: span 2; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #e0f2fe; padding-bottom: 5px; margin-top: 15px; }
        .input-group { display: flex; flex-direction: column; gap: 5px; }
        .full-width { grid-column: span 2; display: flex; flex-direction: column; gap: 5px; }
        label { font-size: 0.7rem; color: #64748b; font-weight: bold; text-transform: uppercase; }
        input, select, textarea { padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.9rem; outline: none; transition: 0.3s; }
        input:focus, textarea:focus { border-color: #1e3a8a; box-shadow: 0 0 0 3px rgba(30,58,138,0.1); }
        textarea { height: 80px; resize: none; }
        .btn-register { grid-column: span 2; background: #1e3a8a; color: white; border: none; padding: 16px; border-radius: 12px; font-weight: bold; cursor: pointer; margin-top: 20px; font-size: 1rem; transition: 0.3s; }
        .btn-register:hover { background: #1e40af; transform: translateY(-2px); }
        .btn-register:disabled { background: #94a3b8; cursor: not-allowed; }
      `}</style>
    </div>
  );
}