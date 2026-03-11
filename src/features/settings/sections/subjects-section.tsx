import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { institutions, subjects } from "@/lib/edu-repository";

export function SubjectsSection() {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
               <BookOpen className="size-4" />
               Materias y cursos
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            {institutions.map((inst) => {
               const instSubjects = subjects.filter(
                  (s) => s.institutionId === inst.id,
               );
               return (
                  <div key={inst.id} className="mb-4 last:mb-0">
                     <div className="flex items-center gap-2 mb-2">
                        <div
                           className="size-3 rounded-full"
                           style={{ backgroundColor: inst.color }}
                        />
                        <span className="text-xs font-semibold text-foreground">
                           {inst.name}
                        </span>
                     </div>
                     <div className="flex flex-col gap-1.5 pl-5">
                        {instSubjects.map((sub) => (
                           <div
                              key={sub.id}
                              className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                           >
                              <div>
                                 <span className="text-xs font-medium text-foreground">
                                    {sub.name}
                                 </span>
                                 <span className="text-xs text-muted-foreground ml-2">
                                    {sub.course}
                                 </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                 {sub.studentCount} alumnos
                              </span>
                           </div>
                        ))}
                     </div>
                     {inst !== institutions[institutions.length - 1] && (
                        <Separator className="mt-3" />
                     )}
                  </div>
               );
            })}
         </CardContent>
      </Card>
   );
}
