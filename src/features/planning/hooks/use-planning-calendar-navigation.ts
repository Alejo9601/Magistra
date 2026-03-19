import { useRef, useState, type TouchEvent } from "react";

export function usePlanningCalendarNavigation(initialDate: Date) {
   const swipeStartXRef = useRef<number | null>(null);
   const [month, setMonth] = useState(initialDate.getMonth());
   const [year, setYear] = useState(initialDate.getFullYear());

   const goToAdjacentMonth = (delta: -1 | 1) => {
      setMonth((currentMonth) => {
         if (delta === -1 && currentMonth === 0) {
            setYear((currentYear) => currentYear - 1);
            return 11;
         }
         if (delta === 1 && currentMonth === 11) {
            setYear((currentYear) => currentYear + 1);
            return 0;
         }
         return currentMonth + delta;
      });
   };

   const handleCalendarTouchStart = (event: TouchEvent<HTMLDivElement>) => {
      swipeStartXRef.current = event.touches[0]?.clientX ?? null;
   };

   const handleCalendarTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
      const startX = swipeStartXRef.current;
      swipeStartXRef.current = null;
      if (startX === null) {
         return;
      }
      const endX = event.changedTouches[0]?.clientX;
      if (typeof endX !== "number") {
         return;
      }
      const deltaX = endX - startX;
      if (Math.abs(deltaX) < 40) {
         return;
      }
      goToAdjacentMonth(deltaX > 0 ? -1 : 1);
   };

   return {
      month,
      year,
      goToAdjacentMonth,
      handleCalendarTouchStart,
      handleCalendarTouchEnd,
   };
}
