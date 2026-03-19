import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { performanceEntryKey, performanceKindLabel } from "@/features/classroom/utils";
import type { ClassroomPerformanceEntry, Student } from "@/types";

type ClaseDictadoGradesCardProps = {
   classStudents: Student[];
   isFinalized: boolean;
   performanceStudentId: string;
   performanceReferenceLabel: string;
   displayedReferenceOptions: string[];
   performanceScore: string;
   performanceNote: string;
   editingPerformanceKey: string | null;
   performanceEntries: ClassroomPerformanceEntry[];
   onPerformanceStudentChange: (value: string) => void;
   onPerformanceReferenceChange: (value: string) => void;
   onPerformanceScoreChange: (value: string) => void;
   onPerformanceNoteChange: (value: string) => void;
   onSavePerformance: () => void;
   onResetPerformance: () => void;
   onEditPerformance: (entry: ClassroomPerformanceEntry) => void;
   onDeletePerformance: (entry: ClassroomPerformanceEntry) => void;
   studentNameById: (studentId: string) => string;
};

export function ClaseDictadoGradesCard({
   classStudents,
   isFinalized,
   performanceStudentId,
   performanceReferenceLabel,
   displayedReferenceOptions,
   performanceScore,
   performanceNote,
   editingPerformanceKey,
   performanceEntries,
   onPerformanceStudentChange,
   onPerformanceReferenceChange,
   onPerformanceScoreChange,
   onPerformanceNoteChange,
   onSavePerformance,
   onResetPerformance,
   onEditPerformance,
   onDeletePerformance,
   studentNameById,
}: ClaseDictadoGradesCardProps) {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Registro de notas</CardTitle>
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
                           onChange={(event) => onPerformanceStudentChange(event.target.value)}
                           disabled={isFinalized}
                        >
                           {classStudents.map((student) => (
                              <option key={student.id} value={student.id}>
                                 {student.lastName}, {student.name}
                              </option>
                           ))}
                        </select>
                     </div>
                     <div className="flex flex-col gap-1">
                        <Label className="text-xs">Examen / Actividad relacionada</Label>
                        <select
                           className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                           value={performanceReferenceLabel}
                           onChange={(event) => onPerformanceReferenceChange(event.target.value)}
                           disabled={isFinalized}
                        >
                           {displayedReferenceOptions.length === 0 ? (
                              <option value="" disabled>
                                 Sin referencias disponibles
                              </option>
                           ) : (
                              displayedReferenceOptions.map((option) => (
                                 <option key={option} value={option}>
                                    {option}
                                 </option>
                              ))
                           )}
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
                           onChange={(event) => onPerformanceScoreChange(event.target.value)}
                           disabled={isFinalized}
                        />
                     </div>
                     <div className="flex flex-col gap-1">
                        <Label className="text-xs">Observacion</Label>
                        <Input
                           className="h-8 text-xs"
                           placeholder="Comentario opcional"
                           value={performanceNote}
                           onChange={(event) => onPerformanceNoteChange(event.target.value)}
                           disabled={isFinalized}
                        />
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <Button
                        size="sm"
                        className="text-xs"
                        onClick={onSavePerformance}
                        disabled={isFinalized}
                     >
                        {editingPerformanceKey ? "Actualizar registro" : "Agregar registro"}
                     </Button>
                     {editingPerformanceKey && (
                        <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           className="text-xs"
                           onClick={onResetPerformance}
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
                                 onClick={() => onEditPerformance(entry)}
                                 disabled={isFinalized}
                              >
                                 Editar
                              </Button>
                              <Button
                                 type="button"
                                 variant="ghost"
                                 size="sm"
                                 className="h-7 px-2 text-xs text-destructive"
                                 onClick={() => onDeletePerformance(entry)}
                                 disabled={isFinalized}
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
   );
}
