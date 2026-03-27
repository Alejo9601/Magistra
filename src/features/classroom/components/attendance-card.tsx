import { AlertTriangle, CheckCircle2, Info, Save } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attendanceConfig } from "@/features/classroom/utils/classroom-constants";
import type { AttendanceStatus } from "@/features/classroom/types";
import type { Student } from "@/types";
import { cn } from "@/lib/utils";

export function AttendanceCard({
   classStudents,
   attendance,
   setAttendance,
   onSave,
   disabled = false,
   lockedMessage,
   lockedActionLabel,
   onLockedAction,
   hasPendingChanges = false,
   savedFeedbackVisible = false,
   savedSnapshot = {},
   showSavedIndicators = false,
}: {
   classStudents: Student[];
   attendance: Record<string, AttendanceStatus>;
   setAttendance: (next: Record<string, AttendanceStatus>) => void;
   onSave: () => void;
   disabled?: boolean;
   lockedMessage?: string;
   lockedActionLabel?: string;
   onLockedAction?: () => void;
   hasPendingChanges?: boolean;
   savedFeedbackVisible?: boolean;
   savedSnapshot?: Record<string, AttendanceStatus>;
   showSavedIndicators?: boolean;
}) {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
               Asistencia del dia
               <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({classStudents.length} alumnos)
               </span>
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            {lockedMessage ? (
               <div className="space-y-3 rounded-md border border-dashed border-border/70 bg-muted/25 p-3 text-center">
                  <p className="inline-flex items-center justify-center gap-2 text-xs text-muted-foreground">
                     <Info className="size-3.5" />
                     {lockedMessage}
                  </p>
                  {lockedActionLabel && onLockedAction ? (
                     <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={onLockedAction}
                     >
                        <AlertTriangle className="mr-1.5 size-3.5" />
                        {lockedActionLabel}
                     </Button>
                  ) : null}
               </div>
            ) : (
               <>
                  <div className="flex flex-col gap-2">
                     {classStudents.map((student) => {
                        const currentStatus = attendance[student.id];
                        const savedStatus = savedSnapshot[student.id];
                        const hasChanges = currentStatus !== savedStatus;

                        return (
                           <div
                              key={student.id}
                              className={cn(
                                 "flex items-center gap-2.5 rounded-md py-1.5 px-1.5 border-b border-border last:border-0 transition-colors",
                                 hasChanges && "bg-warning/10",
                                 savedFeedbackVisible && !hasChanges && "bg-success/10",
                              )}
                           >
                              <Avatar className="size-7">
                                 <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                                    {student.name[0]}
                                    {student.lastName[0]}
                                 </AvatarFallback>
                              </Avatar>
                              <span className="flex-1 text-xs font-medium text-foreground min-w-0 truncate">
                                 {student.lastName}, {student.name}
                              </span>
                              {showSavedIndicators && !hasChanges ? (
                                 <CheckCircle2
                                    className="size-3.5 text-success shrink-0"
                                    aria-label="Registro guardado"
                                 />
                              ) : null}
                              <div className="flex gap-1">
                                 {(Object.keys(attendanceConfig) as AttendanceStatus[]).map(
                                    (status) => {
                                       const config = attendanceConfig[status];
                                       const isSelected = attendance[student.id] === status;
                                       return (
                                          <button
                                             key={status}
                                             onClick={() => {
                                                if (disabled) {
                                                   return;
                                                }
                                                setAttendance({
                                                   ...attendance,
                                                   [student.id]: status,
                                                });
                                             }}
                                             disabled={disabled}
                                             className={`flex items-center justify-center size-8 rounded-md text-[10px] font-bold border transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isSelected ? `${config.bg} ${config.color} border-current` : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"}`}
                                          >
                                             {config.label}
                                          </button>
                                       );
                                    },
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
                  <Button
                     size="sm"
                     className={cn(
                        "w-full mt-4 min-h-10 text-xs font-semibold",
                        hasPendingChanges &&
                           "bg-primary text-primary-foreground hover:bg-primary/90",
                        !hasPendingChanges &&
                           !savedFeedbackVisible &&
                           "bg-muted text-muted-foreground hover:bg-muted/90",
                     )}
                     onClick={onSave}
                     disabled={disabled}
                  >
                     {savedFeedbackVisible ? (
                        <>
                           <CheckCircle2 className="mr-1.5 size-3.5 text-success" />
                           Asistencia guardada
                        </>
                     ) : (
                        <>
                           <Save className="mr-1.5 size-3.5" />
                           Guardar asistencia
                        </>
                     )}
                  </Button>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                     {hasPendingChanges
                        ? "Hay cambios pendientes por guardar."
                        : "Sin cambios pendientes."}
                  </p>
               </>
            )}
         </CardContent>
      </Card>
   );
}
