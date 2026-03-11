import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, List, CalendarDays, Plus, Edit3, Eye, Copy, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAssignmentById, getSubjectById, getInstitutionById } from "@/lib/edu-repository";
import { useInstitutionContext } from "@/features/institution";
import { usePlanningContext } from "@/features/planning";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ClassEditorModal } from "@/features/planning/class-editor-modal";
import { ClassScheduleModal } from "@/features/planning/class-schedule-modal";
import {
   classTypeColors,
   classTypeLabels,
   getStatusColor,
   getStatusLabel,
   monthNames,
} from "@/features/planning/constants";
import type {
   ClassFormInput,
   StatusFilter,
   TypeFilter,
   ViewMode,
} from "@/features/planning/types";

export function PlanificacionContent() {
   const { activeInstitution } = useInstitutionContext();
   const { classes, createClass, createRecurringClasses, updateClass, duplicateClass } = usePlanningContext();
   const [searchParams] = useSearchParams();

   const [view, setView] = useState<ViewMode>("calendar");
   const [month, setMonth] = useState(1);
   const [year, setYear] = useState(2026);
   const initialStatusFilter =
      searchParams.get("status") === "planificada" ||
      searchParams.get("status") === "sin-planificar" ||
      searchParams.get("status") === "finalizada"
         ? (searchParams.get("status") as StatusFilter)
         : "all";
   const [statusFilter, setStatusFilter] = useState<StatusFilter>(
      initialStatusFilter,
   );
   const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
   const [modalOpen, setModalOpen] = useState(false);
   const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
   const [editingClassId, setEditingClassId] = useState<string | null>(null);
   const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
   const today = new Date();
   const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

   const scopedClasses = useMemo(
      () => classes.filter((classSession) => classSession.institutionId === activeInstitution),
      [classes, activeInstitution],
   );

   const filteredClasses = useMemo(
      () => scopedClasses.filter((classSession) => {
         const statusMatches = statusFilter === "all" || classSession.status === statusFilter;
         const typeMatches = typeFilter === "all" || classSession.type === typeFilter;
         return statusMatches && typeMatches;
      }),
      [scopedClasses, statusFilter, typeFilter],
   );

   const editingClass = useMemo(
      () => editingClassId ? classes.find((classSession) => classSession.id === editingClassId) ?? null : null,
      [classes, editingClassId],
   );

   const listClasses = useMemo(
      () => [...filteredClasses].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
      [filteredClasses],
   );

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

   const openCreateModal = (date?: string) => {
      setEditingClassId(null);
      setPrefillDate(date);
      setModalOpen(true);
   };

   const openEditModal = (id: string) => {
      setEditingClassId(id);
      setPrefillDate(undefined);
      setModalOpen(true);
   };

   const onDuplicate = (id: string) => {
      const source = classes.find((classSession) => classSession.id === id);
      const duplicated = duplicateClass(id);
      if (!duplicated) {
         toast.error("No se pudo duplicar la clase.");
         return;
      }
      toast.success(
         source
            ? `Clase duplicada: ${source.date} -> ${duplicated.date}`
            : "Clase duplicada para la semana siguiente.",
      );
   };

   const onSave = (payload: ClassFormInput, mode: "draft" | "publish") => {
      if (editingClass) {
         updateClass(editingClass.id, payload);
         toast.success(mode === "publish" ? "Clase actualizada y publicada." : "Clase actualizada como borrador.");
      } else {
         createClass(payload);
         toast.success(mode === "publish" ? "Clase creada y publicada." : "Clase guardada como borrador.");
      }
   };

   return (
      <div className="flex h-full min-h-0 w-full flex-col p-6">
         <div className="sticky top-0 z-20 -mx-6 mb-4 border-b border-border/70 bg-background/95 px-6 pb-3 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pt-1">
               <div>
                  <h1 className="text-xl font-bold text-foreground">Planificacion</h1>
                  <p className="text-sm text-muted-foreground">Organiza, edita y publica tus clases por institucion.</p>
               </div>
               <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg bg-muted p-0.5">
                     <button onClick={() => setView("calendar")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        <CalendarDays className="size-3.5" /> Mensual
                     </button>
                     <button onClick={() => setView("list")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        <List className="size-3.5" /> Lista
                     </button>
                  </div>
                  <Button size="sm" className="text-xs" onClick={() => openCreateModal()}>
                     <Plus className="size-3.5 mr-1.5" /> Nueva clase
                  </Button>
                  <Button
                     variant="outline"
                     size="sm"
                     className="text-xs"
                     onClick={() => setScheduleModalOpen(true)}
                  >
                     Configurar cursada
                  </Button>
               </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
               <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                  <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todos los estados</SelectItem>
                     <SelectItem value="planificada">Planificada</SelectItem>
                     <SelectItem value="sin-planificar">Sin planificar</SelectItem>
                     <SelectItem value="finalizada">Finalizada</SelectItem>
                  </SelectContent>
               </Select>

               <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TypeFilter)}>
                  <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todos los tipos</SelectItem>
                     {Object.entries(classTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>

               <span className="text-xs text-muted-foreground ml-auto">{filteredClasses.length} clases</span>
            </div>

            {view === "calendar" && (
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Button variant="outline" size="icon" className="size-8" onClick={() => (month === 0 ? (setMonth(11), setYear((y) => y - 1)) : setMonth((m) => m - 1))}><ChevronLeft className="size-4" /></Button>
                     <h2 className="text-sm font-semibold text-foreground min-w-[140px] text-center">{monthNames[month]} {year}</h2>
                     <Button variant="outline" size="icon" className="size-8" onClick={() => (month === 11 ? (setMonth(0), setYear((y) => y + 1)) : setMonth((m) => m + 1))}><ChevronRight className="size-4" /></Button>
                  </div>
               </div>
            )}
         </div>

         <div className="flex-1 min-h-0 overflow-hidden">
            {view === "calendar" ? (
               <Card className="h-full w-full">
                  <CardContent className="h-full overflow-auto p-0">
                     <div className="grid grid-cols-7">
                        {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day) => (
                           <div key={day} className="border-b border-r border-border last:border-r-0 p-2 text-center">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{day}</span>
                           </div>
                        ))}
                        {weeks.flat().map((day, idx) => {
                           const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
                           const dayClasses = day ? filteredClasses.filter((classSession) => classSession.date === dateStr) : [];
                           const isPastDate = Boolean(day && dateStr < todayStr);
                           return (
                              <div key={idx} className={`min-h-[92px] border-b border-r border-border last:border-r-0 p-1.5 ${day ? isPastDate ? "bg-muted/55 ring-1 ring-inset ring-border/70" : "hover:bg-muted/30" : "bg-muted/10"}`}>
                                 {day && (
                                    <>
                                       <div className="flex items-center justify-between gap-1">
                                          <span className={`text-xs font-medium ${isPastDate ? "text-foreground/75" : "text-foreground"}`}>{day}</span>
                                          <button
                                             onClick={() => {
                                                if (isPastDate) return;
                                                openCreateModal(dateStr);
                                             }}
                                             disabled={isPastDate}
                                             className={`size-5 inline-flex items-center justify-center rounded ${isPastDate ? "bg-muted/70 text-muted-foreground/70 cursor-not-allowed" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"}`}
                                             title={isPastDate ? "No se pueden crear clases en fechas pasadas" : "Nueva clase"}
                                          >
                                             <Plus className="size-3" />
                                          </button>
                                       </div>
                                       <div className="mt-1 flex flex-col gap-0.5">
                                          {dayClasses.slice(0, 3).map((cls) => {
                                             const inst = getInstitutionById(cls.institutionId);
                                             const subject = getSubjectById(cls.subjectId);
                                             return (
                                                <button key={cls.id} onClick={() => openEditModal(cls.id)} className={`w-full text-left rounded px-1 py-0.5 text-[10px] font-medium truncate ${isPastDate ? "opacity-85" : ""}`} style={{ backgroundColor: (inst?.color ?? "#4F46E5") + "15", color: inst?.color ?? "#4F46E5" }}>
                                                   {subject?.name}
                                                </button>
                                             );
                                          })}
                                          {dayClasses.length > 3 && <span className="text-[9px] text-muted-foreground px-1">+{dayClasses.length - 3} mas</span>}
                                       </div>
                                    </>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  </CardContent>
               </Card>
            ) : (
               <Card className="h-full">
                  <CardContent className="h-full overflow-auto p-0">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead className="text-xs">Fecha</TableHead>
                              <TableHead className="text-xs">Materia</TableHead>
                              <TableHead className="text-xs">Institucion</TableHead>
                              <TableHead className="text-xs">Curso</TableHead>
                              <TableHead className="text-xs">Tema</TableHead>
                              <TableHead className="text-xs">Tipo</TableHead>
                              <TableHead className="text-xs">Estado</TableHead>
                              <TableHead className="text-xs text-right">Acciones</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {listClasses.map((cls) => {
                              const subject = getSubjectById(cls.subjectId);
                              const assignment = cls.assignmentId
                                 ? getAssignmentById(cls.assignmentId)
                                 : null;
                              const inst = getInstitutionById(cls.institutionId);
                              const dateObj = new Date(cls.date + "T12:00:00");
                              return (
                                 <TableRow key={cls.id} className="hover:bg-muted/30">
                                    <TableCell className="text-xs whitespace-nowrap">{dateObj.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} {cls.time}</TableCell>
                                    <TableCell className="text-xs font-medium">{subject?.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{inst?.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                       {assignment?.section ?? subject?.course}
                                    </TableCell>
                                    <TableCell className="text-xs max-w-[190px] truncate">{cls.topic}</TableCell>
                                    <TableCell><Badge className={`border-0 text-[10px] ${classTypeColors[cls.type]}`}>{classTypeLabels[cls.type]}</Badge></TableCell>
                                    <TableCell><Badge className={`border-0 text-[10px] ${getStatusColor(cls.status)}`}>{getStatusLabel(cls.status)}</Badge></TableCell>
                                    <TableCell>
                                       <div className="flex items-center justify-end gap-1">
                                          <Button variant="ghost" size="icon" className="size-7" asChild><Link to={`/clase/${cls.id}`}><Eye className="size-3.5" /></Link></Button>
                                          <Button variant="ghost" size="icon" className="size-7" asChild><Link to={`/clase/${cls.id}/dictado`}><ClipboardCheck className="size-3.5" /></Link></Button>
                                          <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditModal(cls.id)}><Edit3 className="size-3.5" /></Button>
                                          <Button variant="ghost" size="icon" className="size-7" onClick={() => onDuplicate(cls.id)}><Copy className="size-3.5" /></Button>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                              );
                           })}
                           {listClasses.length === 0 && (
                              <TableRow><TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">No hay clases para los filtros seleccionados.</TableCell></TableRow>
                           )}
                        </TableBody>
                     </Table>
                  </CardContent>
               </Card>
            )}
         </div>

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
            onSchedule={(payload) => createRecurringClasses(payload)}
         />
      </div>
   );
}




