import {
   ArrowLeft,
   Clock,
   MapPin,
   BookOpen,
   CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classTypeLabels } from "@/features/classroom/utils/classroom-constants";
import type { ClassSession, Institution } from "@/lib/edu-repository";

export function ClassInfoCard({
   cls,
   inst,
   onMarkAsTaught,
}: {
   cls: ClassSession;
   inst: Institution;
   onMarkAsTaught: () => void;
}) {
   const dateObj = new Date(cls.date + "T12:00:00");

   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
               Informacion de la clase
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                     <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Fecha y hora
                     </p>
                     <p className="text-xs font-medium text-foreground">
                        {dateObj.toLocaleDateString("es-AR", {
                           weekday: "long",
                           day: "numeric",
                           month: "long",
                        })}{" "}
                        - {cls.time} hs
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                     <MapPin className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Institucion
                     </p>
                     <p className="text-xs font-medium text-foreground">{inst.name}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                     <BookOpen className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Tipo
                     </p>
                     <p className="text-xs font-medium text-foreground">
                        {classTypeLabels[cls.type]}
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                     <CheckCircle2 className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Estado
                     </p>
                     <Badge
                        className={`border-0 text-[10px] ${cls.status === "planificada" ? "bg-primary/10 text-primary" : cls.status === "finalizada" ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"}`}
                     >
                        {cls.status === "planificada"
                           ? "Planificada"
                           : cls.status === "finalizada"
                             ? "Finalizada"
                             : "Sin planificar"}
                     </Badge>
                  </div>
               </div>
            </div>

            {cls.subtopics.length > 0 && (
               <div className="mt-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                     Subtemas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                     {cls.subtopics.map((subtopic, index) => (
                        <Badge key={index} variant="secondary" className="text-[10px]">
                           {subtopic}
                        </Badge>
                     ))}
                  </div>
               </div>
            )}

            {cls.activities && (
               <div className="mt-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                     Actividades planificadas
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">
                     {cls.activities}
                  </p>
               </div>
            )}

            {cls.status !== "finalizada" && (
               <Button size="sm" className="mt-4 text-xs" onClick={onMarkAsTaught}>
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  Registrar como dictada
               </Button>
            )}
         </CardContent>
      </Card>
   );
}

export function ClassDetailHeader({
   topic,
   subjectName,
   course,
}: {
   topic: string;
   subjectName: string;
   course: string;
}) {
   return (
      <div className="flex items-center gap-3 mb-6">
         <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link to="/planificacion">
               <ArrowLeft className="size-4" />
            </Link>
         </Button>
         <div>
            <h1 className="text-xl font-bold text-foreground">{topic}</h1>
            <p className="text-sm text-muted-foreground">
               {subjectName} - {course}
            </p>
         </div>
      </div>
   );
}


