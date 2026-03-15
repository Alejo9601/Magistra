export type Institution = {
   id: string;
   name: string;
   address: string;
   level: string;
   color: string;
};

export type Subject = {
   id: string;
   name: string;
   institutionId: string;
   course: string;
   periodFormat: AcademicPeriodFormat;
   studentCount: number;
   planProgress: number;
};

export type AcademicPeriodFormat = "trimestral" | "cuatrimestral";

export type TeachingAssignment = {
   id: string;
   institutionId: string;
   subjectId: string;
   section: string;
   active: boolean;
};

export type Enrollment = {
   id: string;
   studentId: string;
   assignmentId: string;
   active: boolean;
};

export type StudentStatus = "regular" | "en-riesgo" | "destacado";

export type Student = {
   id: string;
   name: string;
   lastName: string;
   dni: string;
   email?: string;
   subjectIds: string[];
   attendance: number;
   average: number;
   status: StudentStatus;
   observations?: string;
};

export type ClassType =
   | "teorica"
   | "practica"
   | "evaluacion"
   | "repaso"
   | "recuperatorio";

export type ClassStatus = "planificada" | "sin-planificar" | "finalizada";

export type ClassSession = {
   id: string;
   subjectId: string;
   institutionId: string;
   assignmentId?: string;
   date: string;
   time: string;
   scheduleTemplateId?: string;
   topic: string;
   subtopics: string[];
   type: ClassType;
   status: ClassStatus;
   activities?: string;
   notes?: string;
   resources?: string[];
};

export type EvaluationType = "parcial" | "tp" | "final" | "quiz";

export type EvaluationGrade = {
   studentId: string;
   grade: number | string;
   observation?: string;
};

export type Evaluation = {
   id: string;
   name: string;
   subjectId: string;
   date: string;
   type: EvaluationType;
   grades: EvaluationGrade[];
};

export type ContentType =
   | "apunte"
   | "consigna"
   | "evaluacion"
   | "presentacion"
   | "link"
   | "otro";

export type ContentFileType = "pdf" | "image" | "video" | "link" | "doc";

export type ContentItem = {
   id: string;
   name: string;
   description: string;
   subjectId: string;
   institutionId: string;
   unit: string[];
   type: ContentType;
   fileType: ContentFileType;
   uploadDate: string;
   tags: string[];
};

export type AttendanceStatus = "P" | "A" | "T" | "J";

export type AttendanceRecord = {
   studentId: string;
   classId: string;
   status: AttendanceStatus;
};

export type TeacherProfile = {
   name: string;
   lastName: string;
   email: string;
   avatar: string;
};

export type AssessmentType = "exam" | "practice_work";
export type AssessmentStatus = "draft" | "scheduled" | "published" | "graded";

export type Assessment = {
   id: string;
   subjectId: string;
   assignmentId?: string;
   title: string;
   description?: string;
   date: string;
   type: AssessmentType;
   status: AssessmentStatus;
   weight: number;
   maxScore: number;
   gradesLoaded: number;
};

export type ActivityType = "classwork" | "homework" | "lab" | "project";
export type ActivityStatus = "draft" | "planned" | "assigned" | "completed";

export type SubjectActivity = {
   id: string;
   subjectId: string;
   assignmentId?: string;
   title: string;
   description?: string;
   type: ActivityType;
   status: ActivityStatus;
   linkedClassIds: string[];
};

export type ClassroomRecord = {
   completedSubtopics: string[];
   completedActivities: string[];
   attendance: Record<string, AttendanceStatus>;
   notes?: string;
};
