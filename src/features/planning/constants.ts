import type { ClassSession } from "@/lib/edu-repository";

export const classTypeLabels: Record<ClassSession["type"], string> = {
   teorica: "Teorica",
   practica: "Practica",
   evaluacion: "Evaluacion",
   repaso: "Repaso",
   recuperatorio: "Recuperatorio",
};

export const classTypeColors: Record<ClassSession["type"], string> = {
   teorica: "bg-primary/10 text-primary",
   practica: "bg-success/10 text-success",
   evaluacion: "bg-destructive/10 text-destructive",
   repaso: "bg-warning/10 text-warning-foreground",
   recuperatorio: "bg-info/10 text-info",
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
   if (status === "planificada") return "bg-primary/10 text-primary";
   if (status === "sin-planificar") return "bg-warning/10 text-warning-foreground";
   return "bg-success/10 text-success";
}
