import { useState } from "react";
import { toast } from "sonner";
import type {
   ActivityStatus,
   ActivityType,
   AssessmentStatus,
   AssessmentType,
   Student,
} from "@/types";
import type { GroupPendingDelete } from "@/features/groups/types";

type UseGroupDetailActionsParams = {
   assignmentId: string;
   groupStudents: Student[];
   addStudent: (input: {
      assignmentId: string;
      name: string;
      lastName: string;
      dni: string;
      email?: string;
      observations?: string;
   }) => unknown;
   addAssessment: (input: {
      assignmentId: string;
      title: string;
      date: string;
      type: AssessmentType;
      status?: AssessmentStatus;
      weight?: number;
      maxScore?: number;
      description?: string;
   }) => unknown;
   addActivity: (input: {
      assignmentId: string;
      title: string;
      type: ActivityType;
      status?: ActivityStatus;
      description?: string;
   }) => unknown;
   removeAssessment: (id: string) => void;
   removeActivity: (id: string) => void;
};

export function useGroupDetailActions({
   assignmentId,
   groupStudents,
   addStudent,
   addAssessment,
   addActivity,
   removeAssessment,
   removeActivity,
}: UseGroupDetailActionsParams) {
   const [addStudentOpen, setAddStudentOpen] = useState(false);
   const [addAssessmentOpen, setAddAssessmentOpen] = useState(false);
   const [addActivityOpen, setAddActivityOpen] = useState(false);
   const [studentSearch, setStudentSearch] = useState("");
   const [newName, setNewName] = useState("");
   const [newLastName, setNewLastName] = useState("");
   const [newDni, setNewDni] = useState("");
   const [newEmail, setNewEmail] = useState("");
   const [newObservations, setNewObservations] = useState("");
   const [newAssessmentTitle, setNewAssessmentTitle] = useState("");
   const [newAssessmentType, setNewAssessmentType] = useState<AssessmentType>("exam");
   const [newAssessmentDate, setNewAssessmentDate] = useState("");
   const [newAssessmentStatus, setNewAssessmentStatus] =
      useState<AssessmentStatus>("draft");
   const [newAssessmentWeight, setNewAssessmentWeight] = useState("1");
   const [newAssessmentMaxScore, setNewAssessmentMaxScore] = useState("10");
   const [newAssessmentDescription, setNewAssessmentDescription] = useState("");
   const [newActivityTitle, setNewActivityTitle] = useState("");
   const [newActivityType, setNewActivityType] = useState<ActivityType>("classwork");
   const [newActivityStatus, setNewActivityStatus] =
      useState<ActivityStatus>("planned");
   const [newActivityDescription, setNewActivityDescription] = useState("");
   const [pendingDelete, setPendingDelete] = useState<GroupPendingDelete | null>(null);

   const resetStudentForm = () => {
      setNewName("");
      setNewLastName("");
      setNewDni("");
      setNewEmail("");
      setNewObservations("");
   };

   const resetAssessmentForm = () => {
      setNewAssessmentTitle("");
      setNewAssessmentType("exam");
      setNewAssessmentDate("");
      setNewAssessmentStatus("draft");
      setNewAssessmentWeight("1");
      setNewAssessmentMaxScore("10");
      setNewAssessmentDescription("");
   };

   const resetActivityForm = () => {
      setNewActivityTitle("");
      setNewActivityType("classwork");
      setNewActivityStatus("planned");
      setNewActivityDescription("");
   };

   const submitStudent = () => {
      if (!newName.trim() || !newLastName.trim() || !newDni.trim()) {
         toast.error("Completa nombre, apellido y DNI/legajo.");
         return;
      }

      const normalizedDni = newDni.trim();
      const alreadyInGroup = groupStudents.some(
         (student) => student.dni.trim() === normalizedDni,
      );
      if (alreadyInGroup) {
         toast.error("Ese alumno ya esta vinculado a este grupo.");
         return;
      }

      try {
         addStudent({
            assignmentId,
            name: newName,
            lastName: newLastName,
            dni: normalizedDni,
            email: newEmail,
            observations: newObservations,
         });
         setAddStudentOpen(false);
         resetStudentForm();
         toast.success("Alumno agregado correctamente");
      } catch (error) {
         const message =
            error instanceof Error ? error.message : "No se pudo agregar el alumno.";
         toast.error(message);
      }
   };

   const submitAssessment = () => {
      if (!newAssessmentTitle.trim() || !newAssessmentDate) {
         toast.error("Completa titulo y fecha.");
         return;
      }

      const weight = Number(newAssessmentWeight);
      const maxScore = Number(newAssessmentMaxScore);
      if (!Number.isFinite(weight) || weight <= 0) {
         toast.error("La ponderacion debe ser mayor a 0.");
         return;
      }
      if (!Number.isFinite(maxScore) || maxScore <= 0) {
         toast.error("La nota maxima debe ser mayor a 0.");
         return;
      }

      addAssessment({
         assignmentId,
         title: newAssessmentTitle,
         date: newAssessmentDate,
         type: newAssessmentType,
         status: newAssessmentStatus,
         weight,
         maxScore,
         description: newAssessmentDescription,
      });
      setAddAssessmentOpen(false);
      resetAssessmentForm();
      toast.success("Evaluacion creada correctamente");
   };

   const submitActivity = () => {
      if (!newActivityTitle.trim()) {
         toast.error("Completa el titulo de la actividad.");
         return;
      }
      addActivity({
         assignmentId,
         title: newActivityTitle,
         type: newActivityType,
         status: newActivityStatus,
         description: newActivityDescription,
      });
      setAddActivityOpen(false);
      resetActivityForm();
      toast.success("Actividad creada correctamente");
   };

   const confirmDelete = () => {
      if (!pendingDelete) return;
      if (pendingDelete.kind === "assessment") {
         removeAssessment(pendingDelete.id);
         toast.success("Evaluacion eliminada");
      } else {
         removeActivity(pendingDelete.id);
         toast.success("Actividad eliminada");
      }
      setPendingDelete(null);
   };

   return {
      addStudentOpen,
      setAddStudentOpen,
      addAssessmentOpen,
      setAddAssessmentOpen,
      addActivityOpen,
      setAddActivityOpen,
      studentSearch,
      setStudentSearch,
      newName,
      setNewName,
      newLastName,
      setNewLastName,
      newDni,
      setNewDni,
      newEmail,
      setNewEmail,
      newObservations,
      setNewObservations,
      newAssessmentTitle,
      setNewAssessmentTitle,
      newAssessmentType,
      setNewAssessmentType,
      newAssessmentDate,
      setNewAssessmentDate,
      newAssessmentStatus,
      setNewAssessmentStatus,
      newAssessmentWeight,
      setNewAssessmentWeight,
      newAssessmentMaxScore,
      setNewAssessmentMaxScore,
      newAssessmentDescription,
      setNewAssessmentDescription,
      newActivityTitle,
      setNewActivityTitle,
      newActivityType,
      setNewActivityType,
      newActivityStatus,
      setNewActivityStatus,
      newActivityDescription,
      setNewActivityDescription,
      pendingDelete,
      setPendingDelete,
      resetStudentForm,
      resetAssessmentForm,
      resetActivityForm,
      submitStudent,
      submitAssessment,
      submitActivity,
      confirmDelete,
   };
}
