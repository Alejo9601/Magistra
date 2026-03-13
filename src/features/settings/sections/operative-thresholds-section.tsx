import { useEffect, useState } from "react";
import { AlertOctagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   DEFAULT_THRESHOLDS,
   getThresholdsForInstitution,
   type OperativeThresholds,
} from "@/features/dashboard/constants";
import { saveInstitutionOperativeThresholds } from "@/features/dashboard/services";
import { useInstitutionContext } from "@/features/institution";
import { getInstitutionById } from "@/lib/edu-repository";
import { toast } from "sonner";

type ThresholdForm = {
   atRiskPctWarning: string;
   atRiskPctCritical: string;
   pendingWarning: string;
   pendingCritical: string;
   unplannedPctWarning: string;
   unplannedPctCritical: string;
   unplannedClassCriticalHours: string;
};

function toFormValues(thresholds: OperativeThresholds): ThresholdForm {
   return {
      atRiskPctWarning: String(thresholds.atRiskPctWarning),
      atRiskPctCritical: String(thresholds.atRiskPctCritical),
      pendingWarning: String(thresholds.pendingWarning),
      pendingCritical: String(thresholds.pendingCritical),
      unplannedPctWarning: String(thresholds.unplannedPctWarning),
      unplannedPctCritical: String(thresholds.unplannedPctCritical),
      unplannedClassCriticalHours: String(thresholds.unplannedClassCriticalHours),
   };
}

function parsePositiveInteger(input: string) {
   const parsed = Number(input);
   if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
   }
   return Math.round(parsed);
}

function RangeField({
   title,
   description,
   unit,
   warningValue,
   criticalValue,
   onWarningChange,
   onCriticalChange,
}: {
   title: string;
   description: string;
   unit: string;
   warningValue: string;
   criticalValue: string;
   onWarningChange: (value: string) => void;
   onCriticalChange: (value: string) => void;
}) {
   return (
      <div className="rounded-lg border border-border/70 p-3">
         <p className="text-xs font-semibold text-foreground">{title}</p>
         <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
         <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
               <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Alerta
               </label>
               <div className="relative">
                  <Input
                     className="h-8 pr-10 text-xs"
                     type="number"
                     min="0"
                     value={warningValue}
                     onChange={(event) => onWarningChange(event.target.value)}
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                     {unit}
                  </span>
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Critico
               </label>
               <div className="relative">
                  <Input
                     className="h-8 pr-10 text-xs"
                     type="number"
                     min="0"
                     value={criticalValue}
                     onChange={(event) => onCriticalChange(event.target.value)}
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                     {unit}
                  </span>
               </div>
            </div>
         </div>
      </div>
   );
}

export function OperativeThresholdsSection() {
   const { activeInstitution } = useInstitutionContext();
   const activeInstitutionName = getInstitutionById(activeInstitution)?.name;
   const defaults = getThresholdsForInstitution(activeInstitution);
   const [form, setForm] = useState<ThresholdForm>(toFormValues(defaults));

   useEffect(() => {
      setForm(toFormValues(defaults));
   }, [activeInstitution]);

   const onReset = () => {
      setForm(toFormValues(DEFAULT_THRESHOLDS));
   };

   const onSave = () => {
      const nextThresholds = {
         atRiskPctWarning: parsePositiveInteger(form.atRiskPctWarning),
         atRiskPctCritical: parsePositiveInteger(form.atRiskPctCritical),
         pendingWarning: parsePositiveInteger(form.pendingWarning),
         pendingCritical: parsePositiveInteger(form.pendingCritical),
         unplannedPctWarning: parsePositiveInteger(form.unplannedPctWarning),
         unplannedPctCritical: parsePositiveInteger(form.unplannedPctCritical),
         unplannedClassCriticalHours: parsePositiveInteger(
            form.unplannedClassCriticalHours,
         ),
      };

      if (Object.values(nextThresholds).some((value) => value === null)) {
         toast.error("Usa valores numericos positivos validos.");
         return;
      }

      if (
         nextThresholds.atRiskPctWarning! >= nextThresholds.atRiskPctCritical! ||
         nextThresholds.pendingWarning! >= nextThresholds.pendingCritical! ||
         nextThresholds.unplannedPctWarning! >= nextThresholds.unplannedPctCritical!
      ) {
         toast.error("Los valores de alerta deben ser menores que los criticos.");
         return;
      }

      saveInstitutionOperativeThresholds(activeInstitution, {
         atRiskPctWarning: nextThresholds.atRiskPctWarning!,
         atRiskPctCritical: nextThresholds.atRiskPctCritical!,
         pendingWarning: nextThresholds.pendingWarning!,
         pendingCritical: nextThresholds.pendingCritical!,
         unplannedPctWarning: nextThresholds.unplannedPctWarning!,
         unplannedPctCritical: nextThresholds.unplannedPctCritical!,
         unplannedClassCriticalHours: nextThresholds.unplannedClassCriticalHours!,
      });
      toast.success("Reglas operativas guardadas.");
   };

   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
               <AlertOctagon className="size-4" />
               Reglas Operativas de Riesgo
            </CardTitle>
            <p className="text-xs text-muted-foreground">
               Configura alertas para: {activeInstitutionName ?? activeInstitution}
            </p>
         </CardHeader>
         <CardContent className="pt-0 space-y-3">
            <RangeField
               title="Alumnos en riesgo"
               description="Que porcentaje de alumnos en riesgo activa alerta y estado critico."
               unit="%"
               warningValue={form.atRiskPctWarning}
               criticalValue={form.atRiskPctCritical}
               onWarningChange={(value) =>
                  setForm((prev) => ({ ...prev, atRiskPctWarning: value }))
               }
               onCriticalChange={(value) =>
                  setForm((prev) => ({ ...prev, atRiskPctCritical: value }))
               }
            />

            <RangeField
               title="Tareas pendientes"
               description="Cantidad de tareas pendientes para pasar a alerta/critico."
               unit="cant"
               warningValue={form.pendingWarning}
               criticalValue={form.pendingCritical}
               onWarningChange={(value) =>
                  setForm((prev) => ({ ...prev, pendingWarning: value }))
               }
               onCriticalChange={(value) =>
                  setForm((prev) => ({ ...prev, pendingCritical: value }))
               }
            />

            <RangeField
               title="Clases sin planificar (proximos 7 dias)"
               description="Porcentaje de clases sin planificar que escala el semaforo."
               unit="%"
               warningValue={form.unplannedPctWarning}
               criticalValue={form.unplannedPctCritical}
               onWarningChange={(value) =>
                  setForm((prev) => ({ ...prev, unplannedPctWarning: value }))
               }
               onCriticalChange={(value) =>
                  setForm((prev) => ({ ...prev, unplannedPctCritical: value }))
               }
            />

            <div className="rounded-lg border border-border/70 p-3">
               <p className="text-xs font-semibold text-foreground">
                  Temporizador critico para clase sin planificar
               </p>
               <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Si una clase sin planificar inicia en esta ventana o menos, pasa a critico.
               </p>
               <div className="mt-2 max-w-[220px] relative">
                  <Input
                     className="h-8 pr-14 text-xs"
                     type="number"
                     min="1"
                     value={form.unplannedClassCriticalHours}
                     onChange={(event) =>
                        setForm((prev) => ({
                           ...prev,
                           unplannedClassCriticalHours: event.target.value,
                        }))
                     }
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                     horas
                  </span>
               </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
               <Button size="sm" className="text-xs" onClick={onSave}>
                  Guardar reglas
               </Button>
               <Button variant="outline" size="sm" className="text-xs" onClick={onReset}>
                  Usar predeterminadas
               </Button>
            </div>
         </CardContent>
      </Card>
   );
}

