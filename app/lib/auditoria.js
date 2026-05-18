import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export const registrarAuditoriaReal = async (accion, modulo, tipo, detalle, nombreUser = "SISTEMA", rolUser = "ADMIN") => {
  try {
    const respuesta = await fetch('https://api.ipify.org?format=json');
    const datosIp = await respuesta.json();
    const ipPublica = datosIp.ip;

    const agente = window.navigator.userAgent;
    let SO = "Windows";
    if (agente.includes("Android")) SO = "Android";
    else if (agente.includes("iPhone")) SO = "iOS";
    else if (agente.includes("Linux")) SO = "Linux";

    await addDoc(collection(db, "auditoria"), {
      responsable: nombreUser,
      rol: rolUser,
      accion: accion,
      modulo: modulo,
      tipo: tipo, 
      detalle: detalle,
      dispositivo: `${ipPublica} (${SO})`,
      fecha: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error en auditoría:", e);
  }
};