import { Building2, Plus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type GroupsListItem = {
   id: string;
   name: string;
   course: string;
   studentCount: number;
   planProgress: number;
   institutionName: string;
   institutionColor: string;
};

export function GroupsListView({
   groups,
   onSelect,
   onAddSubject,
}: {
   groups: GroupsListItem[];
   onSelect: (subjectId: string) => void;
   onAddSubject: () => void;
}) {
   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
         <div className="mb-6 flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">Todos tus grupos activos</p>
            <Button size="sm" className="text-xs" onClick={onAddSubject}>
               <Plus className="mr-1.5 size-3.5" />
               Agregar materia
            </Button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
               <Card
                  key={group.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSelect(group.id)}
               >
                  <CardContent className="p-5">
                     <div className="flex items-start justify-between mb-3">
                        <div>
                           <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
                           <p className="text-xs text-muted-foreground">{group.course}</p>
                        </div>
                        <div
                           className="flex size-8 items-center justify-center rounded-lg"
                           style={{ backgroundColor: `${group.institutionColor}15` }}
                        >
                           <Building2
                              className="size-4"
                              style={{ color: group.institutionColor }}
                           />
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                        <Building2 className="size-3" />
                        <span>{group.institutionName}</span>
                     </div>
                     <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground">
                        <Users className="size-3" />
                        <span>{group.studentCount} alumnos</span>
                     </div>
                     <div>
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[10px] text-muted-foreground">Planificacion</span>
                           <span className="text-[10px] font-medium text-foreground">
                              {group.planProgress}%
                           </span>
                        </div>
                        <Progress value={group.planProgress} className="h-1.5" />
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>
   );
}
