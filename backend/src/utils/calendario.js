const DIA_LABELS = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miercoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
};

const DIA_MAP = {
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
};

function formatDateIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function skipWeekend(date) {
  let result = new Date(date);
  while (result.getDay() === 0 || result.getDay() === 6) {
    result = addDays(result, 1);
  }
  return result;
}

export function getCalendarioContexto({ now = new Date(), cutoffHour = 20 } = {}) {
  const base = new Date(now);
  const afterCutoff = base.getHours() >= cutoffHour;
  const target = skipWeekend(afterCutoff ? addDays(base, 1) : base);
  const diaSemana = DIA_MAP[target.getDay()] || null;
  const fechaIso = formatDateIso(target);
  const fechaLabel = target.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return {
    diaSemana,
    diaLabel: diaSemana ? DIA_LABELS[diaSemana] : null,
    fechaIso,
    fechaLabel,
    esDiaSiguiente: formatDateIso(base) !== fechaIso,
    cutoffHour,
  };
}

export function normalizarDireccionApi(value) {
  const normalizada = String(value || "").trim().toUpperCase();
  if (normalizada === "IDA") {
    return "ida";
  }
  if (normalizada === "VUELTA") {
    return "vuelta";
  }
  return null;
}

export function getDiaLabel(diaSemana) {
  return diaSemana ? DIA_LABELS[diaSemana] || null : null;
}
