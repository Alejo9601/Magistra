import { Sparkles } from "lucide-react";

export function DashboardHero({
   formattedDate,
   teacherName,
}: {
   formattedDate: string;
   teacherName: string;
}) {
   return (
      <div className="mb-6 rounded-2xl border border-border/80 bg-gradient-to-br from-primary/15 via-background to-warning/10 px-5 py-4">
         <div className="flex items-start justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
                  Buen dia, {teacherName}
               </h1>
               <p className="text-sm text-muted-foreground capitalize">
                  {formattedDate}
               </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
               <Sparkles className="size-3.5 text-primary" />
               Panel Docente
            </div>
         </div>
      </div>
   );
}
