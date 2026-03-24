import { useEffect, useMemo, useState } from "react";
import { getAssignmentIdBySubjectId } from "@/lib/edu-repository";
import { useAssessmentsContext } from "@/features/assessments";
import { useActivitiesContext } from "@/features/activities";
import { matchesInstitutionScope, useInstitutionContext } from "@/features/institution";
import { usePlanningContext } from "@/features/planning";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlanningCalendarNavigation } from "@/features/planning/hooks";
import { PlanificacionToolbar } from "@/features/planning/components/planificacion-toolbar";
import { PlanningCalendarView } from "@/features/planning/components/planning-calendar-view";
import { PlanningClassesList } from "@/features/planning/components/planning-classes-list";
import { PlanningModals } from "@/features/planning/components/planning-modals";
import { monthNames } from "@/features/planning/utils/constants";
import { syncClassLinkedRecords } from "@/features/planning/utils/sync-class-linked-records";
import type {
   ClassFormInput,
   StatusFilter,
   TypeFilter,
   ViewMode,
} from "@/features/planning/types";
import type { ClassSession } from "@/types";

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
   const { activities, getActivitiesByAssignment, addActivity, updateActivity } =
      useActivitiesContext();
   const isMobile = useIsMobile();
   const [searchParams] = useSearchParams();
   const entryClassId = searchParams.get("classId");
   const today = new Date();

   const [view, setView] = useState<ViewMode>("calendar");
   const {
      month,
      year,
      goToAdjacentMonth,
      handleCalendarTouchStart,
      handleCalendarTouchEnd,
   } = usePlanningCalendarNavigation(today);
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
   const [classDetailOpen, setClassDetailOpen] = useState(false);
   const [detailClassId, setDetailClassId] = useState<string | null>(null);
   const [duplicateCandidateId, setDuplicateCandidateId] = useState<string | null>(null);
   const [hasHandledEntryClass, setHasHandledEntryClass] = useState(false);
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
      (classSession) =>
      matchesInstitutionScope(classSession.institutionId, activeInstitution),
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

   const duplicateSourceClass = duplicateCandidateId
      ? classes.find((classSession) => classSession.id === duplicateCandidateId) ?? null
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

   const openCreateModal = (date?: string) => {
      setEditingClassId(null);
      setPrefillDate(date);
      setModalOpen(true);
   };

   const openClassDetail = (id: string) => {
      setDetailClassId(id);
      setClassDetailOpen(true);
   };

   const closeClassDetail = () => {
      setClassDetailOpen(false);
      setDetailClassId(null);
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

   useEffect(() => {
      if (hasHandledEntryClass || !entryClassId) {
         return;
      }

      const exists = classes.some((classSession) => classSession.id === entryClassId);
      if (!exists) {
         return;
      }

      setHasHandledEntryClass(true);
      openClassDetail(entryClassId);
   }, [classes, entryClassId, hasHandledEntryClass]);

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

   const requestDuplicate = (id: string) => {
      setDuplicateCandidateId(id);
   };

   const closeDuplicateDialog = () => {
      setDuplicateCandidateId(null);
   };

   const confirmDuplicate = () => {
      if (!duplicateCandidateId) {
         return;
      }
      const source = classes.find((classSession) => classSession.id === duplicateCandidateId);
      const duplicated = duplicateClass(duplicateCandidateId);
      if (!duplicated) {
         toast.error("No se pudo duplicar la clase.");
         closeDuplicateDialog();
         return;
      }
      toast.success(
         source
            ? `Clase duplicada: ${source.date} -> ${duplicated.date}`
            : "Clase duplicada para la semana siguiente.",
      );
      closeDuplicateDialog();
   };

   const handleEditFromClassDetail = (id: string) => {
      closeClassDetail();
      openEditModal(id, { allowPlanned: true });
   };

   const handleReplanFromClassDetail = (id: string) => {
      closeClassDetail();
      replanClass(id);
   };

   const handleDuplicateFromClassDetail = (id: string) => {
      requestDuplicate(id);
   };

   const onSave = (
      payload: ClassFormInput,
      mode: "draft" | "publish",
      options?: { linkedActivityId?: string },
   ) => {
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

      syncClassLinkedRecords({
         payload,
         effectiveClassId,
         effectiveAssignmentId,
         getAssessmentsByAssignment,
         addAssessment,
         updateAssessment,
         getActivitiesByAssignment,
         addActivity,
         updateActivity,
      });

      if (options?.linkedActivityId && effectiveAssignmentId) {
         const linkedActivity = getActivitiesByAssignment(effectiveAssignmentId).find(
            (activity) => activity.id === options.linkedActivityId,
         );
         if (linkedActivity) {
            updateActivity(linkedActivity.id, {
               assignmentId: effectiveAssignmentId,
               fechaInicio: payload.date,
               status:
                  payload.status === "finalizada"
                     ? "completed"
                     : payload.status === "planificada"
                       ? "assigned"
                       : "planned",
               linkedClassIds: Array.from(
                  new Set([...linkedActivity.linkedClassIds, effectiveClassId]),
               ),
            });
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
            const normalizedTypeFilter = parsed.typeFilter === "oral" ? "evaluacion" : parsed.typeFilter;
            setTypeFilter(normalizedTypeFilter);
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
                  onOpenClassDetail={openClassDetail}
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
                  onOpenDetail={openClassDetail}
                  onOpenEdit={openEditModal}
                  onReplan={(id) => replanClass(id)}
                  onDuplicate={requestDuplicate}
               />
            )}
         </div>

         <PlanningModals
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            activeInstitution={activeInstitution}
            editingClass={editingClass}
            prefillDate={prefillDate}
            allClasses={classes}
            allActivities={activities}
            onSave={onSave}
            scheduleModalOpen={scheduleModalOpen}
            setScheduleModalOpen={setScheduleModalOpen}
            onSchedule={(payload) => createRecurringClasses(payload)}
            selectedDayDate={selectedDayDate}
            selectedDayClasses={selectedDayClasses}
            onCloseDayDetails={() => setSelectedDayDate(null)}
            onEditFromDayDetails={openEditModalFromDayDetails}
            onReplanFromDayDetails={(id) => replanClass(id, { fromDayDetails: true })}
            onDuplicate={requestDuplicate}
            classDetailOpen={classDetailOpen}
            detailClassId={detailClassId}
            onCloseClassDetail={closeClassDetail}
            onOpenClassDetailFromDay={openClassDetail}
            onEditFromClassDetail={handleEditFromClassDetail}
            onReplanFromClassDetail={handleReplanFromClassDetail}
            onDuplicateFromClassDetail={handleDuplicateFromClassDetail}
            duplicateDialogOpen={Boolean(duplicateCandidateId)}
            duplicateSourceClass={duplicateSourceClass}
            onCloseDuplicateDialog={closeDuplicateDialog}
            onConfirmDuplicate={confirmDuplicate}
         />
      </div>
   );
}


