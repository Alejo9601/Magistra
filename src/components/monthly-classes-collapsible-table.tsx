import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
   Table,
   TableBody,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import type { ClassSession } from "@/types";

type MonthGroup = {
   key: string;
   label: string;
   classes: ClassSession[];
};

type Column = {
   label: string;
   className?: string;
};

export function MonthlyClassesCollapsibleTable({
   classes,
   emptyMessage,
   columns,
   renderCells,
   tableClassName = "min-w-[560px]",
}: {
   classes: ClassSession[];
   emptyMessage: string;
   columns: Column[];
   renderCells: (classSession: ClassSession) => ReactNode;
   tableClassName?: string;
}) {
   const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

   const classesByMonth = useMemo(() => {
      const sorted = [...classes].sort((a, b) =>
         `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      );
      const monthMap = new Map<string, MonthGroup>();

      sorted.forEach((classSession) => {
         const [year, month] = classSession.date.split("-").slice(0, 2);
         const key = `${year}-${month}`;
         if (!monthMap.has(key)) {
            const date = new Date(`${classSession.date}T12:00:00`);
            monthMap.set(key, {
               key,
               label: date.toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
               }),
               classes: [],
            });
         }
         monthMap.get(key)?.classes.push(classSession);
      });

      return Array.from(monthMap.values());
   }, [classes]);

   const monthKeySignature = useMemo(
      () => classesByMonth.map((monthGroup) => monthGroup.key).join("|"),
      [classesByMonth],
   );

   useEffect(() => {
      setOpenMonths((prev) => {
         const next: Record<string, boolean> = {};
         classesByMonth.forEach((monthGroup) => {
            next[monthGroup.key] = prev[monthGroup.key] ?? false;
         });
         return next;
      });
   }, [classesByMonth, monthKeySignature]);

   const isMonthOpen = (monthKey: string) => openMonths[monthKey] ?? false;

   if (classesByMonth.length === 0) {
      return (
         <Card className="mt-2">
            <CardContent className="py-8 text-center">
               <p className="text-xs text-muted-foreground">{emptyMessage}</p>
            </CardContent>
         </Card>
      );
   }

   return (
      <div className="mt-2 space-y-3">
         {classesByMonth.map((monthGroup) => (
            <Card
               key={monthGroup.key}
               className="overflow-hidden border-border/70 py-2 gap-2"
            >
               <Collapsible
                  open={isMonthOpen(monthGroup.key)}
                  onOpenChange={(open) =>
                     setOpenMonths((prev) => ({
                        ...prev,
                        [monthGroup.key]: open,
                     }))
                  }
               >
                  <CollapsibleTrigger asChild>
                     <button
                        type="button"
                        className={`group flex w-full items-center justify-between px-3.5 py-2 text-left transition-colors ${
                           isMonthOpen(monthGroup.key)
                              ? "bg-muted/30 border-b border-border/70"
                              : "bg-card hover:bg-muted/20"
                        }`}
                     >
                        <div className="flex items-center gap-2.5">
                           <ChevronRight
                              className={`size-4 text-muted-foreground transition-transform duration-200 ${
                                 isMonthOpen(monthGroup.key)
                                    ? "rotate-90 text-foreground"
                                    : ""
                              }`}
                           />
                           <p className="text-xs font-semibold text-foreground capitalize tracking-wide">
                              {monthGroup.label}
                           </p>
                        </div>
                        <Badge
                           variant="secondary"
                           className="text-[10px] rounded-full px-2.5 bg-primary/10 text-primary"
                        >
                           {monthGroup.classes.length} clases
                        </Badge>
                     </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                     <CardContent className="p-0.5 bg-background">
                        <Table className={tableClassName}>
                           <TableHeader>
                              <TableRow>
                                 {columns.map((column) => (
                                    <TableHead
                                       key={column.label}
                                       className={column.className ?? "text-xs"}
                                    >
                                       {column.label}
                                    </TableHead>
                                 ))}
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {monthGroup.classes.map((classSession) => (
                                 <TableRow
                                    key={classSession.id}
                                    className="hover:bg-muted/30"
                                 >
                                    {renderCells(classSession)}
                                 </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </CardContent>
                  </CollapsibleContent>
               </Collapsible>
            </Card>
         ))}
      </div>
   );
}
