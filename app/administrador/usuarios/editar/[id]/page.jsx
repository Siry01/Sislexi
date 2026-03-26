"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
// Importamos collection y addDoc para que la auditoría no falle
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";

export default function EditarUsuario() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: "", 
    cedula: "", 
    p00: "", 
    fechaNac: "",
    telefono: "", // 📞 Agregado para que no salga undefined
    fechaIngreso: "", 
    cargo: "", 
    departamento: "",
    direccion: "", 
    nacionalidad: "", 
    rol: ""
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const docRef = doc(db, "usuarios", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setForm(docSnap.data());
        } else {
          alert("Usuario no encontrado");
          router.push("/administrador/usuarios");
        }
      } catch (error) {
        console.error("Error al cargar:", error);
      }
      setLoading(false);
    };
    fetchUser();
  }, [id, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, "usuarios", id);
      
      // 1. Actualizamos los datos
      await updateDoc(userRef, form);

      // 2. Registro de Auditoría (Para que quede rastro del cambio)
      await addDoc(collection(db, "auditoria"), {
        usuarioP00: "ADMIN-SISTEMA", // Aquí luego pondremos el P00 del admin que está usando la PC
        accion: "Actualización de perfil",
        detalle: `Se modificaron los datos de ${form.nombre} (P00: ${form.p00})`,
        modulo: "Usuarios",
        resultado: "Exitoso",
        tipo: "info",
        fecha: new Date().toISOString()
      });

      alert("✅ Datos actualizados con éxito");
      router.push("/administrador/usuarios");
    } catch (err) {
      alert("❌ Error al actualizar: " + err.message);
    }
    setLoading(false);
  };

  if (loading) return <div className="cargando">Cargando datos del personal...</div>;

  return (
    <div className="container">
      <div className="form-card">
        <header>
          <button className="btn-back" onClick={() => router.back()}>⬅ Cancelar</button>
          <h2>Editar Perfil de Usuario</h2>
        </header>

        <form onSubmit={handleUpdate} className="grid-form">
          <div className="section-title">Datos Personales</div>
          <div className="input-group">
            <label>Nombres y Apellidos</label>
            <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Cédula</label>
            <input type="text" value={form.cedula} onChange={e => setForm({...form, cedula: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Teléfono de Contacto</label>
            <input type="text" value={form.telefono || ""} onChange={e => setForm({...form, telefono: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Fecha de Nacimiento</label>
            <input type="date" value={form.fechaNac} onChange={e => setForm({...form, fechaNac: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Nacionalidad</label>
            <input type="text" value={form.nacionalidad} onChange={e => setForm({...form, nacionalidad: e.target.value})} />
          </div>
          
          <div className="section-title">Datos Laborales</div>
          <div className="input-group">
            <label>Código P00</label>
            <input type="text" value={form.p00} onChange={e => setForm({...form, p00: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Cargo</label>
            <input type="text" value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Departamento</label>
            <input type="text" value={form.departamento} onChange={e => setForm({...form, departamento: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Fecha de Ingreso</label>
            <input type="date" value={form.fechaIngreso} onChange={e => setForm({...form, fechaIngreso: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Rol en el Sistema</label>
            <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
              <option value="trabajador">Trabajador</option>
              <option value="abogado">Abogado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="full-width">
            <label>Dirección de Habitación</label>
            <textarea value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
          </div>

          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? "Guardando..." : "Actualizar Información"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .container { display: flex; justify-content: center; padding: 40px; background: #f1f5f9; min-height: 100vh; }
        .form-card { background: white; padding: 40px; border-radius: 20px; width: 100%; max-width: 800px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
        .btn-back { background: transparent; border: 1px solid #cbd5e1; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; color: #64748b; }
        h2 { color: #002d72; margin: 0; }
        .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .section-title { grid-column: span 2; font-weight: bold; color: #1e3a8a; font-size: 1.1rem; margin-top: 10px; border-left: 4px solid #00a9e0; padding-left: 10px; }
        .input-group { display: flex; flex-direction: column; gap: 5px; }
        .full-width { grid-column: span 2; display: flex; flex-direction: column; gap: 5px; }
        label { font-size: 0.75rem; color: #64748b; font-weight: bold; text-transform: uppercase; }
        input, textarea, select { padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; }
        textarea { height: 80px; resize: none; }
        .btn-save { grid-column: span 2; background: #002d72; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1rem; margin-top: 20px; transition: 0.3s; }
        .btn-save:hover { background: #001f4d; transform: translateY(-2px); }
        .cargando { text-align: center; padding-top: 50px; font-weight: bold; color: #002d72; }
      `}</style>
    </div>
  );
}