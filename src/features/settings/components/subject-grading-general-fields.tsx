import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import type { SubjectGradingScheme } from "@/types";

type SubjectGradingGeneralFieldsProps = {
   scale: SubjectGradingScheme["scale"];
   passingScore: number;
   rounding: SubjectGradingScheme["rounding"];
   onScaleChange: (value: SubjectGradingScheme["scale"]) => void;
   onPassingScoreChange: (value: string) => void;
   onRoundingChange: (value: SubjectGradingScheme["rounding"]) => void;
};

export function SubjectGradingGeneralFields({
   scale,
   passingScore,
   rounding,
   onScaleChange,
   onPassingScoreChange,
   onRoundingChange,
}: SubjectGradingGeneralFieldsProps) {
   return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
         <div className="space-y-1.5">
            <Label className="text-xs">Escala</Label>
            <Select
               value={scale}
               onValueChange={(value) => onScaleChange(value as SubjectGradingScheme["scale"])}
            >
               <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="numeric-10">Numérica 1-10</SelectItem>
                  <SelectItem value="numeric-100">Numérica 0-100</SelectItem>
               </SelectContent>
            </Select>
         </div>

         <div className="space-y-1.5">
            <Label className="text-xs">Nota mínima</Label>
            <Input
               className="h-9 text-xs"
               type="number"
               min={1}
               max={scale === "numeric-100" ? 100 : 10}
               step={scale === "numeric-100" ? 1 : 0.1}
               value={passingScore}
               onChange={(event) => onPassingScoreChange(event.target.value)}
            />
         </div>

         <div className="space-y-1.5">
            <Label className="text-xs">Redondeo</Label>
            <Select
               value={rounding}
               onValueChange={(value) => onRoundingChange(value as SubjectGradingScheme["rounding"])}
            >
               <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="nearest">Al más cercano</SelectItem>
                  <SelectItem value="up">Siempre hacia arriba</SelectItem>
                  <SelectItem value="none">Sin redondeo</SelectItem>
               </SelectContent>
            </Select>
         </div>
      </div>
   );
}
