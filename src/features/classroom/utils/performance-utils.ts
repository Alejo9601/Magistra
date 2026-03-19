import type { ClassSession, ClassroomPerformanceEntry, ClassroomPerformanceKind } from "@/types";

export function parseActivityChecklist(activities?: string) {
   if (!activities) {
      return [];
   }
   const parts = activities
      .split(/\r?\n|[.;]/g)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
   return Array.from(new Set(parts));
}

export const performanceKindOptions: Array<{
   value: ClassroomPerformanceKind;
   label: string;
}> = [
   { value: "activity", label: "Actividad" },
   { value: "practice_work", label: "Trabajo practico" },
   { value: "exam", label: "Evaluacion" },
];

export const evaluativeFormatLabelMap: Record<
   NonNullable<ClassSession["evaluativeFormat"]>,
   string
> = {
   oral: "Oral",
   escrito: "Escrito",
   "actividad-practica": "Actividad Practica",
   otro: "Otro",
   "exposicion-oral": "Oral",
   "examen-escrito": "Escrito",
   "examen-oral": "Oral",
   "trabajo-practico-evaluativo": "Actividad Practica",
};

export function performanceKindLabel(kind: ClassroomPerformanceKind) {
   return performanceKindOptions.find((option) => option.value === kind)?.label ?? kind;
}

export function performanceEntryKey(entry: Pick<ClassroomPerformanceEntry, "studentId" | "kind">) {
   return `${entry.studentId}::${entry.kind}`;
}

export function normalizeText(value: string) {
   return value.trim().replace(/\s+/g, " ");
}

export function normalizeExamReference(value: string) {
   const normalized = normalizeText(value);
   const lowered = normalized.toLowerCase();
   const prefixes = ["oral:", "escrito:", "actividad practica:", "otro:"];
   const prefix = prefixes.find((candidate) => lowered.startsWith(candidate));
   if (!prefix) {
      return normalized;
   }
   return normalizeText(normalized.slice(prefix.length));
}

export function normalizeReferenceForKind(value: string, kind: ClassroomPerformanceKind) {
   const normalized = kind === "exam" ? normalizeExamReference(value) : normalizeText(value);
   return normalized.toLowerCase();
}
