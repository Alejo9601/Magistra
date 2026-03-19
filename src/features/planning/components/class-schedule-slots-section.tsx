import { Minus, Plus, Trash2 } from "lucide-react";
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

export function ClassScheduleSlotsSection({
   selectedBlockDuration,
   slots,
   onAddSlot,
   onUpdateSlot,
   onAdjustBlockCount,
   onRequestDeleteSlot,
}: {
   selectedBlockDuration: number;
   slots: SlotInput[];
   onAddSlot: () => void;
   onUpdateSlot: (slotId: string, updates: Partial<SlotInput>) => void;
   onAdjustBlockCount: (slotId: string, delta: number) => void;
   onRequestDeleteSlot: (slotId: string) => void;
}) {
   return (
      <div className="rounded-lg border border-border/70 p-3">
         <div className="mb-2 flex items-center justify-between">
            <div className="flex flex-col">
               <span className="text-xs font-medium">
                  Horarios semanales (dia + hora + cantidad de bloques)
               </span>
               <span className="text-[11px] text-muted-foreground">
                  1 bloque = {selectedBlockDuration} min
               </span>
            </div>
            <Button
               type="button"
               variant="outline"
               size="sm"
               className="h-7 text-[11px]"
               onClick={onAddSlot}
            >
               <Plus className="size-3.5 mr-1" />
               Agregar horario
            </Button>
         </div>

         <div className="space-y-2">
            {slots.map((slot) => (
               <div
                  key={slot.id}
                  className="grid grid-cols-[minmax(0,1fr)_120px_140px_36px] gap-2"
               >
                  <Select
                     value={String(slot.dayOfWeek)}
                     onValueChange={(value) =>
                        onUpdateSlot(slot.id, { dayOfWeek: Number(value) })
                     }
                  >
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Dia" />
                     </SelectTrigger>
                     <SelectContent>
                        {weekDays.map((day) => (
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

                  <div className="flex items-center justify-between gap-1 rounded-md border border-input px-2">
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onAdjustBlockCount(slot.id, -1)}
                     >
                        <Minus className="size-3.5" />
                     </Button>
                     <span className="text-xs font-medium">
                        {slot.blockCount} bloque{slot.blockCount > 1 ? "s" : ""} de {selectedBlockDuration} min
                     </span>
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onAdjustBlockCount(slot.id, 1)}
                     >
                        <Plus className="size-3.5" />
                     </Button>
                  </div>

                  <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     className="size-9"
                     onClick={() => onRequestDeleteSlot(slot.id)}
                     disabled={slots.length === 1}
                  >
                     <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
               </div>
            ))}
         </div>
      </div>
   );
}
