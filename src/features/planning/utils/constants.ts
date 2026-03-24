import type { ClassSession } from "@/types";

export const classTypeLabels: Record<ClassSession["type"], string> = {
   teorica: "Teorica",
   practica: "Practica",
   oral: "Evaluativa (Oral)",
   "teorico-practica": "Teorica/Practica",
   evaluacion: "Evaluativa",
   repaso: "Repaso",
   recuperatorio: "Recuperatorio",
};

export const planningTypeFilterOptions: Array<{
   value: Exclude<ClassSession["type"], "oral">;
   label: string;
}> = [
   { value: "teorica", label: classTypeLabels.teorica },
   { value: "teorico-practica", label: classTypeLabels["teorico-practica"] },
   { value: "practica", label: classTypeLabels.practica },
   { value: "evaluacion", label: classTypeLabels.evaluacion },
   { value: "repaso", label: classTypeLabels.repaso },
   { value: "recuperatorio", label: classTypeLabels.recuperatorio },
];

export const classTypeColors: Record<ClassSession["type"], string> = {
   teorica: "bg-info/20 text-info-foreground border border-info/45",
   practica: "status-ok",
   oral: "status-critical",
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
   if (status === "sin_planificar") return "Sin planificar";
   if (status === "planificada") return "Planificada";
   return "Dictada";
}

export function getStatusColor(status: ClassSession["status"]) {
   if (status === "sin_planificar") return "bg-warning/15 text-warning-foreground";
   if (status === "planificada") return "bg-primary/12 text-primary";
   return "bg-success/12 text-success";
}
