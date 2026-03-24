import { ClassEditorModal } from "@/features/planning/components/class-editor-modal";
import { ClassQuickCreateModal } from "@/features/planning/components/class-quick-create-modal";
import { ClassScheduleModal } from "@/features/planning/components/class-schedule-modal";
import { DayClassesDialog } from "@/features/planning/components/day-classes-dialog";
import { ClassDetailDialog } from "@/features/planning/components/class-detail-dialog";
import { DuplicateClassDialog } from "@/features/planning/components/duplicate-class-dialog";
import type { ClassFormInput } from "@/features/planning/types";
import type { ClassSession, SubjectActivity } from "@/types";

export function PlanningModals({
   quickCreateOpen,
   setQuickCreateOpen,
   modalOpen,
   setModalOpen,
   activeInstitution,
   editingClass,
   prefillDate,
   allClasses,
   allActivities,
   getScheduleSlotsForDate,
   onQuickCreate,
   onSave,
   scheduleModalOpen,
   setScheduleModalOpen,
   onSchedule,
   selectedDayDate,
   selectedDayClasses,
   onCloseDayDetails,
   onEditFromDayDetails,
   onReplanFromDayDetails,
   onDuplicate,
   classDetailOpen,
   detailClassId,
   onCloseClassDetail,
   onOpenClassDetailFromDay,
   onEditFromClassDetail,
   onReplanFromClassDetail,
   onDuplicateFromClassDetail,
   duplicateDialogOpen,
   duplicateSourceClass,
   onCloseDuplicateDialog,
   onConfirmDuplicate,
}: {
   quickCreateOpen: boolean;
   setQuickCreateOpen: (open: boolean) => void;
   modalOpen: boolean;
   setModalOpen: (open: boolean) => void;
   activeInstitution: string;
   editingClass: ClassSession | null;
   prefillDate?: string;
   allClasses: ClassSession[];
   allActivities: SubjectActivity[];
   getScheduleSlotsForDate: (
      assignmentId: string,
      date: string,
   ) => Array<{ scheduleTemplateId: string; time: string; blockCount: number }>;
   onQuickCreate: (payload: {
      assignmentId: string;
      date: string;
      time: string;
      blockCount: number;
      scheduleTemplateId?: string;
   }) => void;
   onSave: (
      payload: ClassFormInput,
      mode: "draft" | "publish",
      options?: { linkedActivityId?: string },
   ) => void;
   scheduleModalOpen: boolean;
   setScheduleModalOpen: (open: boolean) => void;
   onSchedule: (payload: {
      institutionId: string;
      assignmentId: string;
      startDate: string;
      endDate: string;
      slots: Array<{
         dayOfWeek: number;
         time: string;
         blockCount: number;
      }>;
   }) => number;
   selectedDayDate: string | null;
   selectedDayClasses: ClassSession[];
   onCloseDayDetails: () => void;
   onEditFromDayDetails: (id: string) => void;
   onReplanFromDayDetails: (id: string) => void;
   onDuplicate: (id: string) => void;
   classDetailOpen: boolean;
   detailClassId: string | null;
   onCloseClassDetail: () => void;
   onOpenClassDetailFromDay: (id: string) => void;
   onEditFromClassDetail: (id: string) => void;
   onReplanFromClassDetail: (id: string) => void;
   onDuplicateFromClassDetail: (id: string) => void;
   duplicateDialogOpen: boolean;
   duplicateSourceClass: ClassSession | null;
   onCloseDuplicateDialog: () => void;
   onConfirmDuplicate: () => void;
}) {
   return (
      <>
         <ClassQuickCreateModal
            open={quickCreateOpen}
            onOpenChange={setQuickCreateOpen}
            activeInstitution={activeInstitution}
            initialDate={prefillDate}
            getScheduleSlotsForDate={getScheduleSlotsForDate}
            onSubmit={onQuickCreate}
         />

         <ClassEditorModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            activeInstitution={activeInstitution}
            initialClass={editingClass}
            initialDate={prefillDate}
            allClasses={allClasses}
            allActivities={allActivities}
            onSubmit={onSave}
         />

         <ClassScheduleModal
            open={scheduleModalOpen}
            onOpenChange={setScheduleModalOpen}
            activeInstitution={activeInstitution}
            onSchedule={onSchedule}
         />

         <DayClassesDialog
            selectedDayDate={selectedDayDate}
            selectedDayClasses={selectedDayClasses}
            onClose={onCloseDayDetails}
            onOpenClassDetail={onOpenClassDetailFromDay}
            onEditClass={onEditFromDayDetails}
            onReplanClass={onReplanFromDayDetails}
            onDuplicate={onDuplicate}
         />

         <ClassDetailDialog
            open={classDetailOpen}
            classId={detailClassId}
            onOpenChange={(open) => {
               if (!open) {
                  onCloseClassDetail();
               }
            }}
            onEditClass={onEditFromClassDetail}
            onReplanClass={onReplanFromClassDetail}
            onDuplicateClass={onDuplicateFromClassDetail}
         />

         <DuplicateClassDialog
            open={duplicateDialogOpen}
            sourceClass={duplicateSourceClass}
            onOpenChange={(open) => {
               if (!open) {
                  onCloseDuplicateDialog();
               }
            }}
            onConfirm={onConfirmDuplicate}
         />
      </>
   );
}
