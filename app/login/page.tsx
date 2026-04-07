"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);

  const iniciar = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, clave);
      router.push("/trabajador");
    } catch (err) {
      alert("Credenciales incorrectas");
      setLoading(false);
    }
  };

  return (
    <div className="fondo">

      {/* CARD PRINCIPAL */}
      <div className="card">
        <img
          src="https://images.seeklogo.com/logo-png/18/2/cantv-logo-png_seeklogo-184311.png"
          className="logo"
        />

        <h1 className="titulo">Bienvenido</h1>
        <p className="subtitulo">Inicia tu sesión</p>

        <input
          className="input"
          type="email"
          placeholder="Correo institucional"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setClave(e.target.value)}
        />

        <button className="btn" onClick={iniciar}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </div>

      {/* BOTÓN IA */}
      <div className="ia-btn">
        <img
          src="/img/robot.jpg"
          className="ia-img"
        />
        <span className="ia-text">Sislexi AI</span>
      </div>

      {/* ESTILOS */}
      <style jsx>{`
        /* FONDO GENERAL */
        .fondo {
          width: 100%;
          height: 100vh;
          background: url("https://images.unsplash.com/photo-1614850523011-8f49ffc73908?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zm9uZG8lMjBhenVsfGVufDB8fDB8fHww")
            no-repeat center center/cover;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        /* CARD GLASS */
        .card {
          width: 90%;
          max-width: 420px;
          padding: 35px 30px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
          text-align: center;
          color: white;
          animation: fadeUp 0.7s ease;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logo {
          width: 65%;
          margin: 0 auto 15px auto;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
        }

        .titulo {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .subtitulo {
          opacity: 0.85;
          margin-bottom: 25px;
        }

        .input {
          width: 100%;
          padding: 14px;
          margin-bottom: 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.75);
          border: none;
          font-size: 1rem;
        }

        .btn {
          width: 100%;
          padding: 14px;
          border: none;
          background: #0f2b7f;
          color: white;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn:hover {
          background: #0b1f66;
        }

        /* IA BUTTON */
        .ia-btn {
          position: absolute;
          bottom: 25px;
          right: 25px;
          background: white;
          padding: 10px 14px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(0,0,0,0.25);
          transition: 0.2s ease;
        }

        .ia-btn:hover {
          transform: scale(1.05);
        }

        .ia-img {
          width: 40px;
        }

        .ia-text {
          font-weight: 700;
          color: #0f2b7f;
        }

        @media (max-width: 480px) {
          .card {
            padding: 28px 25px;
          }
          .titulo {
            font-size: 1.8rem;
          }
          .ia-btn {
            bottom: 18px;
            right: 18px;
          }
        }
      `}</style>
    </div>
  );
}