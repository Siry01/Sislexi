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
        const rol = docSnap.data().rol;

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
        alert("Usuario sin rol");
      }
    } catch (error) {
      console.error(error);
      alert("Error al iniciar sesión");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-blue-900">
      <div className="bg-white p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">SISLEXI AI</h2>

        <input
          type="email"
          placeholder="Correo"
          className="w-full p-2 mb-3 border rounded"
          onChange={(e) => setCorreo(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setClave(e.target.value)}
        />

        <button
          onClick={manejarLogin}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Ingresar
        </button>
      </div>
    </div>
  );
}