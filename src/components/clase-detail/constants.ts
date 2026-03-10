export type AttendanceStatus = "P" | "A" | "T" | "J";

export const attendanceConfig: Record<
   AttendanceStatus,
   { label: string; color: string; bg: string }
> = {
   P: {
      label: "P",
      color: "text-success",
      bg: "bg-success/10 hover:bg-success/20 border-success/20",
   },
   A: {
      label: "A",
      color: "text-destructive",
      bg: "bg-destructive/10 hover:bg-destructive/20 border-destructive/20",
   },
   T: {
      label: "T",
      color: "text-warning-foreground",
      bg: "bg-warning/10 hover:bg-warning/20 border-warning/20",
   },
   J: {
      label: "J",
      color: "text-info",
      bg: "bg-info/10 hover:bg-info/20 border-info/20",
   },
};

export const classTypeLabels: Record<string, string> = {
   teorica: "Teorica",
   practica: "Practica",
   evaluacion: "Evaluacion",
   repaso: "Repaso",
   recuperatorio: "Recuperatorio",
};
