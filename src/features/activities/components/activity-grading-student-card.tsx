import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ActivityStudentGrade, GradeScale, SubjectRubric } from "@/types";

type ActivityGradingStudentCardProps = {
   studentLabel: string;
   grade: ActivityStudentGrade;
   rubric: SubjectRubric | null;
   scale: GradeScale;
   descriptor?: string;
   rubricFinalScore?: number | null;
   onDirectScoreChange: (value: string) => void;
   onRubricCriterionChange: (criterionId: string, value: string) => void;
   onMarkComplete: () => void;
};

function scoreStep(scale: GradeScale) {
   return scale === "numeric-100" ? "1" : "0.1";
}

function scoreMax(scale: GradeScale) {
   return scale === "numeric-100" ? 100 : 10;
}

export function ActivityGradingStudentCard({
   studentLabel,
   grade,
   rubric,
   scale,
   descriptor,
   rubricFinalScore,
   onDirectScoreChange,
   onRubricCriterionChange,
   onMarkComplete,
}: ActivityGradingStudentCardProps) {
   const isRubricMode = Boolean(rubric);

   return (
      <Card>
         <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
               <CardTitle className="text-sm font-semibold">Alumno: {studentLabel}</CardTitle>
               <Badge
                  className={`border-0 text-[10px] ${grade.status === "complete" ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"}`}
               >
                  {grade.status === "complete" ? "Completa" : "Pendiente"}
               </Badge>
            </div>
         </CardHeader>
         <CardContent className="space-y-3 pt-0">
            {isRubricMode && rubric ? (
               <>
                  {rubric.criteria.map((criterion) => {
                     const criterionScore = grade.criteriaScores?.[criterion.id];
                     return (
                        <div key={criterion.id} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[1fr_120px] sm:items-end">
                           <div>
                              <Label className="text-xs">{criterion.name}</Label>
                              <p className="text-[11px] text-muted-foreground">Peso: {criterion.weight}%</p>
                           </div>
                           <Input
                              type="number"
                              className="h-9 text-xs"
                              min={0}
                              max={scoreMax(scale)}
                              step={scoreStep(scale)}
                              value={criterionScore ?? ""}
                              onChange={(event) => onRubricCriterionChange(criterion.id, event.target.value)}
                           />
                        </div>
                     );
                  })}

                  <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                     <p className="text-xs text-muted-foreground">Nota final</p>
                     <p className="text-sm font-semibold text-foreground">
                        {typeof rubricFinalScore === "number" ? rubricFinalScore : "-"}
                     </p>
                     {descriptor ? <p className="text-[11px] text-muted-foreground mt-1">{descriptor}</p> : null}
                  </div>
               </>
            ) : (
               <>
                  <div className="space-y-1.5">
                     <Label className="text-xs">Nota</Label>
                     <Input
                        type="number"
                        className="h-9 text-xs"
                        min={0}
                        max={scoreMax(scale)}
                        step={scoreStep(scale)}
                        value={grade.score ?? ""}
                        onChange={(event) => onDirectScoreChange(event.target.value)}
                     />
                     {descriptor ? <p className="text-[11px] text-muted-foreground">{descriptor}</p> : null}
                  </div>
                  <Button size="sm" className="text-xs" onClick={onMarkComplete} disabled={grade.score === undefined}>
                     Marcar como completa
                  </Button>
               </>
            )}
         </CardContent>
      </Card>
   );
}

