import type { ActivityStatus, ActivityType, AssessmentType } from "@/types";

export type PrimaryEvaluativeFormat = "oral" | "escrito" | "actividad-practica" | "otro";

export const primaryEvaluativeFormatOptions: Array<{
   value: PrimaryEvaluativeFormat;
   label: string;
}> = [
   { value: "escrito", label: "Escrito" },
   { value: "oral", label: "Oral" },
   { value: "actividad-practica", label: "Actividad Practica" },
   { value: "otro", label: "Otro" },
];

export const evaluativeClassTypeLabel: Record<string, string> = {
   oral: "Oral",
   escrito: "Escrito",
   "actividad-practica": "Actividad Practica",
   otro: "Otro",
   "exposicion-oral": "Oral",
   "examen-escrito": "Escrito",
   "examen-oral": "Oral",
   "trabajo-practico-evaluativo": "Actividad Practica",
};

export const assessmentTypeLabel: Record<AssessmentType, string> = {
   exam: "Examen",
   practice_work: "Trabajo practico",
};

export function inferEvaluativeTypeFromTitle(title: string) {
   const normalized = title.trim().toLowerCase();
   if (normalized.startsWith("oral:")) return "Oral";
   if (normalized.startsWith("escrito:")) return "Escrito";
   if (normalized.startsWith("actividad practica:")) return "Actividad Practica";
   if (normalized.startsWith("otro:")) return "Otro";
   return null;
}

export const activityTypeLabel: Record<ActivityType, string> = {
   practica: "Practica",
   examen: "Examen",
   proyecto: "Proyecto",
   tarea: "Tarea",
};

export const activityStatusLabel: Record<ActivityStatus, string> = {
   draft: "Borrador",
   planned: "Planificada",
   assigned: "Asignada",
   completed: "Completada",
};

export const activityStatusBadgeClass: Record<ActivityStatus, string> = {
   draft: "bg-muted text-muted-foreground",
   planned: "bg-primary/10 text-primary",
   assigned: "bg-info/10 text-info",
   completed: "bg-success/10 text-success",
};


