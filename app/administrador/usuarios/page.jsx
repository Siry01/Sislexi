"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function UsuariosLista() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("todos");
  const [usuarioDetalle, setUsuarioDetalle] = useState(null); 
  const router = useRouter();

  const fetchUsers = async () => {
    const q = query(collection(db, "usuarios"), orderBy("nombre", "asc"));
    const snapshot = await getDocs(q);
    setUsuarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleEstatus = async (id, estatusActual) => {
    try {
      const userRef = doc(db, "usuarios", id);
      await updateDoc(userRef, { activo: !estatusActual });
      fetchUsers(); 
    } catch (error) {
      alert("Error al cambiar estatus");
    }
  };

  const eliminarUsuario = async (id, nombre) => {
    if (confirm(`¿Estás seguro de eliminar a ${nombre}? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        alert("Usuario eliminado");
        fetchUsers();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const busquedaLower = busqueda.toLowerCase();
    const coincideBusqueda = 
      u.nombre?.toLowerCase().includes(busquedaLower) ||
      u.p00?.toLowerCase().includes(busquedaLower) ||
      u.cedula?.includes(busquedaLower) ||
      u.departamento?.toLowerCase().includes(busquedaLower) ||
      u.cargo?.toLowerCase().includes(busquedaLower) ||
      u.rol?.toLowerCase().includes(busquedaLower);

    const coincideEstatus = 
      filtroEstatus === "todos" || 
      (filtroEstatus === "activos" && u.activo !== false) || 
      (filtroEstatus === "inactivos" && u.activo === false);

    return coincideBusqueda && coincideEstatus;
  });

  return (
    <div className="container">
      <header className="header-main">
        <button className="btn-back" onClick={() => router.push("/administrador")}>⬅ Volver</button>
        <div className="titles">
          <h1>Gestión de Usuarios</h1>
          <p>Panel de control de personal SISLEXI</p>
        </div>
        <button className="btn-add" onClick={() => router.push("/administrador/usuarios/nuevo")}>
          + Registrar Nuevo
        </button>
      </header>

      <div className="filter-bar">
        <div className="search-box">
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por Nombre, P00, Rol, Departamento..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select className="select-filter" onChange={(e) => setFiltroEstatus(e.target.value)}>
          <option value="todos">Todos los Estatus</option>
          <option value="activos">Solo Activos</option>
          <option value="inactivos">Solo Inactivos</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Estatus</th>
              <th>Código P00</th>
              <th>Cédula</th>
              <th>Nombres y Apellidos</th>
              <th>Cargo / Unidad</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => (
              <tr key={u.id} className={u.activo === false ? "row-inactive" : ""}>
                <td>
                  <span className={`status-dot ${u.activo !== false ? "active" : "inactive"}`}></span>
                  <span className="status-text">{u.activo !== false ? "Activo" : "Inactivo"}</span>
                </td>
                {/* 🏷️ COLUMNAS SEPARADAS AQUÍ */}
                <td className="p00-cell"><strong>{u.p00}</strong></td>
                <td className="cedula-cell">{u.cedula}</td>
                <td>{u.nombre}</td>
                <td>
                  <div className="cargo-text">{u.cargo}</div>
                  <div className="sub-text">{u.departamento}</div>
                </td>
                <td>
                  <span className={`badge role-${u.rol}`}>{u.rol}</span>
                </td>
                <td className="actions-cell">
                  <button className="btn-icon view" title="Ver Detalles" onClick={() => setUsuarioDetalle(u)}>👁️</button>
                  <button className="btn-icon edit" title="Editar" onClick={() => router.push(`/administrador/usuarios/editar/${u.id}`)}>✏️</button>
                  <button 
                    className={`btn-icon ${u.activo !== false ? "disable" : "enable"}`} 
                    onClick={() => toggleEstatus(u.id, u.activo !== false)}
                  >
                    {u.activo !== false ? "🚫" : "✅"}
                  </button>
                  <button className="btn-icon delete" onClick={() => eliminarUsuario(u.id, u.nombre)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DETALLES */}
      {usuarioDetalle && (
        <div className="modal-overlay" onClick={() => setUsuarioDetalle(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Ficha Detallada del Usuario</h3>
            <hr />
            <div className="modal-grid">
              <p><strong>Nombre:</strong> {usuarioDetalle.nombre}</p>
              <p><strong>Cédula:</strong> {usuarioDetalle.cedula}</p>
              <p><strong>Código P00:</strong> {usuarioDetalle.p00}</p>
              <p><strong>Rol:</strong> <span className="text-capitalize">{usuarioDetalle.rol}</span></p>
              <p><strong>Correo:</strong> {usuarioDetalle.correo}</p>
              <p><strong>Teléfono:</strong> {usuarioDetalle.telefono}</p>
              <p><strong>Cargo:</strong> {usuarioDetalle.cargo}</p>
              <p><strong>Departamento:</strong> {usuarioDetalle.departamento}</p>
              <p><strong>Nacionalidad:</strong> {usuarioDetalle.nacionalidad}</p>
              <p><strong>Fecha Ingreso:</strong> {usuarioDetalle.fechaIngreso}</p>
            </div>
            <button className="btn-close" onClick={() => setUsuarioDetalle(null)}>Cerrar Detalle</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .container { padding: 40px; background: #f1f5f9; min-height: 100vh; font-family: sans-serif; }
        .header-main { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; }
        h1 { color: #002d72; margin: 0; }
        .btn-add { background: #1e3a8a; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; }
        
        .filter-bar { display: flex; gap: 15px; margin-bottom: 20px; }
        .search-box { flex: 1; background: white; display: flex; align-items: center; padding: 10px 20px; border-radius: 10px; border: 1px solid #cbd5e1; }
        .search-box input { border: none; outline: none; width: 100%; margin-left: 10px; }

        .table-card { background: white; border-radius: 15px; overflow-x: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        table { width: 100%; border-collapse: collapse; min-width: 1000px; }
        th { background: #f8fafc; padding: 15px; text-align: left; font-size: 0.75rem; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
        td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
        
        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
        .active { background: #22c55e; }
        .inactive { background: #ef4444; }
        .status-text { font-size: 0.75rem; font-weight: 500; }
        
        .p00-cell { color: #1e3a8a; font-weight: bold; }
        .cedula-cell { color: #475569; }
        .sub-text { font-size: 0.75rem; color: #94a3b8; }
        
        .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
        .role-admin { background: #fee2e2; color: #991b1b; }
        .role-abogado { background: #fef3c7; color: #92400e; }
        .role-trabajador { background: #e0f2fe; color: #0369a1; }

        .actions-cell { display: flex; gap: 5px; }
        .btn-icon { border: none; background: #f1f5f9; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 1rem; }
        .btn-icon:hover { background: #e2e8f0; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: white; padding: 30px; border-radius: 20px; width: 90%; max-width: 600px; }
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
        .btn-close { margin-top: 25px; width: 100%; padding: 12px; background: #1e3a8a; color: white; border: none; border-radius: 10px; cursor: pointer; }
      `}</style>
    </div>
  );
}