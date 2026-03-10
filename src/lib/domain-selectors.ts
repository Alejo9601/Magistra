import type {
   Alert,
   Assignment,
   AttendanceRecord,
   ClassSession,
   EduDataStore,
   Enrollment,
   Evaluation,
   Grade,
   ID,
   Student,
   Submission,
   TeachingAssignment,
   TeachingScope,
} from "@/lib/domain-model";

export type ScopeResolved = {
   assignments: TeachingAssignment[];
   students: Student[];
   enrollments: Enrollment[];
};

function inDateRange(
   value: string,
   from?: string,
   to?: string,
): boolean {
   if (from && value < from) return false;
   if (to && value > to) return false;
   return true;
}

export function resolveScope(
   store: EduDataStore,
   scope: TeachingScope,
): ScopeResolved {
   const assignments = Object.values(store.teachingAssignments).filter((a) => {
      if (!a.active) return false;
      if (scope.institutionId && a.institutionId !== scope.institutionId) {
         return false;
      }
      if (scope.periodId && a.periodId !== scope.periodId) return false;
      if (scope.assignmentId && a.id !== scope.assignmentId) return false;
      if (scope.subjectId && a.subjectId !== scope.subjectId) return false;
      return true;
   });

   const assignmentIdSet = new Set(assignments.map((a) => a.id));
   const enrollments = Object.values(store.enrollments).filter(
      (e) => e.status === "active" && assignmentIdSet.has(e.assignmentId),
   );
   const studentIdSet = new Set(enrollments.map((e) => e.studentId));
   const students = Object.values(store.students).filter((s) =>
      studentIdSet.has(s.id),
   );

   return { assignments, students, enrollments };
}

export function getClassesByScope(
   store: EduDataStore,
   scope: TeachingScope,
): ClassSession[] {
   const { assignments } = resolveScope(store, scope);
   const assignmentIdSet = new Set(assignments.map((a) => a.id));
   return Object.values(store.classSessions)
      .filter(
         (c) =>
            assignmentIdSet.has(c.assignmentId) &&
            inDateRange(c.date, scope.dateFrom, scope.dateTo),
      )
      .sort((a, b) =>
         `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`),
      );
}

export function getSubmissionsByScope(
   store: EduDataStore,
   scope: TeachingScope,
): Submission[] {
   const { assignments } = resolveScope(store, scope);
   const assignmentIdSet = new Set(assignments.map((a) => a.id));
   const works = Object.values(store.assignments).filter((w) =>
      assignmentIdSet.has(w.assignmentId),
   );
   const workIdSet = new Set(works.map((w) => w.id));

   return Object.values(store.submissions).filter((s) =>
      workIdSet.has(s.assignmentWorkId),
   );
}

export function getAttendanceByScope(
   store: EduDataStore,
   scope: TeachingScope,
): AttendanceRecord[] {
   const classIds = new Set(getClassesByScope(store, scope).map((c) => c.id));
   return Object.values(store.attendance).filter((a) =>
      classIds.has(a.classSessionId),
   );
}

export function getEvaluationsByScope(
   store: EduDataStore,
   scope: TeachingScope,
): Evaluation[] {
   const { assignments } = resolveScope(store, scope);
   const assignmentIdSet = new Set(assignments.map((a) => a.id));
   return Object.values(store.evaluations).filter((e) =>
      assignmentIdSet.has(e.assignmentId),
   );
}

export function getGradesByScope(
   store: EduDataStore,
   scope: TeachingScope,
): Grade[] {
   const evalIds = new Set(getEvaluationsByScope(store, scope).map((e) => e.id));
   return Object.values(store.grades).filter((g) => evalIds.has(g.evaluationId));
}

type StudentHealth = {
   studentId: ID;
   attendancePct: number;
   pendingSubmissions: number;
   average: number | null;
   riskLevel: "low" | "medium" | "high";
};

export function getStudentHealthByScope(
   store: EduDataStore,
   scope: TeachingScope,
): StudentHealth[] {
   const { students } = resolveScope(store, scope);
   const attendance = getAttendanceByScope(store, scope);
   const submissions = getSubmissionsByScope(store, scope);
   const grades = getGradesByScope(store, scope);

   return students.map((student) => {
      const aRows = attendance.filter((a) => a.studentId === student.id);
      const presentCount = aRows.filter((a) => a.status === "P").length;
      const attendancePct = aRows.length
         ? Math.round((presentCount / aRows.length) * 100)
         : 100;

      const pendingSubmissions = submissions.filter(
         (s) =>
            s.studentId === student.id &&
            (s.status === "pending" || s.status === "missing"),
      ).length;

      const gRows = grades.filter(
         (g) => g.studentId === student.id && g.score !== null,
      );
      const average = gRows.length
         ? Number(
              (
                 gRows.reduce((sum, g) => sum + Number(g.score), 0) /
                 gRows.length
              ).toFixed(2),
           )
         : null;

      let riskLevel: StudentHealth["riskLevel"] = "low";
      if (attendancePct < 65 || pendingSubmissions >= 3 || (average ?? 10) < 5) {
         riskLevel = "high";
      } else if (
         attendancePct < 80 ||
         pendingSubmissions >= 1 ||
         (average ?? 10) < 7
      ) {
         riskLevel = "medium";
      }

      return {
         studentId: student.id,
         attendancePct,
         pendingSubmissions,
         average,
         riskLevel,
      };
   });
}

export function buildOperationalAlerts(
   store: EduDataStore,
   scope: TeachingScope,
): Alert[] {
   const classAlerts = getClassesByScope(store, scope)
      .filter((c) => c.status === "sin-planificar")
      .map<Alert>((c) => ({
         id: `alert-unplanned-${c.id}`,
         type: "unplanned_class",
         classSessionId: c.id,
         assignmentId: c.assignmentId,
         createdAt: new Date().toISOString(),
         severity: "medium",
         message: `Clase sin planificar: ${c.topic} (${c.date} ${c.startTime})`,
      }));

   const studentAlerts = getStudentHealthByScope(store, scope)
      .filter((s) => s.riskLevel !== "low")
      .map<Alert>((s) => ({
         id: `alert-risk-${s.studentId}`,
         type: s.pendingSubmissions > 0 ? "missing_submissions" : "attendance_risk",
         studentId: s.studentId,
         createdAt: new Date().toISOString(),
         severity: s.riskLevel === "high" ? "high" : "medium",
         message:
            s.pendingSubmissions > 0
               ? `Pendientes del alumno: ${s.pendingSubmissions}`
               : `Asistencia en riesgo: ${s.attendancePct}%`,
      }));

   return [...classAlerts, ...studentAlerts];
}

export type DailyBoardSnapshot = {
   classesToday: ClassSession[];
   studentsAtRisk: StudentHealth[];
   pendingTasks: number;
};

export function getDailyBoardSnapshot(
   store: EduDataStore,
   scope: TeachingScope,
   date: string,
): DailyBoardSnapshot {
   const classesToday = getClassesByScope(store, {
      ...scope,
      dateFrom: date,
      dateTo: date,
   });
   const studentsAtRisk = getStudentHealthByScope(store, scope).filter(
      (s) => s.riskLevel === "high",
   );
   const pendingTasks =
      getSubmissionsByScope(store, scope).filter(
         (s) => s.status === "pending" || s.status === "missing",
      ).length + classesToday.filter((c) => c.status === "sin-planificar").length;

   return { classesToday, studentsAtRisk, pendingTasks };
}

// Punto unico para flujo "Clase del dia -> asistencia + observaciones + tareas"
export type ClassExecutionInput = {
   classSessionId: ID;
   attendanceByStudent: Record<ID, AttendanceRecord["status"]>;
   notes?: string;
};

export function buildClassExecutionPatch(
   store: EduDataStore,
   input: ClassExecutionInput,
): {
   classUpdate: Partial<ClassSession>;
   newAttendance: AttendanceRecord[];
} {
   const classRow = store.classSessions[input.classSessionId];
   if (!classRow) {
      return { classUpdate: {}, newAttendance: [] };
   }

   const newAttendance: AttendanceRecord[] = Object.entries(
      input.attendanceByStudent,
   ).map(([studentId, status]) => ({
      id: `att-${input.classSessionId}-${studentId}`,
      classSessionId: input.classSessionId,
      studentId,
      status,
      recordedAt: new Date().toISOString(),
   }));

   return {
      classUpdate: {
         status: "finalizada",
         notes: input.notes ?? classRow.notes,
      },
      newAttendance,
   };
}

// Queries auxiliares para UI
export function getStudentById(
   store: EduDataStore,
   id: ID,
): Student | undefined {
   return store.students[id];
}

export function getTeachingAssignmentById(
   store: EduDataStore,
   id: ID,
): TeachingAssignment | undefined {
   return store.teachingAssignments[id];
}

export function getAssignmentWorksForTeachingAssignment(
   store: EduDataStore,
   teachingAssignmentId: ID,
): Assignment[] {
   return Object.values(store.assignments).filter(
      (w) => w.assignmentId === teachingAssignmentId,
   );
}
