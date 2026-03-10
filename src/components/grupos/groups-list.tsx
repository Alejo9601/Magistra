import { Building2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { subjects, getInstitutionById } from "@/lib/edu-repository";

export function GroupsList({
   onSelect,
   activeInstitution,
}: {
   onSelect: (subjectId: string) => void;
   activeInstitution: string;
}) {
   const scopedSubjects = subjects.filter(
      (sub) => sub.institutionId === activeInstitution,
   );

   return (
      <div className="p-6 max-w-7xl mx-auto">
         <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">Mis Grupos</h1>
            <p className="text-sm text-muted-foreground">
               Todos tus grupos activos
            </p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scopedSubjects.map((sub) => {
               const inst = getInstitutionById(sub.institutionId);
               return (
                  <Card
                     key={sub.id}
                     className="cursor-pointer hover:shadow-md transition-shadow"
                     onClick={() => onSelect(sub.id)}
                  >
                     <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                           <div>
                              <h3 className="text-sm font-semibold text-foreground">
                                 {sub.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                 {sub.course}
                              </p>
                           </div>
                           <div
                              className="flex size-8 items-center justify-center rounded-lg"
                              style={{ backgroundColor: inst?.color + "15" }}
                           >
                              <Building2
                                 className="size-4"
                                 style={{ color: inst?.color }}
                              />
                           </div>
                        </div>
                        <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                           <Building2 className="size-3" />
                           <span>{inst?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground">
                           <Users className="size-3" />
                           <span>{sub.studentCount} alumnos</span>
                        </div>
                        <div>
                           <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-muted-foreground">
                                 Planificacion
                              </span>
                              <span className="text-[10px] font-medium text-foreground">
                                 {sub.planProgress}%
                              </span>
                           </div>
                           <Progress
                              value={sub.planProgress}
                              className="h-1.5"
                           />
                        </div>
                     </CardContent>
                  </Card>
               );
            })}
         </div>
      </div>
   );
}
