export function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateBR(date?: string | null) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

export function formatDateTimeBR(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getMonthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthKeyFromString(date: string) {
  return getMonthKeyFromDate(new Date(`${date}T00:00:00`));
}
