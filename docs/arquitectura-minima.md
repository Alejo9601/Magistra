# Arquitectura Minima (Operacion Real)

## Objetivo
Pasar de UI demo a app operable para docente multi-institucion:
- planificar clases
- registrar asistencia
- seguir entregas/notas/alertas por alumno
- trabajar en paralelo con varias escuelas y materias

## Modelo de datos (base)
Implementado en:
- `src/lib/domain-model.ts`
- `src/lib/domain-selectors.ts`

Entidades core:
- `Institution`
- `AcademicPeriod`
- `Subject`
- `TeachingAssignment` (institucion + materia + curso + periodo)
- `Student`
- `Enrollment` (alumno inscrito en un grupo)
- `ClassSession`
- `AttendanceRecord`
- `Assignment` (trabajo/consigna)
- `Submission` (entrega por alumno)
- `Evaluation`
- `Grade`
- `StudentObservation`
- `Alert`

## Relacion clave
La unidad operacional es `TeachingAssignment`:
- ejemplo: "Matematica - 3ro A - Colegio X - Ciclo 2026"

Todo cuelga de ahi:
- clases (`ClassSession`)
- alumnos (via `Enrollment`)
- trabajos y entregas (`Assignment`, `Submission`)
- evaluaciones y notas (`Evaluation`, `Grade`)
- alertas y observaciones

## Estado global minimo de UI
`TeachingScope` (filtro transversal):
- `institutionId`
- `periodId`
- `assignmentId`
- `subjectId`
- rango de fechas

Regla:
- todas las pantallas consultan datos por selector usando el mismo `scope`.
- evita inconsistencias cuando enseñas en varias escuelas.

## Selectores operativos incluidos
En `src/lib/domain-selectors.ts`:
- `resolveScope`
- `getClassesByScope`
- `getSubmissionsByScope`
- `getAttendanceByScope`
- `getStudentHealthByScope`
- `buildOperationalAlerts`
- `getDailyBoardSnapshot`
- `buildClassExecutionPatch`

Estos selectores cubren el flujo diario:
1. ver clases del dia
2. pasar asistencia y notas de clase
3. detectar riesgo (asistencia + pendientes + promedio)
4. generar alertas operativas

## Flujo recomendado de producto
1. `Dashboard`:
   - snapshot del dia por `scope`
2. `Planificacion`:
   - clases por periodo/semana + estado
3. `Clase detalle`:
   - asistencia + observaciones + cierre de clase
4. `Grupos/Seguimiento`:
   - entregas pendientes, notas y riesgo por alumno

## Roadmap tecnico (simple)
1. Persistencia:
   - reemplazar mocks por backend (Supabase/Postgres o API propia)
2. Estado cliente:
   - `scope` global (Context/Zustand)
   - queries por selector (React Query)
3. Integridad:
   - constraints por periodo/inscripcion
   - validaciones de fechas, duplicados y estado de cierre
4. Reportes:
   - resumen mensual por institucion/materia/curso
