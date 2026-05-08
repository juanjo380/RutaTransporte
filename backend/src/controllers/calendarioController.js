import { getCalendarioContexto } from "../utils/calendario.js";

export async function obtenerCalendarioEstado(_req, res) {
  try {
    const contexto = getCalendarioContexto();
    return res.status(200).json({
      ok: true,
      data: {
        diaSemana: contexto.diaSemana,
        diaLabel: contexto.diaLabel,
        fechaIso: contexto.fechaIso,
        fechaLabel: contexto.fechaLabel,
        esDiaSiguiente: contexto.esDiaSiguiente,
        cutoffHour: contexto.cutoffHour,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Error al obtener calendario",
      error: error.message,
    });
  }
}
