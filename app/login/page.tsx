"use client";

import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const router = useRouter();

  const manejarLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, correo, clave);
      const user = userCredential.user;

      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const rol = userData.rol;

        // 🔥 PASO CLAVE: Guardamos los datos en localStorage para que el Panel los use
        localStorage.setItem("rol", rol);
        localStorage.setItem("user", JSON.stringify({
          nombre: userData.nombre,
          apellido: userData.apellido,
          p00: userData.p00,
          cedula: userData.cedula
        }));

        // Redirección según rol
        if (rol === "administrador") {
          router.push("/administrador");
        } else if (rol === "abogado") {
          router.push("/abogado");
        } else if (rol === "trabajador") {
          router.push("/trabajador");
        } else {
          alert("Rol no válido");
        }
      } else {
        alert("Usuario no encontrado en la base de datos");
      }
    } catch (error) {
      console.error(error);
      alert("Error al iniciar sesión: Verifique sus credenciales");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-blue-900">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 border-t-4 border-blue-600">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-blue-900">SISLEXI AI</h2>
          <p className="text-gray-500 text-sm">Gestión Legal Inteligente</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo institucional"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            onChange={(e) => setCorreo(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            onChange={(e) => setClave(e.target.value)}
          />

          <button
            onClick={manejarLogin}
            className="w-full bg-blue-700 text-white p-3 rounded-lg font-bold hover:bg-blue-800 transition shadow-lg active:scale-95"
          >
            Ingresar al Sistema
          </button>
        </div>
      </div>
    </div>
  );
}