import type { ClassSession } from "@/lib/edu-repository";

export const classTypeLabels: Record<ClassSession["type"], string> = {
   teorica: "Teorica",
   practica: "Practica",
   oral: "Oral",
   "teorico-practica": "Teorica/Practica",
   evaluacion: "Evaluativa",
   repaso: "Repaso",
   recuperatorio: "Recuperatorio",
};

export const classTypeColors: Record<ClassSession["type"], string> = {
   teorica: "bg-info/20 text-info-foreground border border-info/45",
   practica: "status-ok",
   oral: "bg-info/20 text-info-foreground border border-info/45",
   "teorico-practica": "status-warning",
   evaluacion: "status-critical",
   repaso: "status-warning",
   recuperatorio: "bg-info/20 text-info-foreground border border-info/45",
};

export const monthNames = [
   "Enero",
   "Febrero",
   "Marzo",
   "Abril",
   "Mayo",
   "Junio",
   "Julio",
   "Agosto",
   "Septiembre",
   "Octubre",
   "Noviembre",
   "Diciembre",
];

export function getStatusLabel(status: ClassSession["status"]) {
   if (status === "planificada") return "Planificada";
   if (status === "sin-planificar") return "Sin planificar";
   return "Finalizada";
}

export function getStatusColor(status: ClassSession["status"]) {
   if (status === "planificada") return "status-ok";
   if (status === "sin-planificar") return "status-warning";
   return "status-ok";
}
