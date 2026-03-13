import { Cpu, Gamepad2, Laptop, SlidersHorizontal, Sparkles } from "lucide-react";

export function DashboardHero({
   formattedDate,
   teacherName,
}: {
   formattedDate: string;
   teacherName: string;
}) {
   const modeItems = [
      { id: "auto", label: "Auto", icon: Sparkles },
      { id: "plan", label: "Planificacion", icon: SlidersHorizontal },
      { id: "dictado", label: "Dictado", icon: Laptop },
      { id: "seguimiento", label: "Seguimiento", icon: Cpu },
      { id: "evaluacion", label: "Evaluacion", icon: Gamepad2 },
   ];

   return (
      <div className="surface-card mb-6 rounded-lg border border-border/80 bg-gradient-to-r from-primary/22 via-background to-info/20 px-4 py-4 sm:px-5">
         <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
               <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Modo operativo
               </p>
               <h1 className="text-xl font-bold tracking-tight text-foreground text-balance sm:text-2xl">
                  Buen dia, {teacherName}
               </h1>
               <p className="text-sm text-muted-foreground capitalize">
                  {formattedDate}
               </p>
            </div>
            <div className="hidden items-center gap-2 rounded-md border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
               <Sparkles className="size-3.5 text-primary" />
               Panel Docente
            </div>
         </div>
         <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            {modeItems.map((item) => (
               <div
                  key={item.id}
                  className="rounded-md border border-border/80 bg-card/70 px-3 py-3"
               >
                  <item.icon className="mb-2 size-4 text-primary" />
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
               </div>
            ))}
         </div>
      </div>
   );
}
