export const weekDays = [
   { value: 1, label: "Lunes" },
   { value: 2, label: "Martes" },
   { value: 3, label: "Miercoles" },
   { value: 4, label: "Jueves" },
   { value: 5, label: "Viernes" },
   { value: 6, label: "Sabado" },
   { value: 0, label: "Domingo" },
];

export type SlotInput = {
   id: string;
   dayOfWeek: number;
   time: string;
   blockCount: number;
};

export function createSlot(dayOfWeek = 1, time = "08:00", blockCount = 1): SlotInput {
   return {
      id: `slot-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      dayOfWeek,
      time,
      blockCount,
   };
}

export function todayDate() {
   const now = new Date();
   const yyyy = now.getFullYear();
   const mm = String(now.getMonth() + 1).padStart(2, "0");
   const dd = String(now.getDate()).padStart(2, "0");
   return `${yyyy}-${mm}-${dd}`;
}

export function addDays(dateStr: string, days: number) {
   const date = new Date(`${dateStr}T12:00:00`);
   date.setDate(date.getDate() + days);
   const yyyy = date.getFullYear();
   const mm = String(date.getMonth() + 1).padStart(2, "0");
   const dd = String(date.getDate()).padStart(2, "0");
   return `${yyyy}-${mm}-${dd}`;
}

export function normalizeSlotsForSchedule(slots: SlotInput[]) {
   const uniqueSlotsMap = new Map<
      string,
      { dayOfWeek: number; time: string; blockCount: number }
   >();

   slots.forEach((slot) => {
      uniqueSlotsMap.set(`${slot.dayOfWeek}-${slot.time}-${slot.blockCount}`, {
         dayOfWeek: slot.dayOfWeek,
         time: slot.time,
         blockCount: slot.blockCount,
      });
   });

   return Array.from(uniqueSlotsMap.values());
}

export function adjustSlotBlockCount(current: number, delta: number) {
   return Math.max(1, Math.min(3, current + delta));
}
