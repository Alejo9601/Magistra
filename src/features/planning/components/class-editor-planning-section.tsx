import { BlockPlanningHeader } from "@/features/planning/components/block-planning-header";
import { ClassPlanningBlockEditor } from "@/features/planning/components/class-planning-block-editor";
import { PlanningModeToggle } from "@/features/planning/components/planning-mode-toggle";
import type { ClassBlock, ClassSession } from "@/types";

type ClassCharacterOption = {
   value: ClassSession["type"];
   label: string;
};

type EvaluativeFormatOption = {
   value: NonNullable<ClassSession["evaluativeFormat"]>;
   label: string;
};

export function ClassEditorPlanningSection({
   blockDurationMinutes,
   planBlocksSeparately,
   blocks,
   classCharacterOptions,
   evaluativeFormatOptions,
   onPlanModeChange,
   onUpdateBlock,
}: {
   blockDurationMinutes: number;
   planBlocksSeparately: boolean;
   blocks: ClassBlock[];
   classCharacterOptions: ClassCharacterOption[];
   evaluativeFormatOptions: EvaluativeFormatOption[];
   onPlanModeChange: (enabled: boolean) => void;
   onUpdateBlock: (order: number, updates: Partial<ClassBlock>) => void;
}) {
   return (
      <div className="space-y-3">
         <BlockPlanningHeader blockDurationMinutes={blockDurationMinutes} />
         <PlanningModeToggle
            planBlocksSeparately={planBlocksSeparately}
            onChange={onPlanModeChange}
         />

         <div className="space-y-3">
            {(planBlocksSeparately ? blocks : blocks.slice(0, 1)).map((block) => (
               <ClassPlanningBlockEditor
                  key={block.order}
                  block={block}
                  planBlocksSeparately={planBlocksSeparately}
                  classCharacterOptions={classCharacterOptions}
                  evaluativeFormatOptions={evaluativeFormatOptions}
                  onUpdateBlock={onUpdateBlock}
               />
            ))}
         </div>
      </div>
   );
}
