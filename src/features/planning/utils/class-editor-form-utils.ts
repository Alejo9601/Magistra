import type { ActivityType, ClassBlock, ClassSession, EvaluativeFormat } from "@/types";

export const classCharacterOptions: Array<{
   value: ClassSession["type"];
   label: string;
}> = [
   { value: "teorica", label: "Teorica" },
   { value: "practica", label: "Practica" },
   { value: "teorico-practica", label: "Teorica/Practica" },
];

export const activityTypeOptions: Array<{
   value: ActivityType;
   label: string;
}> = [
   { value: "practica", label: "Practica" },
   { value: "examen", label: "Examen" },
   { value: "proyecto", label: "Proyecto" },
   { value: "tarea", label: "Tarea" },
];

export const evaluativeFormatOptions: Array<{
   value: NonNullable<ClassSession["evaluativeFormat"]>;
   label: string;
}> = [
   { value: "oral", label: "Oral" },
   { value: "escrito", label: "Escrito" },
   { value: "actividad-practica", label: "Actividad Practica" },
   { value: "otro", label: "Otro" },
];

export function normalizeClassType(
   value: ClassSession["type"] | "oral" | "",
): ClassSession["type"] | "" {
   if (
      value === "oral" ||
      value === "evaluacion" ||
      value === "repaso" ||
      value === "recuperatorio"
   ) {
      return "teorico-practica";
   }
   return value as ClassSession["type"] | "";
}

export function normalizeEvaluativeFormat(
   value: ClassSession["evaluativeFormat"] | "",
): ClassSession["evaluativeFormat"] | "" {
   if (value === "exposicion-oral" || value === "examen-oral") {
      return "oral";
   }
   if (value === "examen-escrito") {
      return "escrito";
   }
   if (value === "trabajo-practico-evaluativo") {
      return "actividad-practica";
   }
   return value;
}

export function createEmptyBlock(order: number): ClassBlock {
   return {
      order,
      topic: "",
      subtopics: [],
      type: "teorica",
      evaluativeFormat: undefined,
      practiceActivityType: undefined,
      practiceActivityName: undefined,
      practiceActivityDescription: undefined,
      evaluationName: undefined,
      evaluationDescription: undefined,
   };
}

export function cloneBlockContent(source: ClassBlock, order: number): ClassBlock {
   return {
      order,
      topic: source.topic,
      subtopics: [...source.subtopics],
      type: source.type,
      evaluativeFormat: source.evaluativeFormat,
      practiceActivityType: source.practiceActivityType,
      practiceActivityName: source.practiceActivityName,
      practiceActivityDescription: source.practiceActivityDescription,
      evaluationName: source.evaluationName,
      evaluationDescription: source.evaluationDescription,
   };
}

export function normalizeBlockDuration(value: number | undefined) {
   if (!value || Number.isNaN(value) || value <= 0) {
      return 40;
   }
   return Math.round(value);
}

export function deriveBlocksFromClass(
   initialClass: ClassSession | null,
   nextBlockDuration: number,
): ClassBlock[] {
   const initialType =
      (normalizeClassType(
         (initialClass?.type as ClassSession["type"] | "oral" | "") ?? "teorica",
      ) || "teorica") as ClassBlock["type"];
   const inferredBlockCount = Math.max(
      1,
      Math.round((initialClass?.durationMinutes ?? nextBlockDuration) / nextBlockDuration),
   );

   const sourceBlocks =
      initialClass?.blocks && initialClass.blocks.length > 0
         ? initialClass.blocks
         : Array.from({ length: inferredBlockCount }, (_, index) =>
              index === 0
                 ? {
                      ...createEmptyBlock(1),
                      topic: initialClass?.topic ?? "",
                      subtopics: initialClass?.subtopics ?? [],
                      type: initialType,
                      evaluativeFormat: normalizeEvaluativeFormat(initialClass?.evaluativeFormat ?? "") || undefined,
                      practiceActivityType:
                         initialType === "practica" || initialType === "teorico-practica"
                            ? initialClass?.practiceActivityType
                            : undefined,
                      practiceActivityName:
                         initialType === "practica" || initialType === "teorico-practica"
                            ? initialClass?.practiceActivityName
                            : undefined,
                      practiceActivityDescription:
                         initialType === "practica" || initialType === "teorico-practica"
                            ? initialClass?.practiceActivityDescription
                            : undefined,
                      evaluationName: initialClass?.evaluationName,
                      evaluationDescription: initialClass?.evaluationDescription,
                   }
                 : createEmptyBlock(index + 1),
           );

   return sourceBlocks.length > 0
      ? sourceBlocks.map((block, index) => ({ ...block, order: index + 1 }))
      : [createEmptyBlock(1)];
}

export function normalizeBlocksForSubmit(blocks: ClassBlock[]): ClassBlock[] {
   return blocks.length > 0
      ? blocks.map((block, index) => ({ ...block, order: index + 1 }))
      : [createEmptyBlock(1)];
}

export function resolveClassDataFromBlocks(normalizedBlocks: ClassBlock[]) {
   const primaryBlock = normalizedBlocks[0];
   const hasBlockContent = normalizedBlocks.some(
      (block) =>
         block.topic.trim().length > 0 ||
         block.subtopics.some((subtopic) => subtopic.trim().length > 0) ||
         (block.practiceActivityName?.trim().length ?? 0) > 0 ||
         (block.evaluationName?.trim().length ?? 0) > 0,
   );

   const blockTopics = normalizedBlocks
      .flatMap((block) => [block.topic.trim(), ...block.subtopics.map((subtopic) => subtopic.trim())])
      .filter((value) => value.length > 0);

   const resolvedTopic =
      normalizedBlocks.find((block) => block.topic.trim().length > 0)?.topic.trim() ||
      "Por planificar";
   const resolvedSubtopics = Array.from(new Set(blockTopics)).filter(
      (item) => item !== resolvedTopic,
   );

   const resolvedType = normalizeClassType(primaryBlock?.type ?? "teorica") || "teorica";
   const resolvedPracticeActivityType =
      resolvedType === "practica" || resolvedType === "teorico-practica"
         ? primaryBlock?.practiceActivityType ?? "practica"
         : undefined;
   const resolvedPracticeActivityName =
      resolvedType === "practica" || resolvedType === "teorico-practica"
         ? primaryBlock?.practiceActivityName?.trim() || undefined
         : undefined;
   const resolvedPracticeActivityDescription =
      resolvedType === "practica" || resolvedType === "teorico-practica"
         ? primaryBlock?.practiceActivityDescription?.trim() || undefined
         : undefined;

   return {
      hasBlockContent,
      resolvedTopic,
      resolvedSubtopics,
      resolvedType,
      resolvedEvaluativeFormat: undefined as EvaluativeFormat | undefined,
      resolvedPracticeActivityType,
      resolvedPracticeActivityName,
      resolvedPracticeActivityDescription,
      resolvedEvaluationName: undefined as string | undefined,
      resolvedEvaluationDescription: undefined as string | undefined,
   };
}
