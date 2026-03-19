import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attendanceConfig } from "@/features/classroom/utils/classroom-constants";
import type { AttendanceStatus } from "@/features/classroom/types";
import type { Student } from "@/lib/edu-repository";

export function AttendanceCard({
   classStudents,
   attendance,
   setAttendance,
   onSave,
   disabled = false,
}: {
   classStudents: Student[];
   attendance: Record<string, AttendanceStatus>;
   setAttendance: (next: Record<string, AttendanceStatus>) => void;
   onSave: () => void;
   disabled?: boolean;
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
            <div className="flex flex-col gap-2">
               {classStudents.map((student) => (
                  <div
                     key={student.id}
                     className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0"
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
                                    className={`flex items-center justify-center size-7 rounded-md text-[10px] font-bold border transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isSelected ? `${config.bg} ${config.color} border-current` : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"}`}
                                 >
                                    {config.label}
                                 </button>
                              );
                           },
                        )}
                     </div>
                  </div>
               ))}
            </div>
            <Button size="sm" className="w-full mt-4 text-xs" onClick={onSave} disabled={disabled}>
               Guardar asistencia
            </Button>
         </CardContent>
      </Card>
   );
}





