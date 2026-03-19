import { BookOpen, Eye, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   assessmentTypeLabel,
   evaluativeClassTypeLabel,
   inferEvaluativeTypeFromTitle,
} from "@/features/groups/utils";
import type { Assessment, ClassSession } from "@/types";

type GroupDetailAssessmentsTabProps = {
   groupAssessments: Assessment[];
   groupClasses: ClassSession[];
   studentsCount: number;
   onAddAssessment: () => void;
   onDeleteAssessment: (assessmentId: string, title: string) => void;
};

export function GroupDetailAssessmentsTab({
   groupAssessments,
   groupClasses,
   studentsCount,
   onAddAssessment,
   onDeleteAssessment,
}: GroupDetailAssessmentsTabProps) {
   return (
      <TabsContent value="evaluaciones">
         <div className="mt-2 mb-3 flex items-center justify-end">
            <Button size="sm" className="text-xs" onClick={onAddAssessment}>
               <Plus className="size-3.5 mr-1.5" />
               Crear evaluacion o TP
            </Button>
         </div>
         <Card className="mt-2">
            <CardContent className="p-0">
               <Table className="min-w-[980px]">
                  <TableHeader>
                     <TableRow>
                        <TableHead className="text-xs">Nombre de la evaluacion</TableHead>
                        <TableHead className="text-xs">Fecha clase relacionada</TableHead>
                        <TableHead className="text-xs">Tipo</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                        <TableHead className="text-xs">Notas cargadas</TableHead>
                        <TableHead className="text-xs text-right">Acciones</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {groupAssessments.map((assessment) => {
                        const linkedClass = assessment.linkedClassId
                           ? groupClasses.find((classSession) => classSession.id === assessment.linkedClassId) ?? null
                           : null;
                        const linkedClassDate = linkedClass
                           ? new Date(linkedClass.date + "T12:00:00").toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "short",
                             })
                           : "Sin clase";
                        const inferredAssessmentType = inferEvaluativeTypeFromTitle(assessment.title);
                        const linkedClassType = linkedClass?.evaluativeFormat
                           ? evaluativeClassTypeLabel[linkedClass.evaluativeFormat] ??
                             inferredAssessmentType ??
                             assessmentTypeLabel[assessment.type]
                           : inferredAssessmentType ?? assessmentTypeLabel[assessment.type];
                        const derivedStatus = linkedClass
                           ? linkedClass.status === "finalizada"
                              ? "Finalizado"
                              : "Pendiente"
                           : assessment.status === "graded"
                             ? "Finalizado"
                             : "Pendiente";
                        const derivedStatusClass =
                           derivedStatus === "Finalizado"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning-foreground";

                        return (
                           <TableRow key={assessment.id} className="hover:bg-muted/30">
                              <TableCell className="text-xs font-medium">{assessment.title}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                 {linkedClassDate}
                              </TableCell>
                              <TableCell>
                                 <Badge variant="secondary" className="text-[10px] capitalize">
                                    {linkedClassType}
                                 </Badge>
                              </TableCell>
                              <TableCell>
                                 <Badge className={`border-0 text-[10px] ${derivedStatusClass}`}>
                                    {derivedStatus}
                                 </Badge>
                              </TableCell>
                              <TableCell>
                                 <span className="text-xs text-muted-foreground">
                                    {assessment.gradesLoaded} / {studentsCount}
                                 </span>
                              </TableCell>
                              <TableCell className="text-right">
                                 <div className="inline-flex items-center gap-1">
                                    {assessment.linkedClassId ? (
                                       <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs"
                                          asChild
                                       >
                                          <Link to={`/clase/${assessment.linkedClassId}/dictado`}>
                                             <Eye className="size-3.5 mr-1" />
                                             Ver notas
                                          </Link>
                                       </Button>
                                    ) : null}
                                    <Button
                                       type="button"
                                       variant="ghost"
                                       size="icon"
                                       className="size-7"
                                       onClick={() => onDeleteAssessment(assessment.id, assessment.title)}
                                    >
                                       <Trash2 className="size-3.5 text-muted-foreground" />
                                    </Button>
                                 </div>
                              </TableCell>
                           </TableRow>
                        );
                     })}
                     {groupAssessments.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={7} className="text-center py-8">
                              <BookOpen className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">No hay evaluaciones registradas</p>
                              <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={onAddAssessment}>
                                 <Plus className="size-3.5 mr-1.5" />
                                 Crear evaluacion
                              </Button>
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </TabsContent>
   );
}
