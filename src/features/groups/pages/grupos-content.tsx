import { useEffect, useMemo, useState } from "react";
import {
   createSubject,
   getAssignmentIdBySubjectId,
   getAssignmentsByInstitution,
   institutions,
} from "@/lib/edu-repository";
import {
   isAllInstitutionsScope,
   useInstitutionContext,
} from "@/features/institution";
import { GroupsList } from "@/features/groups/containers";
import { GroupDetail } from "@/features/groups/pages";
import {
   blockDurationOptions,
   periodFormatOptions,
   SubjectCreateDialog,
} from "@/features/settings/components/subject-create-dialog";
import { useStudentsContext } from "@/features/students";
import { toast } from "sonner";

type PeriodFormatValue = (typeof periodFormatOptions)[number]["value"];
type BlockDurationValue = (typeof blockDurationOptions)[number]["value"];

function resolveDefaultInstitutionId(activeInstitution: string) {
   if (isAllInstitutionsScope(activeInstitution)) {
      return institutions[0]?.id ?? "";
   }
   return activeInstitution;
}

export function GruposContent() {
   const { activeInstitution } = useInstitutionContext();
   const { importSectionStudentsToAssignment } = useStudentsContext();

   const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
   const [addOpen, setAddOpen] = useState(false);
   const [institutionId, setInstitutionId] = useState(resolveDefaultInstitutionId(activeInstitution));
   const [subjectName, setSubjectName] = useState("");
   const [course, setCourse] = useState("");
   const [periodFormat, setPeriodFormat] = useState<PeriodFormatValue>("trimestral");
   const [blockDurationMinutes, setBlockDurationMinutes] = useState<BlockDurationValue>(40);
   const [copySectionStudents, setCopySectionStudents] = useState(false);

   useEffect(() => {
      if (!addOpen) {
         setInstitutionId(resolveDefaultInstitutionId(activeInstitution));
      }
   }, [activeInstitution, addOpen]);

   const validAssignmentIds = useMemo(
      () => new Set(getAssignmentsByInstitution(activeInstitution).map((a) => a.id)),
      [activeInstitution],
   );

   const effectiveSelectedGroup =
      selectedGroup && validAssignmentIds.has(selectedGroup)
         ? selectedGroup
         : null;

   const resetForm = () => {
      setInstitutionId(resolveDefaultInstitutionId(activeInstitution));
      setSubjectName("");
      setCourse("");
      setPeriodFormat("trimestral");
      setBlockDurationMinutes(40);
      setCopySectionStudents(false);
   };

   const handleCreateSubject = () => {
      if (!institutionId || !subjectName.trim() || !course.trim()) {
         toast.error("Completa institucion, materia y curso/seccion.");
         return;
      }

      const createdSubject = createSubject({
         institutionId,
         name: subjectName,
         course,
         periodFormat,
         blockDurationMinutes,
      });

      if (copySectionStudents) {
         const importResult = importSectionStudentsToAssignment(
            getAssignmentIdBySubjectId(createdSubject.id),
         );
         if (importResult.noSourceStudents) {
            toast.success("Materia creada. No habia alumnos en otras materias de la misma seccion.");
         } else if (importResult.linked > 0) {
            toast.success(
               `Materia creada. Se vincularon ${importResult.linked} alumno(s) de la misma seccion.`,
            );
         } else {
            toast.success("Materia creada. Los alumnos de la misma seccion ya estaban vinculados.");
         }
      } else {
         toast.success("Materia creada correctamente.");
      }

      setAddOpen(false);
      resetForm();
   };

   if (effectiveSelectedGroup) {
      return (
         <GroupDetail
            assignmentId={effectiveSelectedGroup}
            onBack={() => setSelectedGroup(null)}
         />
      );
   }

   return (
      <>
         <GroupsList
            onSelect={setSelectedGroup}
            onAddSubject={() => setAddOpen(true)}
            activeInstitution={activeInstitution}
         />

         <SubjectCreateDialog
            open={addOpen}
            institutionId={institutionId}
            subjectName={subjectName}
            course={course}
            periodFormat={periodFormat}
            blockDurationMinutes={blockDurationMinutes}
            copySectionStudents={copySectionStudents}
            onOpenChange={(open) => {
               setAddOpen(open);
               if (!open) {
                  resetForm();
               }
            }}
            onInstitutionChange={setInstitutionId}
            onSubjectNameChange={setSubjectName}
            onCourseChange={setCourse}
            onPeriodFormatChange={setPeriodFormat}
            onBlockDurationChange={setBlockDurationMinutes}
            onCopySectionStudentsChange={setCopySectionStudents}
            onCancel={() => setAddOpen(false)}
            onSubmit={handleCreateSubject}
         />
      </>
   );
}
