export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // YYYY-MM-DDTHH:mm:ssZ

export type Institution = {
   id: ID;
   name: string;
   address?: string;
   level?: "Primaria" | "Secundaria" | "Terciaria" | "Universidad" | "Otro";
   color?: string;
   active: boolean;
};

export type Subject = {
   id: ID;
   name: string;
   area?: string;
};

export type AcademicPeriod = {
   id: ID;
   institutionId: ID;
   name: string; // ej: Ciclo lectivo 2026
   startDate: ISODate;
   endDate: ISODate;
   active: boolean;
};

// Vincula "yo enseño X materia en Y institucion, curso Z"
export type TeachingAssignment = {
   id: ID;
   institutionId: ID;
   subjectId: ID;
   periodId: ID;
   courseName: string; // ej: 3ro A
   section?: string;
   weeklyHours?: number;
   active: boolean;
};

export type Student = {
   id: ID;
   firstName: string;
   lastName: string;
   dni?: string;
   email?: string;
   active: boolean;
};

// Inscripcion de alumno a un grupo (assignment) en un periodo
export type Enrollment = {
   id: ID;
   studentId: ID;
   assignmentId: ID;
   enrolledAt?: ISODate;
   status: "active" | "moved" | "dropped";
};

export type ClassSession = {
   id: ID;
   assignmentId: ID;
   date: ISODate;
   startTime: string; // HH:mm
   endTime?: string; // HH:mm
   topic: string;
   type: "teorica" | "practica" | "evaluacion" | "repaso" | "recuperatorio";
   status: "planificada" | "sin-planificar" | "finalizada" | "cancelada";
   notes?: string;
};

export type AttendanceStatus = "P" | "A" | "T" | "J";

export type AttendanceRecord = {
   id: ID;
   classSessionId: ID;
   studentId: ID;
   status: AttendanceStatus;
   recordedAt?: ISODateTime;
};

// Trabajo/consigna evaluable
export type Assignment = {
   id: ID;
   assignmentId: ID; // teaching assignment
   title: string;
   description?: string;
   assignedDate: ISODate;
   dueDate: ISODate;
   maxScore?: number;
   weight?: number; // porcentaje para promedio
   status: "draft" | "published" | "closed";
};

export type SubmissionStatus =
   | "pending"
   | "submitted"
   | "late"
   | "missing"
   | "excused";

export type Submission = {
   id: ID;
   assignmentWorkId: ID; // Assignment.id
   studentId: ID;
   submittedAt?: ISODateTime;
   status: SubmissionStatus;
   score?: number;
   feedback?: string;
};

export type Evaluation = {
   id: ID;
   assignmentId: ID; // teaching assignment
   title: string;
   type: "parcial" | "tp" | "final" | "quiz";
   date: ISODate;
   maxScore: number;
};

export type Grade = {
   id: ID;
   evaluationId: ID;
   studentId: ID;
   score: number | null;
   observation?: string;
};

export type StudentObservation = {
   id: ID;
   studentId: ID;
   assignmentId?: ID; // opcional: contexto de grupo
   classSessionId?: ID;
   date: ISODate;
   text: string;
   category: "academico" | "asistencia" | "conducta" | "otro";
};

export type AlertType =
   | "attendance_risk"
   | "missing_submissions"
   | "low_average"
   | "unplanned_class";

export type Alert = {
   id: ID;
   type: AlertType;
   studentId?: ID;
   assignmentId?: ID;
   classSessionId?: ID;
   createdAt: ISODateTime;
   resolvedAt?: ISODateTime;
   severity: "low" | "medium" | "high";
   message: string;
};

// Store normalizado minimo para escalar sin dolores
export type EduDataStore = {
   institutions: Record<ID, Institution>;
   subjects: Record<ID, Subject>;
   periods: Record<ID, AcademicPeriod>;
   teachingAssignments: Record<ID, TeachingAssignment>;
   students: Record<ID, Student>;
   enrollments: Record<ID, Enrollment>;
   classSessions: Record<ID, ClassSession>;
   attendance: Record<ID, AttendanceRecord>;
   assignments: Record<ID, Assignment>;
   submissions: Record<ID, Submission>;
   evaluations: Record<ID, Evaluation>;
   grades: Record<ID, Grade>;
   observations: Record<ID, StudentObservation>;
   alerts: Record<ID, Alert>;
};

// Estado global de foco (la clave para tu caso multi-escuela/multi-materia)
export type TeachingScope = {
   institutionId?: ID;
   periodId?: ID;
   assignmentId?: ID;
   subjectId?: ID;
   dateFrom?: ISODate;
   dateTo?: ISODate;
};

export const DEFAULT_SCOPE: TeachingScope = {};
