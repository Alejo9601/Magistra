export function classDateTimeMs(date: string, time: string) {
   return new Date(`${date}T${time}:00`).getTime();
}

export function formatCountdown(targetMs: number, nowMs: number) {
   const diff = targetMs - nowMs;
   if (diff <= 0) {
      return "En curso o pendiente de cierre";
   }
   const totalMinutes = Math.round(diff / (1000 * 60));
   if (totalMinutes < 60) {
      return `Empieza en ${totalMinutes} min`;
   }
   const hours = Math.floor(totalMinutes / 60);
   const minutes = totalMinutes % 60;
   return minutes > 0
      ? `Empieza en ${hours} h ${minutes} min`
      : `Empieza en ${hours} h`;
}

export function formatAgendaState(classDateMs: number, nowMs: number, status: string) {
   if (status === "dictada") {
      return "Dictada";
   }
   if (status === "en_curso") {
      return "En curso";
   }
   if (classDateMs <= nowMs) {
      return "Pendiente de cierre";
   }
   return "Pendiente";
}

export function computeAttendancePct(statuses: Array<"P" | "A" | "T" | "J">) {
   if (statuses.length === 0) {
      return null;
   }
   const attendedWeight = statuses.reduce((sum, status) => {
      if (status === "P" || status === "J") return sum + 1;
      if (status === "T") return sum + 0.5;
      return sum;
   }, 0);
   return Math.round((attendedWeight / statuses.length) * 100);
}
