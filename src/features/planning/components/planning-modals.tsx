import { ClassEditorModal } from "@/features/planning/class-editor-modal";
import { ClassScheduleModal } from "@/features/planning/class-schedule-modal";
import { DayClassesDialog } from "@/features/planning/components/day-classes-dialog";
import type { ClassFormInput } from "@/features/planning/types";
import type { ClassSession } from "@/types";

export function PlanningModals({
   modalOpen,
   setModalOpen,
   activeInstitution,
   editingClass,
   prefillDate,
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
}: {
   modalOpen: boolean;
   setModalOpen: (open: boolean) => void;
   activeInstitution: string;
   editingClass: ClassSession | null;
   prefillDate?: string;
   onSave: (payload: ClassFormInput, mode: "draft" | "publish") => void;
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
}) {
   return (
      <>
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
            onSchedule={onSchedule}
         />

         <DayClassesDialog
            selectedDayDate={selectedDayDate}
            selectedDayClasses={selectedDayClasses}
            onClose={onCloseDayDetails}
            onEditClass={onEditFromDayDetails}
            onReplanClass={onReplanFromDayDetails}
            onDuplicate={onDuplicate}
         />
      </>
   );
}
