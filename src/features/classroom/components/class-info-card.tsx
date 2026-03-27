import {
   ArrowLeft,
   Clock,
   MapPin,
   BookOpen,
   CheckCircle2,
   CircleDot,
   PlayCircle,
   Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classTypeLabels } from "@/features/classroom/utils/classroom-constants";
import type { ClassSession, Institution } from "@/types";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@/components/ui/tooltip";

const classStatusMeta: Record<
   ClassSession["status"],
   {
      label: string;
      description: string;
      badgeClassName: string;
      Icon: typeof CircleDot;
   }
> = {
   sin_planificar: {
      label: "Sin planificar",
      description: "La clase existe, pero todavia faltan contenidos y estructura.",
      badgeClassName: "bg-destructive/15 text-destructive border-destructive/40",
      Icon: CircleDot,
   },
   planificada: {
      label: "Planificada",
      description: "La clase ya tiene plan y esta lista para iniciar.",
      badgeClassName: "bg-warning/20 text-warning-foreground border-warning/40",
      Icon: PlayCircle,
   },
   dictada: {
      label: "Finalizada",
      description: "La clase fue dictada y registrada con seguimiento.",
      badgeClassName: "bg-success/15 text-success border-success/40",
      Icon: CheckCircle2,
   },
};

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
   const statusMeta = classStatusMeta[cls.status];
   const StatusIcon = statusMeta.Icon;

   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
               Informacion de la clase
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Badge
                              className={`border text-[10px] inline-flex items-center gap-1 ${statusMeta.badgeClassName}`}
                           >
                              <StatusIcon className="size-3" />
                              {statusMeta.label}
                           </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="max-w-64">
                           {statusMeta.description}
                        </TooltipContent>
                     </Tooltip>
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
                  <p className="text-xs text-foreground leading-relaxed">{cls.activities}</p>
               </div>
            )}

            {cls.status !== "dictada" && (
               <div className="mt-4 flex items-center gap-2">
                  <Button
                     size="sm"
                     className="text-xs min-h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                     onClick={onMarkAsTaught}
                  >
                     <CheckCircle2 className="size-3.5 mr-1.5" />
                     Registrar como dictada
                  </Button>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <button
                           type="button"
                           className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                           aria-label="Ayuda sobre registrar como dictada"
                        >
                           <Info className="size-3.5" />
                        </button>
                     </TooltipTrigger>
                     <TooltipContent side="top" sideOffset={6} className="max-w-64">
                        Marca la clase como ejecutada y habilita la carga de asistencia y
                        notas finales.
                     </TooltipContent>
                  </Tooltip>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

export function ClassDetailHeader({
   topic,
   subjectName,
   course,
   showBack = true,
}: {
   topic: string;
   subjectName: string;
   course: string;
   showBack?: boolean;
}) {
   return (
      <div className="flex items-center gap-3 mb-6">
         {showBack ? (
            <Button variant="ghost" size="icon" className="size-8" asChild>
               <Link to="/planificacion">
                  <ArrowLeft className="size-4" />
               </Link>
            </Button>
         ) : null}
         <div>
            <h1 className="text-xl font-bold text-foreground">{topic}</h1>
            <p className="text-sm text-muted-foreground">
               {subjectName} - {course}
            </p>
         </div>
      </div>
   );
}
