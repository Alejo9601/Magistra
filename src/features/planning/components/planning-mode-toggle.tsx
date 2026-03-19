import { Checkbox } from "@/components/ui/checkbox";

export function PlanningModeToggle({
   planBlocksSeparately,
   onChange,
}: {
   planBlocksSeparately: boolean;
   onChange: (enabled: boolean) => void;
}) {
   return (
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
         <Checkbox
            checked={planBlocksSeparately}
            onCheckedChange={(checked) => onChange(checked === true)}
         />
         <span>Planificar bloques por separado</span>
      </label>
   );
}
