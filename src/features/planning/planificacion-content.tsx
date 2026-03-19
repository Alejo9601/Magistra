import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { getAssignmentIdBySubjectId } from "@/lib/edu-repository";
import { useAssessmentsContext, type AssessmentType } from "@/features/assessments";
import { useActivitiesContext } from "@/features/activities";
import { useInstitutionContext } from "@/features/institution";
import { usePlanningContext } from "@/features/planning";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlanificacionToolbar } from "@/features/planning/components/planificacion-toolbar";
import { PlanningCalendarView } from "@/features/planning/components/planning-calendar-view";
import { PlanningClassesList } from "@/features/planning/components/planning-classes-list";
import { PlanningModals } from "@/features/planning/components/planning-modals";
import { classTypeLabels, monthNames } from "@/features/planning/constants";
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

   const openEditModal = (id: string, options?: { allowPlanned?: boolean }) => {
      const targetClass = classes.find((classSession) => classSession.id === id);
      if (!targetClass) {
         toast.error("No se encontro la clase seleccionada.");
         return;
      }
      if (targetClass.status === "planificada" && !options?.allowPlanned) {
         toast.info("Clase planificada bloqueada. Usa Replanificar para editar.");
         return;
      }
      setEditingClassId(id);
      setPrefillDate(undefined);
      setModalOpen(true);
   };
   const openEditModalFromDayDetails = (id: string) => {
      setSelectedDayDate(null);
      openEditModal(id);
   };

   const replanClass = (id: string, options?: { fromDayDetails?: boolean }) => {
      const targetClass = classes.find((classSession) => classSession.id === id);
      if (!targetClass) {
         toast.error("No se encontro la clase seleccionada.");
         return;
      }
      if (targetClass.status !== "planificada") {
         openEditModal(id, { allowPlanned: true });
         return;
      }
      updateClass(id, { status: "sin-planificar" });
      if (options?.fromDayDetails) {
         setSelectedDayDate(null);
      }
      toast.success("Clase replanificada. Ya puedes editarla y volver a publicarla.");
      openEditModal(id, { allowPlanned: true });
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
         <PlanificacionToolbar
            view={view}
            onViewChange={setView}
            onCreateClass={() => openCreateModal()}
            onOpenSchedule={() => setScheduleModalOpen(true)}
            monthName={monthNames[month]}
            year={year}
            onPreviousMonth={() => goToAdjacentMonth(-1)}
            onNextMonth={() => goToAdjacentMonth(1)}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            classTypeLabels={classTypeLabels}
            visibleClassesCount={visibleClassesCount}
         />

         <div className="flex-1 min-h-0">
            {view === "calendar" ? (
               <PlanningCalendarView
                  isMobile={isMobile}
                  startDayOfWeek={startDayOfWeek}
                  monthDays={monthDays}
                  weeks={weeks}
                  year={year}
                  month={month}
                  filteredClasses={filteredClasses}
                  todayStr={todayStr}
                  onTouchStart={handleCalendarTouchStart}
                  onTouchEnd={handleCalendarTouchEnd}
                  onOpenDayDetails={setSelectedDayDate}
                  onCreateClass={openCreateModal}
                  onEditClass={openEditModal}
               />
            ) : (
               <PlanningClassesList
                  classes={listClasses}
                  isMobile={isMobile}
                  monthsStateStorageKey={monthsStateStorageKey}
                  onClearFilters={() => {
                     setStatusFilter("all");
                     setTypeFilter("all");
                  }}
                  onCreateClass={() => openCreateModal()}
                  onOpenEdit={openEditModal}
                  onReplan={(id) => replanClass(id)}
                  onDuplicate={onDuplicate}
               />
            )}
         </div>

         <PlanningModals
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            activeInstitution={activeInstitution}
            editingClass={editingClass}
            prefillDate={prefillDate}
            onSave={onSave}
            scheduleModalOpen={scheduleModalOpen}
            setScheduleModalOpen={setScheduleModalOpen}
            onSchedule={(payload) => createRecurringClasses(payload)}
            selectedDayDate={selectedDayDate}
            selectedDayClasses={selectedDayClasses}
            onCloseDayDetails={() => setSelectedDayDate(null)}
            onEditFromDayDetails={openEditModalFromDayDetails}
            onReplanFromDayDetails={(id) => replanClass(id, { fromDayDetails: true })}
            onDuplicate={onDuplicate}
         />
      </div>
   );
}





















