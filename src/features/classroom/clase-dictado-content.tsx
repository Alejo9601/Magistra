import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
   getAssignmentIdBySubjectId,
   getInstitutionById,
   getSubjectById,
} from "@/lib/edu-repository";
import { usePlanningContext } from "@/features/planning";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import { useActivitiesContext } from "@/features/activities";
import { useAssessmentsContext } from "@/features/assessments";
import { AttendanceCard } from "@/features/classroom/attendance-card";
import { classTypeLabels, type AttendanceStatus } from "@/features/classroom/constants";
import type { ClassroomPerformanceEntry, ClassroomPerformanceKind } from "@/types";

function parseActivityChecklist(activities?: string) {
   if (!activities) {
      return [];
   }
   const parts = activities
      .split(/\r?\n|[.;]/g)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
   return Array.from(new Set(parts));
}

const performanceKindOptions: Array<{
   value: ClassroomPerformanceKind;
   label: string;
}> = [
   { value: "activity", label: "Actividad" },
   { value: "practice_work", label: "Trabajo practico" },
   { value: "exam", label: "Evaluacion" },
];

const evaluativeFormatLabelMap: Record<
   NonNullable<import("@/types").ClassSession["evaluativeFormat"]>,
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

function performanceKindLabel(kind: ClassroomPerformanceKind) {
   return performanceKindOptions.find((option) => option.value === kind)?.label ?? kind;
}

function performanceEntryKey(entry: Pick<ClassroomPerformanceEntry, "studentId" | "kind">) {
   return `${entry.studentId}::${entry.kind}`;
}

export function ClaseDictadoContent() {
   const params = useParams();
   const classId = params.id as string;
   const { classes, markClassAsTaught, updateClass } = usePlanningContext();
   const { getStudentsByAssignment } = useStudentsContext();
   const {
      getRecord,
      toggleSubtopic,
      setAttendance,
      setNotes,
      setPerformanceEntries,
   } = useClassroomContext();
   const { getActivitiesByAssignment } = useActivitiesContext();
   const { getAssessmentsByAssignment, updateAssessment } = useAssessmentsContext();

   const [addingSubtopic, setAddingSubtopic] = useState(false);
   const [newSubtopic, setNewSubtopic] = useState("");
   const [performanceStudentId, setPerformanceStudentId] = useState("");
   const [performanceKind, setPerformanceKind] =
      useState<ClassroomPerformanceKind>("activity");
   const [performanceScore, setPerformanceScore] = useState("");
   const [performanceNote, setPerformanceNote] = useState("");
   const [performanceReferenceLabel, setPerformanceReferenceLabel] = useState("");
   const [editingPerformanceKey, setEditingPerformanceKey] = useState<string | null>(null);

   const cls = classes.find((classSession) => classSession.id === classId);
   const assignmentId = cls
      ? cls.assignmentId ?? getAssignmentIdBySubjectId(cls.subjectId)
      : "";
   const subject = cls ? getSubjectById(cls.subjectId) : null;
   const institution = cls ? getInstitutionById(cls.institutionId) : null;
   const classStudents = assignmentId ? getStudentsByAssignment(assignmentId) : [];
   const subjectActivities = assignmentId ? getActivitiesByAssignment(assignmentId) : [];
   const linkedActivityTitles = cls
      ? subjectActivities
           .filter((activity) => activity.linkedClassIds.includes(cls.id))
           .map((activity) => activity.title)
      : [];
   const activityChecklist = cls
      ? Array.from(
           new Set([...parseActivityChecklist(cls.activities), ...linkedActivityTitles]),
        )
      : [];
   const subjectAssessments = assignmentId ? getAssessmentsByAssignment(assignmentId) : [];
   const linkedAssessmentTitles = cls
      ? subjectAssessments
           .filter((assessment) => assessment.linkedClassId === cls.id)
           .map((assessment) => assessment.title)
      : [];
   const examReferenceOptions = Array.from(
      new Set([
         cls?.evaluationName?.trim() ?? "",
         ...linkedAssessmentTitles,
         ...subjectAssessments.map((assessment) => assessment.title),
      ]),
   ).filter((entry) => entry.length > 0);
   const activityReferenceOptions = Array.from(
      new Set([
         cls?.practiceActivityName?.trim() ?? "",
         ...activityChecklist,
         ...subjectActivities.map((activity) => activity.title),
      ]),
   ).filter((entry) => entry.length > 0);
   const performanceReferenceOptions =
      performanceKind === "exam" ? examReferenceOptions : activityReferenceOptions;
   const displayedReferenceOptions =
      performanceReferenceLabel &&
      !performanceReferenceOptions.includes(performanceReferenceLabel)
         ? [performanceReferenceLabel, ...performanceReferenceOptions]
         : performanceReferenceOptions;

   const defaultPerformanceKind: ClassroomPerformanceKind =
      cls?.type === "evaluacion"
         ? cls.evaluativeFormat === "actividad-practica" ||
           cls.evaluativeFormat === "trabajo-practico-evaluativo"
            ? "practice_work"
            : "exam"
         : "activity";

   useEffect(() => {
      if (!performanceStudentId && classStudents.length > 0) {
         setPerformanceStudentId(classStudents[0].id);
      }
   }, [classStudents, performanceStudentId]);

   useEffect(() => {
      if (!editingPerformanceKey && performanceKind !== defaultPerformanceKind) {
         setPerformanceKind(defaultPerformanceKind);
      }
      if (performanceReferenceOptions.length === 0) {
         setPerformanceReferenceLabel("");
         return;
      }
      if (!performanceReferenceOptions.includes(performanceReferenceLabel)) {
         setPerformanceReferenceLabel(performanceReferenceOptions[0]);
      }
   }, [
      defaultPerformanceKind,
      editingPerformanceKey,
      performanceKind,
      performanceReferenceLabel,
      performanceReferenceOptions,
   ]);

   if (!cls || !subject || !institution) {
      return (
         <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Clase no encontrada.</p>
         </div>
      );
   }

   const record = getRecord(cls.id);
   const performanceEntries = record.performanceEntries;
   const attendanceWithDefaults: Record<string, AttendanceStatus> = Object.fromEntries(
      classStudents.map((student) => [
         student.id,
         record.attendance[student.id] ?? ("P" as AttendanceStatus),
      ]),
   );
   const completedSubtopicsCount = cls.subtopics.filter((subtopic) =>
      record.completedSubtopics.includes(subtopic),
   ).length;

   const syncAssessmentGradesLoaded = (
      entries: ClassroomPerformanceEntry[],
      kind: ClassroomPerformanceKind,
      referenceLabel?: string,
   ) => {
      const assessmentType =
         kind === "practice_work" ? "practice_work" : kind === "exam" ? "exam" : null;
      if (!assessmentType) {
         return;
      }

      const linkedAssessments = subjectAssessments.filter(
         (assessment) =>
            assessment.linkedClassId === cls.id && assessment.type === assessmentType,
      );
      if (linkedAssessments.length === 0) {
         return;
      }

      const normalizedReference = referenceLabel?.trim().toLowerCase() ?? "";
      const targetAssessment =
         linkedAssessments.find((assessment) => {
            const title = assessment.title.trim().toLowerCase();
            return (
               normalizedReference.length > 0 &&
               (normalizedReference === title ||
                  normalizedReference.includes(title) ||
                  title.includes(normalizedReference))
            );
         }) ?? linkedAssessments[0];

      const normalizedAssessmentTitle = targetAssessment.title.trim().toLowerCase();
      const filteredEntries = entries
         .filter((entry) => entry.kind === kind)
         .filter((entry) => {
            if (linkedAssessments.length === 1) {
               return true;
            }
            const entryReference = entry.referenceLabel?.trim().toLowerCase() ?? "";
            if (!entryReference) {
               return true;
            }
            return (
               entryReference === normalizedAssessmentTitle ||
               entryReference.includes(normalizedAssessmentTitle) ||
               normalizedAssessmentTitle.includes(entryReference)
            );
         });

      const uniqueStudents = new Set(filteredEntries.map((entry) => entry.studentId));
      updateAssessment(targetAssessment.id, {
         gradesLoaded: uniqueStudents.size,
      });
   };


   const handleAddSubtopic = () => {
      const value = newSubtopic.trim();
      if (!value) {
         toast.error("Escribe un subtema valido.");
         return;
      }
      if (cls.subtopics.some((subtopic) => subtopic.toLowerCase() === value.toLowerCase())) {
         toast.error("Ese subtema ya existe.");
         return;
      }
      updateClass(cls.id, {
         subtopics: [...cls.subtopics, value],
      });
      setNewSubtopic("");
      setAddingSubtopic(false);
      toast.success("Subtema agregado.");
   };

   const resetPerformanceForm = () => {
      setPerformanceKind(defaultPerformanceKind);
      setPerformanceScore("");
      setPerformanceNote("");
      const defaultReferenceOptions =
         defaultPerformanceKind === "exam"
            ? examReferenceOptions
            : activityReferenceOptions;
      setPerformanceReferenceLabel(defaultReferenceOptions[0] ?? "");
      setEditingPerformanceKey(null);
   };

   const handleSavePerformance = () => {
      const studentId = performanceStudentId;
      const scoreText = performanceScore.trim();
      if (!studentId) {
         toast.error("Selecciona un alumno.");
         return;
      }
      if (!scoreText) {
         toast.error("Ingresa una nota o valor.");
         return;
      }

      if (!performanceReferenceLabel.trim()) {
         toast.error("Selecciona el nombre del examen o actividad.");
         return;
      }

      const numericPattern = /^-?\d+([.,]\d+)?$/;
      const normalizedScore: number | string = numericPattern.test(scoreText)
         ? Number(scoreText.replace(",", "."))
         : scoreText;

      const nextEntry: ClassroomPerformanceEntry = {
         studentId,
         kind: performanceKind,
         score: normalizedScore,
         referenceLabel:
            performanceReferenceLabel.trim().length > 0
               ? performanceReferenceLabel.trim()
               : undefined,
         note: performanceNote.trim().length > 0 ? performanceNote.trim() : undefined,
      };

      const nextEntries = [
         ...performanceEntries.filter(
            (entry) => performanceEntryKey(entry) !== performanceEntryKey(nextEntry),
         ),
         nextEntry,
      ];

      setPerformanceEntries(cls.id, nextEntries);
      syncAssessmentGradesLoaded(nextEntries, performanceKind, nextEntry.referenceLabel);
      toast.success(
         editingPerformanceKey ? "Registro actualizado." : "Registro agregado.",
      );
      resetPerformanceForm();
   };

   const handleEditPerformance = (entry: ClassroomPerformanceEntry) => {
      setPerformanceStudentId(entry.studentId);
      setPerformanceKind(entry.kind);
      setPerformanceScore(String(entry.score));
      setPerformanceNote(entry.note ?? "");
      setPerformanceReferenceLabel(entry.referenceLabel ?? "");
      setEditingPerformanceKey(performanceEntryKey(entry));
   };

   const handleDeletePerformance = (entry: ClassroomPerformanceEntry) => {
      const nextEntries = performanceEntries.filter(
         (current) => performanceEntryKey(current) !== performanceEntryKey(entry),
      );
      setPerformanceEntries(cls.id, nextEntries);
      syncAssessmentGradesLoaded(nextEntries, entry.kind, entry.referenceLabel);
      if (editingPerformanceKey === performanceEntryKey(entry)) {
         resetPerformanceForm();
      }
      toast.success("Registro eliminado.");
   };

   const studentNameById = (studentId: string) => {
      const student = classStudents.find((item) => item.id === studentId);
      if (!student) {
         return "Alumno no encontrado";
      }
      return `${student.lastName}, ${student.name}`;
   };

   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
         <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
               <Button variant="ghost" size="icon" className="size-8" asChild>
                  <Link to={`/clase/${cls.id}`}>
                     <ArrowLeft className="size-4" />
                  </Link>
               </Button>
               <div>
                  <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                     <ClipboardCheck className="size-5 text-primary" />
                     Vista de Dictado
                  </h1>
                  <p className="text-sm text-muted-foreground">
                     {subject.name} - {subject.course} - {cls.date} {cls.time} hs
                  </p>
               </div>
            </div>
            <Button
               size="sm"
               className="text-xs"
               onClick={() => {
                  setAttendance(cls.id, attendanceWithDefaults);
                  markClassAsTaught(cls.id);
                  toast.success("Clase finalizada y asistencia registrada.");
               }}
            >
               <CheckCircle2 className="size-3.5 mr-1.5" />
               Cerrar clase de hoy
            </Button>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 space-y-6">
               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">
                        Resumen de planificacion
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                     <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Eje principal:</span> {cls.topic}
                     </p>
                     <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Caracter:</span> {classTypeLabels[cls.type] ?? cls.type}
                     </p>
                     {(cls.type === "practica" || cls.type === "teorico-practica") && (
                        <>
                           <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">Actividad:</span> {cls.practiceActivityName || "Sin nombre"}
                           </p>
                           <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">Descripcion:</span> {cls.practiceActivityDescription || "Sin descripcion"}
                           </p>
                        </>
                     )}
                     {cls.type === "evaluacion" && (
                        <>
                           <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">Evaluacion:</span> {cls.evaluationName || "Sin nombre"}
                           </p>
                           <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">Tipo:</span> {cls.evaluativeFormat ? evaluativeFormatLabelMap[cls.evaluativeFormat] : "Sin tipo"}
                           </p>
                           <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">Descripcion:</span> {cls.evaluationDescription || "Sin descripcion"}
                           </p>
                        </>
                     )}
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                           Subtemas dictados
                        </CardTitle>
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="text-[10px]">
                              {completedSubtopicsCount}/{cls.subtopics.length}
                           </Badge>
                           <Button
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() => setAddingSubtopic((prev) => !prev)}
                              title="Agregar subtema"
                           >
                              {addingSubtopic ? (
                                 <X className="size-3.5" />
                              ) : (
                                 <Plus className="size-3.5" />
                              )}
                           </Button>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                     {addingSubtopic && (
                        <div className="mb-3 flex gap-2">
                           <Input
                              className="h-8 text-xs"
                              placeholder="Nuevo subtema..."
                              value={newSubtopic}
                              onChange={(event) => setNewSubtopic(event.target.value)}
                           />
                           <Button size="sm" className="h-8 text-xs" onClick={handleAddSubtopic}>
                              Agregar
                           </Button>
                        </div>
                     )}
                     {cls.subtopics.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                           Esta clase no tiene subtemas cargados.
                        </p>
                     ) : (
                        <div className="space-y-2">
                           {cls.subtopics.map((subtopic) => (
                              <label
                                 key={subtopic}
                                 className="flex items-start gap-2.5 cursor-pointer"
                              >
                                 <Checkbox
                                    checked={record.completedSubtopics.includes(subtopic)}
                                    onCheckedChange={() =>
                                       toggleSubtopic(cls.id, subtopic)
                                    }
                                 />
                                 <span className="text-xs text-foreground">
                                    {subtopic}
                                 </span>
                              </label>
                           ))}
                        </div>
                     )}
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">
                        Registro rapido de notas
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                     {classStudents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                           No hay alumnos vinculados a esta clase.
                        </p>
                     ) : (
                        <>
                           <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex flex-col gap-1">
                                 <Label className="text-xs">Alumno</Label>
                                 <select
                                    className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                                    value={performanceStudentId}
                                    onChange={(event) => setPerformanceStudentId(event.target.value)}
                                 >
                                    {classStudents.map((student) => (
                                       <option key={student.id} value={student.id}>
                                          {student.lastName}, {student.name}
                                       </option>
                                    ))}
                                 </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                 <Label className="text-xs">Nombre relacionado</Label>
                                 <select
                                    className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                                    value={performanceReferenceLabel}
                                    onChange={(event) => setPerformanceReferenceLabel(event.target.value)}
                                 >
                                    {displayedReferenceOptions.length === 0 ? (
                                       <option value="" disabled>
                                          Sin referencias disponibles
                                       </option>
                                    ) : displayedReferenceOptions.map((option) => (
                                       <option key={option} value={option}>
                                          {option}
                                       </option>
                                    ))}
                                 </select>
                              </div>
                           </div>

                           <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex flex-col gap-1">
                                 <Label className="text-xs">Nota / valor</Label>
                                 <Input
                                    className="h-8 text-xs"
                                    placeholder="Ej: 8.5 o Aprobado"
                                    value={performanceScore}
                                    onChange={(event) => setPerformanceScore(event.target.value)}
                                 />
                              </div>
                              <div className="flex flex-col gap-1">
                                 <Label className="text-xs">Observacion</Label>
                                 <Input
                                    className="h-8 text-xs"
                                    placeholder="Comentario opcional"
                                    value={performanceNote}
                                    onChange={(event) => setPerformanceNote(event.target.value)}
                                 />
                              </div>
                           </div>

                           <div className="flex items-center gap-2">
                              <Button size="sm" className="text-xs" onClick={handleSavePerformance}>
                                 {editingPerformanceKey ? "Actualizar registro" : "Agregar registro"}
                              </Button>
                              {editingPerformanceKey && (
                                 <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={resetPerformanceForm}
                                 >
                                    Cancelar edicion
                                 </Button>
                              )}
                           </div>
                        </>
                     )}

                     {performanceEntries.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                           Aun no cargaste notas para actividades, trabajos practicos o evaluaciones.
                        </p>
                     ) : (
                        <div className="space-y-2">
                           {performanceEntries.map((entry) => (
                              <div
                                 key={performanceEntryKey(entry)}
                                 className="rounded-md border border-border/70 p-2"
                              >
                                 <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="min-w-0">
                                       <p className="text-xs font-semibold text-foreground truncate">
                                          {studentNameById(entry.studentId)}
                                       </p>
                                       <p className="text-[11px] text-muted-foreground">
                                          {performanceKindLabel(entry.kind)}
                                          {entry.referenceLabel ? ` - ${entry.referenceLabel}` : ""}
                                          {` - Nota: ${String(entry.score)}`}
                                          {entry.note ? ` - ${entry.note}` : ""}
                                       </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs"
                                          onClick={() => handleEditPerformance(entry)}
                                       >
                                          Editar
                                       </Button>
                                       <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs text-destructive"
                                          onClick={() => handleDeletePerformance(entry)}
                                       >
                                          Eliminar
                                       </Button>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">
                        Observaciones de dictado
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                     <Label className="sr-only">Observaciones</Label>
                     <Textarea
                        className="text-xs min-h-[100px] resize-none"
                        placeholder="Que salio bien, que ajustar para la proxima clase, incidencias..."
                        value={record.notes ?? ""}
                        onChange={(event) => setNotes(cls.id, event.target.value)}
                     />
                  </CardContent>
               </Card>
            </div>

            <div className="xl:col-span-2">
               <AttendanceCard
                  classStudents={classStudents}
                  attendance={attendanceWithDefaults}
                  setAttendance={(attendance) => setAttendance(cls.id, attendance)}
                  onSave={() => toast.success("Asistencia guardada.")}
               />
            </div>
         </div>
      </div>
   );
}

