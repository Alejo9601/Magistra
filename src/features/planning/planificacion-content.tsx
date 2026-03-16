import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import {
   ChevronLeft,
   ChevronRight,
   List,
   CalendarDays,
   Plus,
   Edit3,
   Eye,
   Copy,
   ClipboardCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import {
   getAssignmentById,
   getAssignmentIdBySubjectId,
   getSubjectById,
   getInstitutionById,
} from "@/lib/edu-repository";
import { useAssessmentsContext, type AssessmentType } from "@/features/assessments";
import { useActivitiesContext } from "@/features/activities";
import { useInstitutionContext } from "@/features/institution";
import { usePlanningContext } from "@/features/planning";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClassEditorModal } from "@/features/planning/class-editor-modal";
import { ClassScheduleModal } from "@/features/planning/class-schedule-modal";
import { MonthlyClassesCollapsibleTable } from "@/components/monthly-classes-collapsible-table";
import {
   classTypeColors,
   classTypeLabels,
   getStatusColor,
   getStatusLabel,
   monthNames,
} from "@/features/planning/constants";
import type {
   ClassFormInput,
   StatusFilter,
   TypeFilter,
   ViewMode,
} from "@/features/planning/types";
import type { ClassSession, ClassStatus, EvaluativeFormat } from "@/types";


const evaluativeFormatLabelMap: Record<EvaluativeFormat, string> = {
   oral: "Oral",
   escrito: "Escrito",
   "actividad-practica": "Actividad Practica",
   otro: "Otro",
   "exposicion-oral": "Oral",
   "examen-escrito": "Escrito",
   "examen-oral": "Oral",
   "trabajo-practico-evaluativo": "Actividad Practica",
};

function mapClassStatusToAssessmentStatus(status: ClassStatus) {
   if (status === "finalizada") {
      return "graded" as const;
   }
   if (status === "planificada") {
      return "scheduled" as const;
   }
   return "draft" as const;
}

export function PlanificacionContent() {
   const { activeInstitution } = useInstitutionContext();
   const {
      classes,
      createClass,
      createRecurringClasses,
      updateClass,
      duplicateClass,
   } = usePlanningContext();
   const { getAssessmentsByAssignment, addAssessment, updateAssessment } =
      useAssessmentsContext();
   const { getActivitiesByAssignment, addActivity, updateActivity } =
      useActivitiesContext();
   const isMobile = useIsMobile();
   const [searchParams] = useSearchParams();
   const today = new Date();
   const swipeStartXRef = useRef<number | null>(null);

   const [view, setView] = useState<ViewMode>("calendar");
   const [month, setMonth] = useState(today.getMonth());
   const [year, setYear] = useState(today.getFullYear());
   const initialStatusFilter =
      searchParams.get("status") === "planificada" ||
      searchParams.get("status") === "sin-planificar" ||
      searchParams.get("status") === "finalizada"
         ? (searchParams.get("status") as StatusFilter)
         : "all";
   const [statusFilter, setStatusFilter] =
      useState<StatusFilter>(initialStatusFilter);
   const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
   const [modalOpen, setModalOpen] = useState(false);
   const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
   const [editingClassId, setEditingClassId] = useState<string | null>(null);
   const [prefillDate, setPrefillDate] = useState<string | undefined>(
      undefined,
   );
   const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
   const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
   const planningPrefsStorageKey = useMemo(
      () => `aula.planning.list.preferences.${activeInstitution}`,
      [activeInstitution],
   );
   const monthsStateStorageKey = useMemo(
      () => `aula.planning.list.months.${activeInstitution}`,
      [activeInstitution],
   );

   const scopedClasses = classes.filter(
      (classSession) => classSession.institutionId === activeInstitution,
   );

   const filteredClasses = scopedClasses.filter((classSession) => {
      const statusMatches =
         statusFilter === "all" || classSession.status === statusFilter;
      const typeMatches =
         typeFilter === "all" || classSession.type === typeFilter;
      return statusMatches && typeMatches;
   });

   const editingClass = editingClassId
      ? (classes.find((classSession) => classSession.id === editingClassId) ??
        null)
      : null;

   const listClasses = [...filteredClasses].sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
   );
   const visibleClassesCount = filteredClasses.length;
   const selectedDayClasses = selectedDayDate
      ? filteredClasses
           .filter((classSession) => classSession.date === selectedDayDate)
           .sort((a, b) => a.time.localeCompare(b.time))
      : [];

   const firstDay = new Date(year, month, 1);
   const lastDay = new Date(year, month + 1, 0);
   const startDayOfWeek = (firstDay.getDay() + 6) % 7;
   const daysInMonth = lastDay.getDate();
   const weeks: (number | null)[][] = [];
   let currentWeek: (number | null)[] = Array(startDayOfWeek).fill(null);
   for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
         weeks.push(currentWeek);
         currentWeek = [];
      }
   }
   if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
   }
   const monthDays = Array.from({ length: daysInMonth }, (_, idx) => {
      const day = idx + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayClasses = filteredClasses
         .filter((classSession) => classSession.date === dateStr)
         .sort((a, b) => a.time.localeCompare(b.time));
      return {
         day,
         dateStr,
         dayClasses,
         isPastDate: dateStr < todayStr,
      };
   });

   const goToAdjacentMonth = (delta: -1 | 1) => {
      setMonth((currentMonth) => {
         if (delta === -1 && currentMonth === 0) {
            setYear((currentYear) => currentYear - 1);
            return 11;
         }
         if (delta === 1 && currentMonth === 11) {
            setYear((currentYear) => currentYear + 1);
            return 0;
         }
         return currentMonth + delta;
      });
   };

   const handleCalendarTouchStart = (event: TouchEvent<HTMLDivElement>) => {
      swipeStartXRef.current = event.touches[0]?.clientX ?? null;
   };

   const handleCalendarTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
      const startX = swipeStartXRef.current;
      swipeStartXRef.current = null;
      if (startX === null) {
         return;
      }
      const endX = event.changedTouches[0]?.clientX;
      if (typeof endX !== "number") {
         return;
      }
      const deltaX = endX - startX;
      if (Math.abs(deltaX) < 40) {
         return;
      }
      goToAdjacentMonth(deltaX > 0 ? -1 : 1);
   };

   const openCreateModal = (date?: string) => {
      setEditingClassId(null);
      setPrefillDate(date);
      setModalOpen(true);
   };

   const openEditModal = (id: string) => {
      setEditingClassId(id);
      setPrefillDate(undefined);
      setModalOpen(true);
   };
   const openEditModalFromDayDetails = (id: string) => {
      setSelectedDayDate(null);
      openEditModal(id);
   };

   const onDuplicate = (id: string) => {
      const source = classes.find((classSession) => classSession.id === id);
      const duplicated = duplicateClass(id);
      if (!duplicated) {
         toast.error("No se pudo duplicar la clase.");
         return;
      }
      toast.success(
         source
            ? `Clase duplicada: ${source.date} -> ${duplicated.date}`
            : "Clase duplicada para la semana siguiente.",
      );
   };

   const onSave = (payload: ClassFormInput, mode: "draft" | "publish") => {
      const savedClass = editingClass
         ? ({ ...editingClass, ...payload } as ClassSession)
         : createClass(payload);

      if (editingClass) {
         updateClass(editingClass.id, payload);
      }

      const effectiveClassId = editingClass?.id ?? savedClass.id;
      const effectiveAssignmentId =
         payload.assignmentId ??
         savedClass.assignmentId ??
         getAssignmentIdBySubjectId(savedClass.subjectId);

      if (
         payload.type === "evaluacion" &&
         payload.evaluativeFormat &&
         effectiveAssignmentId
      ) {
         const isPracticalEvaluation =
            payload.evaluativeFormat === "actividad-practica" ||
            payload.evaluativeFormat === "trabajo-practico-evaluativo";
         const assessmentType: AssessmentType = isPracticalEvaluation
            ? "practice_work"
            : "exam";
         const assessmentBaseName = payload.evaluationName?.trim() || payload.topic;
         const assessmentTitle = `${evaluativeFormatLabelMap[payload.evaluativeFormat]}: ${assessmentBaseName}`;

         const existingAssessment = getAssessmentsByAssignment(
            effectiveAssignmentId,
         ).find((assessment) => assessment.linkedClassId === effectiveClassId);

         if (existingAssessment) {
            updateAssessment(existingAssessment.id, {
               assignmentId: effectiveAssignmentId,
               title: assessmentTitle,
               date: payload.date,
               type: assessmentType,
               status: mapClassStatusToAssessmentStatus(payload.status),
            });
         } else {
            addAssessment({
               assignmentId: effectiveAssignmentId,
               linkedClassId: effectiveClassId,
               title: assessmentTitle,
               date: payload.date,
               type: assessmentType,
               status: mapClassStatusToAssessmentStatus(payload.status),
               weight: 1,
               maxScore: 10,
            });
         }

         if (isPracticalEvaluation) {
            const tpActivityTitle = payload.evaluationName?.trim() || `Actividad practica evaluativa: ${payload.topic}`;
            const existingActivity = getActivitiesByAssignment(
               effectiveAssignmentId,
            ).find((activity) => activity.linkedClassIds.includes(effectiveClassId));

            if (existingActivity) {
               updateActivity(existingActivity.id, {
                  assignmentId: effectiveAssignmentId,
                  title: tpActivityTitle,
                  type: "classwork",
                  status:
                     payload.status === "finalizada"
                        ? "completed"
                        : payload.status === "planificada"
                           ? "assigned"
                           : "planned",
                  linkedClassIds: Array.from(
                     new Set([
                        ...existingActivity.linkedClassIds,
                        effectiveClassId,
                     ]),
                  ),
               });
            } else {
               addActivity({
                  assignmentId: effectiveAssignmentId,
                  title: tpActivityTitle,
                  type: "classwork",
                  status:
                     payload.status === "finalizada"
                        ? "completed"
                        : payload.status === "planificada"
                           ? "assigned"
                           : "planned",
                  linkedClassIds: [effectiveClassId],
               });
            }
         }
      }

      toast.success(
         mode === "publish"
            ? editingClass
               ? "Clase actualizada y publicada."
               : "Clase creada y publicada."
            : editingClass
               ? "Clase actualizada como borrador."
               : "Clase guardada como borrador.",
      );
   };

   useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }
      try {
         const raw = window.localStorage.getItem(planningPrefsStorageKey);
         if (!raw) {
            return;
         }
         const parsed = JSON.parse(raw) as {
            statusFilter?: StatusFilter;
            typeFilter?: TypeFilter;
            view?: ViewMode;
         };
         if (parsed.statusFilter) {
            setStatusFilter(parsed.statusFilter);
         }
         if (parsed.typeFilter) {
            setTypeFilter(parsed.typeFilter);
         }
         if (parsed.view) {
            setView(parsed.view);
         }
      } catch {
         // ignore invalid persisted values
      }
   }, [planningPrefsStorageKey]);

   useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }
      window.localStorage.setItem(
         planningPrefsStorageKey,
         JSON.stringify({
            statusFilter,
            typeFilter,
            view,
         }),
      );
   }, [planningPrefsStorageKey, statusFilter, typeFilter, view]);

   return (
      <div className="flex h-full min-h-0 max-h-full w-full flex-col overflow-hidden p-3 sm:p-6">
         <div className="-mx-3 mb-4 border-b border-border/70 bg-background/95 px-3 pb-3 sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pt-1">
               <div>
                  <h1 className="text-xl font-bold text-foreground">
                     Planificacion
                  </h1>
                  <p className="text-sm text-muted-foreground">
                     Organiza, edita y publica tus clases por institucion.
                  </p>
               </div>
               <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <div className="flex items-center rounded-lg bg-muted p-0.5">
                     <button
                        onClick={() => setView("calendar")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                     >
                        <CalendarDays className="size-3.5" /> Mensual
                     </button>
                     <button
                        onClick={() => setView("list")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                     >
                        <List className="size-3.5" /> Lista
                     </button>
                  </div>
                  <Button
                     size="sm"
                     className="text-xs w-full sm:w-auto"
                     onClick={() => openCreateModal()}
                  >
                     <Plus className="size-3.5 mr-1.5" /> Nueva clase
                  </Button>
                  <Button
                     variant="outline"
                     size="sm"
                     className="text-xs w-full sm:w-auto"
                     onClick={() => setScheduleModalOpen(true)}
                  >
                     Configurar cursada
                  </Button>
               </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
               {view === "calendar" && (
                  <>
                     <h2 className="text-sm font-semibold text-foreground sm:hidden">
                        {monthNames[month]} {year}
                     </h2>
                     <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        <Button
                           variant="outline"
                           size="icon"
                           className="size-8"
                           onClick={() => goToAdjacentMonth(-1)}
                        >
                           <ChevronLeft className="size-4" />
                        </Button>
                        <h2 className="min-w-[170px] px-2 text-center text-sm font-semibold text-foreground">
                           {monthNames[month]} {year}
                        </h2>
                        <Button
                           variant="outline"
                           size="icon"
                           className="size-8"
                           onClick={() => goToAdjacentMonth(1)}
                        >
                           <ChevronRight className="size-4" />
                        </Button>
                     </div>
                  </>
               )}

               <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                     setStatusFilter(value as StatusFilter)
                  }
               >
                  <SelectTrigger className="h-8 w-full text-xs sm:w-[170px]">
                     <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todos los estados</SelectItem>
                     <SelectItem value="planificada">Planificada</SelectItem>
                     <SelectItem value="sin-planificar">
                        Sin planificar
                     </SelectItem>
                     <SelectItem value="finalizada">Finalizada</SelectItem>
                  </SelectContent>
               </Select>

               <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as TypeFilter)}
               >
                  <SelectTrigger className="h-8 w-full text-xs sm:w-[170px]">
                     <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todos los tipos</SelectItem>
                     {Object.entries(classTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                           {label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>

               <span className="ml-auto w-full text-right text-xs text-muted-foreground sm:w-auto">
                  {visibleClassesCount} clases
               </span>
            </div>
         </div>

         <div className="flex-1 min-h-0">
            {view === "calendar" ? (
               <Card className="w-full">
                  <CardContent className="overflow-x-auto p-0">
                     {isMobile ? (
                        <div className="p-1.5" onTouchStart={handleCalendarTouchStart} onTouchEnd={handleCalendarTouchEnd}>
                           <div className="mb-1 grid grid-cols-7 gap-1">
                              {["L", "M", "X", "J", "V", "S", "D"].map(
                                 (day) => (
                                    <div
                                       key={day}
                                       className="py-1 text-center text-[10px] font-semibold text-muted-foreground"
                                    >
                                       {day}
                                    </div>
                                 ),
                              )}
                           </div>
                           <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: startDayOfWeek }).map(
                                 (_, idx) => (
                                    <div
                                       key={`mobile-empty-${idx}`}
                                       className="aspect-square rounded-md bg-muted/10"
                                    />
                                 ),
                              )}
                              {monthDays.map(
                                 ({ day, dateStr, dayClasses, isPastDate }) => {
                                    const hasClasses = dayClasses.length > 0;
                                    return (
                                       <button
                                          key={dateStr}
                                          type="button"
                                          onClick={() => {
                                             if (hasClasses) {
                                                setSelectedDayDate(dateStr);
                                                return;
                                             }
                                             if (!isPastDate) {
                                                openCreateModal(dateStr);
                                             }
                                          }}
                                          className={`aspect-square rounded-md border p-1 text-left transition-colors ${
                                             isPastDate
                                                ? "border-border/60 bg-muted/45"
                                                : "border-border/70 bg-card hover:bg-muted/40"
                                          }`}
                                          title={
                                             hasClasses
                                                ? "Ver clases del dia"
                                                : isPastDate
                                                  ? "Fecha pasada"
                                                  : "Nueva clase"
                                          }
                                       >
                                          <p
                                             className={`text-[11px] font-semibold ${isPastDate ? "text-foreground/70" : "text-foreground"}`}
                                          >
                                             {day}
                                          </p>
                                          <div className="mt-1 flex flex-wrap gap-0.5">
                                             {dayClasses
                                                .slice(0, 3)
                                                .map((cls) => {
                                                   const inst =
                                                      getInstitutionById(
                                                         cls.institutionId,
                                                      );
                                                   return (
                                                      <span
                                                         key={cls.id}
                                                         className="size-1.5 rounded-full"
                                                         style={{
                                                            backgroundColor:
                                                               inst?.color ??
                                                               "#4F46E5",
                                                         }}
                                                      />
                                                   );
                                                })}
                                             {dayClasses.length > 3 && (
                                                <span className="text-[9px] leading-none text-primary">
                                                   +{dayClasses.length - 3}
                                                </span>
                                             )}
                                          </div>
                                       </button>
                                    );
                                 },
                              )}
                           </div>
                        </div>
                     ) : (
                        <div className="grid grid-cols-7">
                           {[
                              "Lun",
                              "Mar",
                              "Mie",
                              "Jue",
                              "Vie",
                              "Sab",
                              "Dom",
                           ].map((day) => (
                              <div
                                 key={day}
                                 className="border-b border-r border-border last:border-r-0 p-2 text-center"
                              >
                                 <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    {day}
                                 </span>
                              </div>
                           ))}
                           {weeks.flat().map((day, idx) => {
                              const dateStr = day
                                 ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                                 : "";
                              const dayClasses = day
                                 ? filteredClasses.filter(
                                      (classSession) =>
                                         classSession.date === dateStr,
                                   )
                                 : [];
                              const isPastDate = Boolean(
                                 day && dateStr < todayStr,
                              );
                              return (
                                 <div
                                    key={idx}
                                    className={`min-h-[92px] border-b border-r border-border last:border-r-0 p-1.5 ${day ? (isPastDate ? "bg-muted/55 ring-1 ring-inset ring-border/70" : "hover:bg-muted/30") : "bg-muted/10"}`}
                                 >
                                    {day && (
                                       <>
                                          <div className="flex items-center justify-between gap-1">
                                             <span
                                                className={`text-xs font-medium ${isPastDate ? "text-foreground/75" : "text-foreground"}`}
                                             >
                                                {day}
                                             </span>
                                             <button
                                                onClick={() => {
                                                   if (isPastDate) return;
                                                   openCreateModal(dateStr);
                                                }}
                                                disabled={isPastDate}
                                                className={`size-5 inline-flex items-center justify-center rounded ${isPastDate ? "bg-muted/70 text-muted-foreground/70 cursor-not-allowed" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"}`}
                                                title={
                                                   isPastDate
                                                      ? "No se pueden crear clases en fechas pasadas"
                                                      : "Nueva clase"
                                                }
                                             >
                                                <Plus className="size-3" />
                                             </button>
                                          </div>
                                          <div className="mt-1 flex flex-col gap-0.5">
                                             {dayClasses
                                                .slice(0, 3)
                                                .map((cls) => {
                                                   const inst =
                                                      getInstitutionById(
                                                         cls.institutionId,
                                                      );
                                                   const subject =
                                                      getSubjectById(
                                                         cls.subjectId,
                                                      );
                                                   return (
                                                      <button
                                                         key={cls.id}
                                                         onClick={() =>
                                                            openEditModal(
                                                               cls.id,
                                                            )
                                                         }
                                                         className={`w-full cursor-pointer text-left rounded px-1 py-0.5 text-[10px] font-medium truncate ${isPastDate ? "opacity-85" : ""}`}
                                                         style={{
                                                            backgroundColor:
                                                               (inst?.color ??
                                                                  "#4F46E5") +
                                                               "15",
                                                            color:
                                                               inst?.color ??
                                                               "#4F46E5",
                                                         }}
                                                      >
                                                         {subject?.name}
                                                      </button>
                                                   );
                                                })}
                                             {dayClasses.length > 3 && (
                                                <button
                                                   type="button"
                                                   onClick={() =>
                                                      setSelectedDayDate(
                                                         dateStr,
                                                      )
                                                   }
                                                   className="text-[9px] text-primary px-1 text-left hover:underline"
                                                >
                                                   +{dayClasses.length - 3} mas
                                                </button>
                                             )}
                                          </div>
                                       </>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </CardContent>
               </Card>
            ) : (
               <div className="h-full overflow-auto">
                  <MonthlyClassesCollapsibleTable
                     classes={listClasses}
                     emptyMessage="No hay clases para los filtros seleccionados."
                     emptyAction={
                        <div className="flex flex-wrap items-center justify-center gap-2">
                           <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                 setStatusFilter("all");
                                 setTypeFilter("all");
                              }}
                           >
                              Limpiar filtros
                           </Button>
                           <Button
                              type="button"
                              size="sm"
                              className="text-xs"
                              onClick={() => openCreateModal()}
                           >
                              Nueva clase
                           </Button>
                        </div>
                     }
                     tableClassName="min-w-[860px]"
                     defaultOpen={false}
                     persistKey={monthsStateStorageKey}
                     showBulkActions
                     isMobile={isMobile}
                     renderMonthMeta={(monthClasses) => {
                        const total = monthClasses.length;
                        const pending = monthClasses.filter(
                           (item) => item.status === "sin-planificar",
                        ).length;
                        const completed = monthClasses.filter(
                           (item) => item.status === "finalizada",
                        ).length;
                        const pendingPct =
                           total > 0 ? Math.round((pending / total) * 100) : 0;
                        const completedPct =
                           total > 0
                              ? Math.round((completed / total) * 100)
                              : 0;

                        return (
                           <>
                              <Badge
                                 variant="outline"
                                 className="text-[10px] border-0 status-warning"
                              >
                                 Sin plan {pendingPct}%
                              </Badge>
                              <Badge
                                 variant="outline"
                                 className="text-[10px] border-0 status-ok"
                              >
                                 Finalizadas {completedPct}%
                              </Badge>
                           </>
                        );
                     }}
                     renderMobileItem={(cls) => {
                        const subject = getSubjectById(cls.subjectId);
                        const assignment = cls.assignmentId
                           ? getAssignmentById(cls.assignmentId)
                           : null;
                        const inst = getInstitutionById(cls.institutionId);
                        const dateObj = new Date(cls.date + "T12:00:00");

                        return (
                           <div className="rounded-md border border-border/70 bg-card px-2.5 py-2">
                              <div className="flex items-start justify-between gap-2">
                                 <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-foreground">
                                       {subject?.name}
                                    </p>
                                    <p className="truncate text-[10px] text-muted-foreground">
                                       {inst?.name} -{" "}
                                       {assignment?.section ?? subject?.course}
                                    </p>
                                    <p className="mt-1 text-[10px] text-foreground">
                                       {dateObj.toLocaleDateString("es-AR", {
                                          day: "2-digit",
                                          month: "short",
                                       })}{" "}
                                       - {cls.time}
                                    </p>
                                 </div>
                                 <div className="flex flex-col items-end gap-1">
                                    <Badge
                                       variant="outline"
                                       className={`border-0 text-[10px] ${classTypeColors[cls.type]}`}
                                    >
                                       {classTypeLabels[cls.type]}
                                    </Badge>
                                    <Badge
                                       variant="outline"
                                       className={`border-0 text-[10px] ${getStatusColor(cls.status)}`}
                                    >
                                       {getStatusLabel(cls.status)}
                                    </Badge>
                                 </div>
                              </div>
                              <p className="mt-1.5 truncate text-[10px] text-muted-foreground">
                                 {cls.topic}
                              </p>
                              <div className="mt-2 flex items-center gap-1">
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    asChild
                                    title="Ver detalle de clase"
                                 >
                                    <Link to={`/clase/${cls.id}`}>
                                       <Eye className="size-3.5" />
                                    </Link>
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    asChild
                                    title="Abrir dictado"
                                 >
                                    <Link to={`/clase/${cls.id}/dictado`}>
                                       <ClipboardCheck className="size-3.5" />
                                    </Link>
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    title="Editar clase"
                                    onClick={() => openEditModal(cls.id)}
                                 >
                                    <Edit3 className="size-3.5" />
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    title="Duplicar clase"
                                    onClick={() => onDuplicate(cls.id)}
                                 >
                                    <Copy className="size-3.5" />
                                 </Button>
                              </div>
                           </div>
                        );
                     }}
                     columns={[
                        { label: "Fecha", className: "text-xs" },
                        { label: "Materia", className: "text-xs" },
                        { label: "Institucion", className: "text-xs" },
                        { label: "Curso", className: "text-xs" },
                        { label: "Tema", className: "text-xs" },
                        { label: "Tipo", className: "text-xs" },
                        { label: "Estado", className: "text-xs" },
                        { label: "Acciones", className: "text-xs text-right" },
                     ]}
                     renderCells={(cls) => {
                        const subject = getSubjectById(cls.subjectId);
                        const assignment = cls.assignmentId
                           ? getAssignmentById(cls.assignmentId)
                           : null;
                        const inst = getInstitutionById(cls.institutionId);
                        const dateObj = new Date(cls.date + "T12:00:00");

                        return (
                           <>
                              <TableCell className="whitespace-nowrap">
                                 <div className="text-xs font-semibold text-foreground">
                                    {dateObj.toLocaleDateString("es-AR", {
                                       day: "2-digit",
                                       month: "short",
                                    })}
                                 </div>
                                 <div className="text-[10px] text-muted-foreground">
                                    {cls.time} hs
                                 </div>
                              </TableCell>
                              <TableCell className="text-xs font-medium">
                                 {subject?.name}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                 {inst?.name}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                 {assignment?.section ?? subject?.course}
                              </TableCell>
                              <TableCell className="text-xs max-w-[190px] truncate">
                                 {cls.topic}
                              </TableCell>
                              <TableCell>
                                 <Badge
                                    variant="outline"
                                    className={`border-0 text-[10px] ${classTypeColors[cls.type]}`}
                                 >
                                    {classTypeLabels[cls.type]}
                                 </Badge>
                              </TableCell>
                              <TableCell>
                                 <Badge
                                    variant="outline"
                                    className={`border-0 text-[10px] ${getStatusColor(cls.status)}`}
                                 >
                                    {getStatusLabel(cls.status)}
                                 </Badge>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center justify-end gap-1">
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="size-7"
                                       asChild
                                       title="Ver detalle de clase"
                                    >
                                       <Link to={`/clase/${cls.id}`}>
                                          <Eye className="size-3.5" />
                                       </Link>
                                    </Button>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="size-7"
                                       asChild
                                       title="Abrir dictado"
                                    >
                                       <Link to={`/clase/${cls.id}/dictado`}>
                                          <ClipboardCheck className="size-3.5" />
                                       </Link>
                                    </Button>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="size-7"
                                       title="Editar clase"
                                       onClick={() => openEditModal(cls.id)}
                                    >
                                       <Edit3 className="size-3.5" />
                                    </Button>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="size-7"
                                       title="Duplicar clase"
                                       onClick={() => onDuplicate(cls.id)}
                                    >
                                       <Copy className="size-3.5" />
                                    </Button>
                                 </div>
                              </TableCell>
                           </>
                        );
                     }}
                  />
               </div>
            )}
         </div>

         <ClassEditorModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            activeInstitution={activeInstitution}
            initialClass={editingClass}
            initialDate={prefillDate}
            onSubmit={onSave}
         />

         <ClassScheduleModal
            open={scheduleModalOpen}
            onOpenChange={setScheduleModalOpen}
            activeInstitution={activeInstitution}
            onSchedule={(payload) => createRecurringClasses(payload)}
         />

         <Dialog
            open={Boolean(selectedDayDate)}
            onOpenChange={(open) => {
               if (!open) {
                  setSelectedDayDate(null);
               }
            }}
         >
            <DialogContent className="sm:max-w-[640px]">
               <DialogHeader>
                  <DialogTitle>Clases del dia</DialogTitle>
                  <DialogDescription>
                     {selectedDayDate ?? "Selecciona un dia del calendario"}
                  </DialogDescription>
               </DialogHeader>

               {selectedDayClasses.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">
                     No hay clases para este dia con los filtros actuales.
                  </p>
               ) : (
                  <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2">
                     {selectedDayClasses.map((cls) => {
                        const subject = getSubjectById(cls.subjectId);
                        const assignment = cls.assignmentId
                           ? getAssignmentById(cls.assignmentId)
                           : null;
                        const inst = getInstitutionById(cls.institutionId);
                        return (
                           <div
                              key={cls.id}
                              className="rounded-lg border border-border/70 p-3"
                           >
                              <div className="flex items-start justify-between gap-2">
                                 <div>
                                    <p className="text-sm font-semibold text-foreground">
                                       {subject?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                       {inst?.name} -{" "}
                                       {assignment?.section ?? subject?.course}{" "}
                                       - {cls.time} hs
                                    </p>
                                 </div>
                                 <Badge
                                    className={`border-0 text-[10px] ${getStatusColor(cls.status)}`}
                                 >
                                    {getStatusLabel(cls.status)}
                                 </Badge>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                 <Badge
                                    className={`border-0 text-[10px] ${classTypeColors[cls.type]}`}
                                 >
                                    {classTypeLabels[cls.type]}
                                 </Badge>
                                 <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                 >
                                    {cls.topic}
                                 </Badge>
                              </div>
                              <div className="mt-3 flex items-center gap-1">
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    asChild
                                 >
                                    <Link to={`/clase/${cls.id}`}>
                                       <Eye className="size-3.5" />
                                    </Link>
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    asChild
                                 >
                                    <Link to={`/clase/${cls.id}/dictado`}>
                                       <ClipboardCheck className="size-3.5" />
                                    </Link>
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() =>
                                       openEditModalFromDayDetails(cls.id)
                                    }
                                 >
                                    <Edit3 className="size-3.5" />
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => onDuplicate(cls.id)}
                                 >
                                    <Copy className="size-3.5" />
                                 </Button>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
}



