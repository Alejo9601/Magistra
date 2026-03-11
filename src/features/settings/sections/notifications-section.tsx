import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const notifications = [
   {
      id: "n1",
      label: "Alumno en riesgo detectado",
      description:
         "Cuando un alumno cae por debajo del umbral de asistencia o promedio",
      enabled: true,
   },
   {
      id: "n2",
      label: "Clase sin planificar",
      description: "Recordatorio de clases proximas sin planificacion",
      enabled: true,
   },
   {
      id: "n3",
      label: "Notas pendientes de carga",
      description: "Evaluaciones con notas sin cargar",
      enabled: false,
   },
   {
      id: "n4",
      label: "Resumen semanal",
      description: "Resumen de actividades y pendientes de la semana",
      enabled: true,
   },
];

export function NotificationsSection() {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
               <Bell className="size-4" />
               Notificaciones
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            <div className="flex flex-col gap-3">
               {notifications.map((notif) => (
                  <div
                     key={notif.id}
                     className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                     <div className="flex-1 mr-4">
                        <p className="text-xs font-medium text-foreground">
                           {notif.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                           {notif.description}
                        </p>
                     </div>
                     <Switch defaultChecked={notif.enabled} />
                  </div>
               ))}
            </div>
         </CardContent>
      </Card>
   );
}
