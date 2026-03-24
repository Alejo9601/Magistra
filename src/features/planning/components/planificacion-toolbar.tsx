import { CalendarDays, ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import type { StatusFilter, TypeFilter, ViewMode } from "@/features/planning/types";
import { planningTypeFilterOptions } from "@/features/planning/utils/constants";

type Props = {
   view: ViewMode;
   onViewChange: (view: ViewMode) => void;
   onCreateClass: () => void;
   onOpenSchedule: () => void;
   monthName: string;
   year: number;
   onPreviousMonth: () => void;
   onNextMonth: () => void;
   statusFilter: StatusFilter;
   onStatusFilterChange: (value: StatusFilter) => void;
   typeFilter: TypeFilter;
   onTypeFilterChange: (value: TypeFilter) => void;
   visibleClassesCount: number;
};

export function PlanificacionToolbar({
   view,
   onViewChange,
   onCreateClass,
   onOpenSchedule,
   monthName,
   year,
   onPreviousMonth,
   onNextMonth,
   statusFilter,
   onStatusFilterChange,
   typeFilter,
   onTypeFilterChange,
   visibleClassesCount,
}: Props) {
   return (
      <div className="-mx-3 mb-4 border-b border-border/70 bg-background/95 px-3 pb-3 sm:-mx-6 sm:px-6">
         <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pt-1">
            <div>
               <p className="text-sm text-muted-foreground">
                  Organiza, edita y publica tus clases por institucion.
               </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
               <div className="flex items-center rounded-lg bg-muted p-0.5">
                  <button
                     onClick={() => onViewChange("calendar")}
                     className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        view === "calendar"
                           ? "bg-card text-foreground shadow-sm"
                           : "text-muted-foreground hover:text-foreground"
                     }`}
                  >
                     <CalendarDays className="size-3.5" /> Mensual
                  </button>
                  <button
                     onClick={() => onViewChange("list")}
                     className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        view === "list"
                           ? "bg-card text-foreground shadow-sm"
                           : "text-muted-foreground hover:text-foreground"
                     }`}
                  >
                     <List className="size-3.5" /> Lista
                  </button>
               </div>
               <Button size="sm" className="w-full text-xs sm:w-auto" onClick={onCreateClass}>
                  <Plus className="mr-1.5 size-3.5" /> Nueva clase
               </Button>
               <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:w-auto"
                  onClick={onOpenSchedule}
               >
                  Configurar cursada
               </Button>
            </div>
         </div>

         <div className="mb-4 flex flex-wrap items-center gap-2">
            {view === "calendar" && (
               <>
                  <h2 className="text-sm font-semibold text-foreground sm:hidden">
                     {monthName} {year}
                  </h2>
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                     <Button variant="outline" size="icon" className="size-8" onClick={onPreviousMonth}>
                        <ChevronLeft className="size-4" />
                     </Button>
                     <h2 className="min-w-[170px] px-2 text-center text-sm font-semibold text-foreground">
                        {monthName} {year}
                     </h2>
                     <Button variant="outline" size="icon" className="size-8" onClick={onNextMonth}>
                        <ChevronRight className="size-4" />
                     </Button>
                  </div>
               </>
            )}

            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}>
               <SelectTrigger className="h-8 w-full text-xs sm:w-[170px]">
                  <SelectValue placeholder="Estado" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="planificada">Planificada</SelectItem>
                  <SelectItem value="sin_planificar">Sin planificar</SelectItem>
                  <SelectItem value="dictada">Dictada</SelectItem>
               </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => onTypeFilterChange(value as TypeFilter)}>
               <SelectTrigger className="h-8 w-full text-xs sm:w-[190px]">
                  <SelectValue placeholder="Tipo" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {planningTypeFilterOptions.map((option) => (
                     <SelectItem key={option.value} value={option.value}>
                        {option.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>

            <span className="ml-auto w-full text-right text-xs text-muted-foreground sm:w-auto">
               {visibleClassesCount} clases
            </span>
         </div>
      </div>
   );
}

