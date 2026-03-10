import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useInstitutionContext } from "@/contexts/institution-context";
import { StudentList } from "@/components/seguimiento/student-list";
import { StudentProfile } from "@/components/seguimiento/student-profile";
import { useStudentsContext } from "@/contexts/students-context";

export function SeguimientoContent() {
   const { activeInstitution } = useInstitutionContext();
   const { getStudentsByInstitution } = useStudentsContext();
   const navigate = useNavigate();
   const { id } = useParams();
   const [searchParams] = useSearchParams();
   const statusParam = searchParams.get("status");
   const selectedStudent = id ?? null;
   const institutionStudentIdSet = useMemo(
      () => new Set(getStudentsByInstitution(activeInstitution).map((s) => s.id)),
      [activeInstitution],
   );
   const statusFilter =
      statusParam === "en-riesgo" ||
      statusParam === "regular" ||
      statusParam === "destacado"
         ? statusParam
         : undefined;

   const handleSelectStudent = (studentId: string) => {
      navigate(`/seguimiento/${studentId}`);
   };

   const handleBack = () => {
      navigate("/seguimiento");
   };

   if (selectedStudent && institutionStudentIdSet.has(selectedStudent)) {
      return (
         <StudentProfile
            studentId={selectedStudent}
            onBack={handleBack}
            activeInstitution={activeInstitution}
         />
      );
   }

   return (
      <StudentList
         onSelect={handleSelectStudent}
         activeInstitution={activeInstitution}
         statusFilter={statusFilter}
      />
   );
}
