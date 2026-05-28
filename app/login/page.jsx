"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { registrarAuditoriaReal } from "../lib/auditoria";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMia, setShowMia] = useState(false);
  const [miaMessage, setMiaMessage] = useState("");

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
        await registrarAuditoriaReal(
          "Inicio de Sesión", "LOGIN", "success", 
          `El usuario ${email} accedió exitosamente`, nombreReal, rolExtraido.toUpperCase()
        );
        localStorage.setItem("user", JSON.stringify({ nombre: nombreReal, rol: rolExtraido }));
        localStorage.setItem("rol", rolExtraido);
        if (rolExtraido === "admin") router.push("/administrador");
        else if (rolExtraido === "abogado") router.push("/abogado");
        else router.push("/trabajador");
      }
    } catch (err) {
      alert("Credenciales incorrectas o error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMia = () => {
    setShowMia(!showMia);
    if (!showMia) setMiaMessage("Hola, soy Sislexi 🤖, tu asistente legal. ¿Necesitas ayuda?");
  };

  return (
    <>
      <main className="login-page">
        <div className="login-card">
          <div className="logo-area">
            <img 
              src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png" 
              alt="Logo CANTV" 
              className="logo" 
            />
            <h1 className="title">Bienvenido a SISELXI</h1>
            <p className="subtitle">Sistema de asesorías legales</p>
          </div>

          <form className="form-area" onSubmit={(e) => { e.preventDefault(); iniciar(); }}>
            <input type="email" placeholder="Correo institucional" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
            <input type="password" placeholder="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)} required className="input" />
            <button className="btn" type="submit" disabled={loading}>{loading ? "Verificando..." : "Ingresar"}</button>
          </form>
        </div>

        <aside className="mia-container">
          <button className="mia-btn" onClick={toggleMia}>🤖 Sislexi</button>
          {showMia && (
            <div className="mia-message">
              <p>{miaMessage}</p>
              <button className="help-btn" onClick={() => alert("Contacta a soporte.")}>Recuperar contraseña</button>
            </div>
          )}
        </aside>
      </main>

      <style jsx>{`
        .login-page {
          height: 100vh; width: 100vw;
          display: flex; justify-content: center; align-items: center;
          background: linear-gradient(rgba(3, 10, 32, 0.7), rgba(3, 10, 32, 0.7)), 
                      url('https://img.freepik.com/fotos-premium/cuchillo-justicia-fondo-azul-derecho-sistema-juridico-concepto-abogado-criminal_1363766-22.jpg');
          background-size: cover; background-position: center;
          overflow: hidden; /* Evita que aparezca scroll */
        }

        .login-card {
          background: rgba(10, 25, 55, 0.8);
          backdrop-filter: blur(15px);
          padding: 30px;
          border-radius: 25px;
          width: 90%; max-width: 380px;
          border: 1px solid rgba(46, 161, 255, 0.4);
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          display: flex; flex-direction: column; align-items: center;
        }

        .logo-area { text-align: center; margin-bottom: 20px; }
        .logo { width: 150px; height: auto; margin-bottom: 10px; }
        .title { color: #fff; font-size: 1.4rem; margin: 0; }
        .subtitle { color: #8ab4f8; font-size: 0.85rem; margin-bottom: 15px; }

        .form-area { width: 100%; display: flex; flex-direction: column; gap: 12px; }
        .input {
          width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #2ea1ff;
          background: rgba(255,255,255,0.05); color: white; box-sizing: border-box;
        }
        .btn {
          padding: 12px; border-radius: 12px; border: none; background: #2ea1ff;
          color: white; font-weight: bold; cursor: pointer; transition: 0.3s;
        }

        .mia-container { position: fixed; right: 20px; bottom: 20px; display: flex; flex-direction: column; align-items: flex-end; }
        .mia-btn {
          padding: 10px 20px; border-radius: 50px; background: #2ea1ff;
          color: white; border: none; cursor: pointer; font-weight: bold;
        }
        .mia-message {
          margin-top: 10px; padding: 15px; border-radius: 15px;
          background: rgba(255,255,255,0.1); color: white; font-size: 0.8rem; width: 200px;
        }
      `}</style>
    </>
  );
}