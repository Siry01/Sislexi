"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
// IMPORTAMOS LA FUNCIÓN DE AUDITORÍA
import { registrarAuditoriaReal } from "../lib/auditoria";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);

  const iniciar = async () => {
    if (!email || !clave) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      setLoading(true);
      localStorage.clear();
      
      const userCredential = await signInWithEmailAndPassword(auth, email, clave);
      const user = userCredential.user;

      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const datosDB = docSnap.data();
        const rolExtraido = datosDB.rol ? datosDB.rol.trim().toLowerCase() : "trabajador";
        const nombreReal = datosDB.nombre || "Usuario";

        // REGISTRO DE AUDITORÍA: LOGIN EXITOSO
        await registrarAuditoriaReal(
          "Inicio de Sesión", 
          "LOGIN", 
          "success", 
          `El usuario ${email} accedió exitosamente`,
          nombreReal,
          rolExtraido.toUpperCase()
        );

        localStorage.setItem("user", JSON.stringify({ nombre: nombreReal, rol: rolExtraido }));
        localStorage.setItem("rol", rolExtraido);

        if (rolExtraido === "admin") {
          router.push("/administrador");
        } else if (rolExtraido === "abogado") {
          router.push("/abogado");
        } else {
          router.push("/trabajador");
        }

      } else {
        alert("El usuario no tiene perfil en la base de datos.");
      }

    } catch (err) {
      console.error("Error en el login:", err);
      
      // REGISTRO DE AUDITORÍA: INTENTO FALLIDO (Seguridad)
      await registrarAuditoriaReal(
        "Intento Fallido", 
        "LOGIN", 
        "error", 
        `Fallo de autenticación para el correo: ${email}`,
        "SISTEMA",
        "DESCONOCIDO"
      );

      alert("Credenciales incorrectas o error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fondo">
      <div className="card">
        <img src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" className="logo" alt="CANTV" />
        <h1 className="titulo">Bienvenido</h1>
        <p className="subtitulo">Inicia sesión en SISELXI</p>

        <input className="input" type="email" placeholder="Correo institucional" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)} onKeyDown={(e) => e.key === "Enter" && iniciar()} />

        <button className="btn" onClick={iniciar} disabled={loading}>
          {loading ? "Verificando..." : "Ingresar"}
        </button>
      </div>

      <style jsx>{`
        .fondo { width: 100%; height: 100vh; background: url('https://images.unsplash.com/photo-1614850523011-8f49ffc73908?fm=jpg&q=60&w=3000&auto=format&fit=crop') no-repeat center center/cover; display: flex; justify-content: center; align-items: center; }
        .card { width: 90%; max-width: 420px; padding: 35px; border-radius: 20px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(18px); box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25); text-align: center; color: white; }
        .logo { width: 65%; margin-bottom: 15px; }
        .titulo { font-size: 2rem; font-weight: 800; }
        .input { width: 100%; padding: 14px; margin-bottom: 14px; border-radius: 10px; border: none; background: white; color: #333; }
        .btn { width: 100%; padding: 14px; border: none; background: #0f2b7f; color: white; border-radius: 10px; font-weight: 600; cursor: pointer; }
      `}</style>
    </div>
  );
}