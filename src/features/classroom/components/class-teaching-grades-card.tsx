import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { performanceEntryKey, performanceKindLabel } from "@/features/classroom/utils";
import { rubricLevelPresets } from "@/lib/grading-schemes";
import type { ClassroomPerformanceEntry, Student, SubjectRubric } from "@/types";

type ClassTeachingGradesCardProps = {
   classStudents: Student[];
   isFinalized: boolean;
   performanceStudentId: string;
   performanceReferenceLabel: string;
   displayedReferenceOptions: string[];
   performanceScore: string;
   performanceNote: string;
   editingPerformanceKey: string | null;
   performanceEntries: ClassroomPerformanceEntry[];
   availableRubrics: SubjectRubric[];
   useRubricMode: boolean;
   selectedRubricId: string;
   rubricCriterionSelections: Record<string, string>;
   rubricComputedScore: number | null;
   onUseRubricModeChange: (value: boolean) => void;
   onSelectedRubricChange: (value: string) => void;
   onRubricCriterionChange: (criterionId: string, value: string) => void;
   onApplyRubricScore: () => void;
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

export function ClassTeachingGradesCard({
   classStudents,
   isFinalized,
   performanceStudentId,
   performanceReferenceLabel,
   displayedReferenceOptions,
   performanceScore,
   performanceNote,
   editingPerformanceKey,
   performanceEntries,
   availableRubrics,
   useRubricMode,
   selectedRubricId,
   rubricCriterionSelections,
   rubricComputedScore,
   onUseRubricModeChange,
   onSelectedRubricChange,
   onRubricCriterionChange,
   onApplyRubricScore,
   onPerformanceStudentChange,
   onPerformanceReferenceChange,
   onPerformanceScoreChange,
   onPerformanceNoteChange,
   onSavePerformance,
   onResetPerformance,
   onEditPerformance,
   onDeletePerformance,
   studentNameById,
}: ClassTeachingGradesCardProps) {
   const selectedRubric =
      availableRubrics.find((rubric) => rubric.id === selectedRubricId) ?? null;
   const canUseRubrics = availableRubrics.length > 0;
   const usingRubric = canUseRubrics && useRubricMode;

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

                  {canUseRubrics && (
                     <label className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5">
                        <Checkbox
                           checked={usingRubric}
                           onCheckedChange={(checked) => onUseRubricModeChange(Boolean(checked))}
                           disabled={isFinalized}
                        />
                        <span className="text-xs text-foreground">Usar rúbrica para esta nota</span>
                     </label>
                  )}

                  {usingRubric && (
                     <div className="rounded-md border border-border/70 p-2 space-y-2">
                        <div className="grid gap-2 sm:grid-cols-3 items-end">
                           <div className="sm:col-span-2 flex flex-col gap-1">
                              <Label className="text-xs">Rúbrica</Label>
                              <select
                                 className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                                 value={selectedRubricId}
                                 onChange={(event) => onSelectedRubricChange(event.target.value)}
                                 disabled={isFinalized}
                              >
                                 {availableRubrics.map((rubric) => (
                                    <option key={rubric.id} value={rubric.id}>
                                       {rubric.name}
                                    </option>
                                 ))}
                              </select>
                           </div>
                           <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={onApplyRubricScore}
                              disabled={isFinalized || rubricComputedScore === null}
                           >
                              Aplicar rúbrica
                           </Button>
                        </div>

                        {selectedRubric ? (
                           <div className="space-y-1.5">
                              {selectedRubric.criteria.map((criterion) => (
                                 <div key={criterion.id} className="grid grid-cols-12 gap-2 items-center">
                                    <span className="col-span-6 text-[11px] text-muted-foreground truncate">
                                       {criterion.name} ({criterion.weight}%)
                                    </span>
                                    <select
                                       className="col-span-6 h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                                       value={rubricCriterionSelections[criterion.id] ?? ""}
                                       onChange={(event) =>
                                          onRubricCriterionChange(criterion.id, event.target.value)
                                       }
                                       disabled={isFinalized}
                                    >
                                       <option value="" disabled>
                                          Seleccionar nivel
                                       </option>
                                       {rubricLevelPresets.map((preset) => (
                                          <option key={preset.value} value={preset.value}>
                                             {preset.label}
                                          </option>
                                       ))}
                                    </select>
                                 </div>
                              ))}
                           </div>
                        ) : null}

                        {rubricComputedScore !== null && (
                           <p className="text-[11px] text-success">
                              Nota sugerida por rúbrica: {rubricComputedScore}
                           </p>
                        )}
                     </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                     {usingRubric ? (
                        <div className="flex flex-col gap-1">
                           <Label className="text-xs">Nota calculada</Label>
                           <Input
                              className="h-8 text-xs"
                              value={rubricComputedScore !== null ? String(rubricComputedScore) : ""}
                              placeholder="Completa la rúbrica para calcular"
                              readOnly
                              disabled
                           />
                        </div>
                     ) : (
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
                     )}
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
                        disabled={isFinalized || (usingRubric && rubricComputedScore === null)}
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
