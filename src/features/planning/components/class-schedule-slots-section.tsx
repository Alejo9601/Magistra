import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { weekDays, type SlotInput } from "@/features/planning/utils/class-schedule-utils";

const weekDaysForSchedule = weekDays.filter((day) => day.value >= 1 && day.value <= 5);
const blockOptions = [1, 2, 3];

export function ClassScheduleSlotsSection({
   selectedBlockDuration,
   slots,
   onAddSlot,
   onUpdateSlot,
   onRemoveSlot,
   focusSlotId,
   onFocusSlotHandled,
}: {
   selectedBlockDuration: number;
   slots: SlotInput[];
   onAddSlot: () => void;
   onUpdateSlot: (slotId: string, updates: Partial<SlotInput>) => void;
   onRemoveSlot: (slotId: string) => void;
   focusSlotId?: string | null;
   onFocusSlotHandled?: () => void;
}) {
   const daySelectRefs = useRef<Record<string, HTMLButtonElement | null>>({});

   useEffect(() => {
      if (!focusSlotId) {
         return;
      }
      const element = daySelectRefs.current[focusSlotId];
      if (element) {
         element.focus();
      }
      onFocusSlotHandled?.();
   }, [focusSlotId, onFocusSlotHandled]);

   return (
      <div className="rounded-lg border border-border/70 p-3">
         <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium">Dias y horarios</span>
         </div>

         <div className="space-y-2">
            {slots.map((slot) => (
               <div
                  key={slot.id}
                  className="grid grid-cols-[minmax(0,1fr)_120px_140px_36px] items-center gap-2"
               >
                  <Select
                     value={String(slot.dayOfWeek)}
                     onValueChange={(value) =>
                        onUpdateSlot(slot.id, { dayOfWeek: Number(value) })
                     }
                  >
                     <SelectTrigger
                        ref={(element) => {
                           daySelectRefs.current[slot.id] = element;
                        }}
                        className="h-9 text-xs"
                     >
                        <SelectValue placeholder="Dia" />
                     </SelectTrigger>
                     <SelectContent>
                        {weekDaysForSchedule.map((day) => (
                           <SelectItem key={day.value} value={String(day.value)}>
                              {day.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>

                  <Input
                     type="time"
                     className="h-9 text-xs"
                     value={slot.time}
                     onChange={(event) =>
                        onUpdateSlot(slot.id, { time: event.target.value })
                     }
                  />

                  <Select
                     value={String(slot.blockCount)}
                     onValueChange={(value) =>
                        onUpdateSlot(slot.id, { blockCount: Number(value) })
                     }
                  >
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Bloques" />
                     </SelectTrigger>
                     <SelectContent>
                        {blockOptions.map((option) => (
                           <SelectItem key={option} value={String(option)}>
                              {option} bloque{option > 1 ? "s" : ""}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>

                  <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     className="size-9"
                     onClick={() => onRemoveSlot(slot.id)}
                     disabled={slots.length === 1}
                  >
                     <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
               </div>
            ))}
         </div>

         <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-8 px-2 text-xs"
            onClick={onAddSlot}
         >
            + Agregar otro dia
         </Button>

         <p className="mt-2 text-[11px] text-muted-foreground">
            1 bloque = {selectedBlockDuration} min
         </p>
      </div>
   );
}
