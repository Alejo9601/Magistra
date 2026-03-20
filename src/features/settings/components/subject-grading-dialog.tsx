import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubjectGradingGeneralFields } from "@/features/settings/components/subject-grading-general-fields";
import { SubjectGradingWeightsFields } from "@/features/settings/components/subject-grading-weights-fields";
import { SubjectRubricsEditor } from "@/features/settings/components/subject-rubrics-editor";
import { useSubjectGradingDialogState } from "@/features/settings/hooks/use-subject-grading-dialog-state";
import { toNumber } from "@/features/settings/utils/subject-grading-dialog.utils";
import type { Subject, SubjectGradingScheme } from "@/types";

type SubjectGradingDialogProps = {
   open: boolean;
   subject: Subject | null;
   onOpenChange: (open: boolean) => void;
   onSave: (subjectId: string, gradingScheme: SubjectGradingScheme) => void;
};

export function SubjectGradingDialog({
   open,
   subject,
   onOpenChange,
   onSave,
}: SubjectGradingDialogProps) {
   const {
      draft,
      totalWeight,
      setScale,
      setPassingScore,
      setRounding,
      updateWeight,
      addRubric,
      removeRubric,
      addCriterion,
      updateRubric,
      updateCriterion,
      removeCriterion,
      handleSave,
   } = useSubjectGradingDialogState({
      open,
      subject,
      onOpenChange,
      onSave,
   });

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Calificación por materia</DialogTitle>
               <DialogDescription>
                  Configura escala, ponderaciones y rúbricas para {subject?.name ?? "la materia"}.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
               <SubjectGradingGeneralFields
                  scale={draft.scale}
                  passingScore={draft.passingScore}
                  rounding={draft.rounding}
                  onScaleChange={setScale}
                  onPassingScoreChange={setPassingScore}
                  onRoundingChange={setRounding}
               />

               <SubjectGradingWeightsFields
                  weights={draft.weights}
                  totalWeight={totalWeight}
                  onWeightChange={updateWeight}
               />

               <SubjectRubricsEditor
                  rubrics={draft.rubrics}
                  onAddRubric={addRubric}
                  onRemoveRubric={removeRubric}
                  onRubricNameChange={(rubricId, name) => updateRubric(rubricId, { name })}
                  onAddCriterion={addCriterion}
                  onCriterionNameChange={(rubric, criterionId, name) =>
                     updateCriterion(rubric, criterionId, { name })
                  }
                  onCriterionWeightChange={(rubric, criterionId, weight) =>
                     updateCriterion(rubric, criterionId, { weight: toNumber(weight) })
                  }
                  onRemoveCriterion={removeCriterion}
               />
            </div>

            <DialogFooter>
               <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onOpenChange(false)}
               >
                  Cancelar
               </Button>
               <Button
                  size="sm"
                  className="text-xs"
                  onClick={handleSave}
                  disabled={!subject || totalWeight !== 100}
               >
                  Guardar configuración
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
