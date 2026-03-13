import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
   defaultOpen = false,
   persistKey,
   showBulkActions = false,
   renderMonthMeta,
   isMobile = false,
   renderMobileItem,
   emptyAction,
}: {
   classes: ClassSession[];
   emptyMessage: string;
   columns: Column[];
   renderCells: (classSession: ClassSession) => ReactNode;
   tableClassName?: string;
   defaultOpen?: boolean;
   persistKey?: string;
   showBulkActions?: boolean;
   renderMonthMeta?: (monthClasses: ClassSession[]) => ReactNode;
   isMobile?: boolean;
   renderMobileItem?: (classSession: ClassSession) => ReactNode;
   emptyAction?: ReactNode;
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
      if (typeof window === "undefined" || !persistKey) {
         return;
      }
      try {
         const raw = window.localStorage.getItem(persistKey);
         if (!raw) {
            return;
         }
         const parsed = JSON.parse(raw) as Record<string, boolean>;
         if (!parsed || typeof parsed !== "object") {
            return;
         }
         setOpenMonths((prev) => ({ ...parsed, ...prev }));
      } catch {
         // ignore invalid persisted values
      }
   }, [persistKey]);

   useEffect(() => {
      setOpenMonths((prev) => {
         const next: Record<string, boolean> = {};
         classesByMonth.forEach((monthGroup) => {
            next[monthGroup.key] = prev[monthGroup.key] ?? defaultOpen;
         });
         return next;
      });
   }, [classesByMonth, defaultOpen, monthKeySignature]);

   useEffect(() => {
      if (typeof window === "undefined" || !persistKey) {
         return;
      }
      try {
         window.localStorage.setItem(persistKey, JSON.stringify(openMonths));
      } catch {
         // ignore storage write errors
      }
   }, [openMonths, persistKey]);

   const isMonthOpen = (monthKey: string) => openMonths[monthKey] ?? defaultOpen;
   const setAllMonthsOpenState = (open: boolean) => {
      setOpenMonths(
         Object.fromEntries(classesByMonth.map((monthGroup) => [monthGroup.key, open])),
      );
   };

   if (classesByMonth.length === 0) {
      return (
         <Card className="mt-2">
            <CardContent className="py-8 text-center">
               <p className="text-xs text-muted-foreground">{emptyMessage}</p>
               {emptyAction ? <div className="mt-3">{emptyAction}</div> : null}
            </CardContent>
         </Card>
      );
   }

   return (
      <div className="mt-2 space-y-3">
         {showBulkActions ? (
            <div className="flex flex-wrap items-center gap-2">
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setAllMonthsOpenState(true)}
               >
                  Expandir todo
               </Button>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setAllMonthsOpenState(false)}
               >
                  Colapsar todo
               </Button>
            </div>
         ) : null}

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
                           {renderMonthMeta ? (
                              <div className="hidden sm:flex items-center gap-1.5">
                                 {renderMonthMeta(monthGroup.classes)}
                              </div>
                           ) : null}
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Badge
                              variant="secondary"
                              className="text-[10px] rounded-full px-2.5 bg-primary/10 text-primary"
                           >
                              {monthGroup.classes.length} clases
                           </Badge>
                        </div>
                     </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                     <CardContent className="p-0.5 bg-background">
                        {isMobile && renderMobileItem ? (
                           <div className="space-y-2 p-2">
                              {monthGroup.classes.map((classSession) => (
                                 <div key={classSession.id}>{renderMobileItem(classSession)}</div>
                              ))}
                           </div>
                        ) : (
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
                        )}
                     </CardContent>
                  </CollapsibleContent>
               </Collapsible>
            </Card>
         ))}
      </div>
   );
}
