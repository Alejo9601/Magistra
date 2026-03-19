import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClassEditorResourcesField({
   value,
   onChange,
}: {
   value: string;
   onChange: (value: string) => void;
}) {
   return (
      <div className="flex flex-col gap-4 pb-2">
         <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Recursos (coma separada)</Label>
            <Input
               className="h-9 text-xs"
               value={value}
               onChange={(event) => onChange(event.target.value)}
            />
         </div>
      </div>
   );
}
