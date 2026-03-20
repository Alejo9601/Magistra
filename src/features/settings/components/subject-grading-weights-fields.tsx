import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   WEIGHT_FIELDS,
   type WeightKey,
} from "@/features/settings/utils/subject-grading-dialog.utils";
import type { SubjectGradingScheme } from "@/types";

type SubjectGradingWeightsFieldsProps = {
   weights: SubjectGradingScheme["weights"];
   totalWeight: number;
   onWeightChange: (key: WeightKey, value: string) => void;
};

export function SubjectGradingWeightsFields({
   weights,
   totalWeight,
   onWeightChange,
}: SubjectGradingWeightsFieldsProps) {
   return (
      <div className="space-y-2">
         <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Ponderaciones (%)</p>
            <span
               className={`text-xs ${
                  totalWeight === 100 ? "text-success" : "text-warning-foreground"
               }`}
            >
               Total: {totalWeight}%
            </span>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WEIGHT_FIELDS.map((field) => (
               <div key={field.key} className="space-y-1">
                  <Label className="text-[11px]">{field.label}</Label>
                  <Input
                     className="h-8 text-xs"
                     type="number"
                     min={0}
                     value={weights[field.key]}
                     onChange={(event) => onWeightChange(field.key, event.target.value)}
                  />
               </div>
            ))}
         </div>
      </div>
   );
}
