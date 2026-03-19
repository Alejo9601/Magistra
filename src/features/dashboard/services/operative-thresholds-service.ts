import type { OperativeThresholds } from "@/features/dashboard/types";
import { storageKeys } from "@/services/app-data-bootstrap-service";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";

type ThresholdOverridesByInstitution = Record<string, Partial<OperativeThresholds>>;

function sanitizeThresholdOverrides(raw: unknown): ThresholdOverridesByInstitution | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }

   const output: ThresholdOverridesByInstitution = {};
   Object.entries(raw as Record<string, unknown>).forEach(([institutionId, value]) => {
      if (!value || typeof value !== "object") {
         return;
      }
      const candidate = value as Partial<OperativeThresholds>;
      const sanitized: Partial<OperativeThresholds> = {};

      if (typeof candidate.atRiskPctWarning === "number") {
         sanitized.atRiskPctWarning = candidate.atRiskPctWarning;
      }
      if (typeof candidate.atRiskPctCritical === "number") {
         sanitized.atRiskPctCritical = candidate.atRiskPctCritical;
      }
      if (typeof candidate.pendingWarning === "number") {
         sanitized.pendingWarning = candidate.pendingWarning;
      }
      if (typeof candidate.pendingCritical === "number") {
         sanitized.pendingCritical = candidate.pendingCritical;
      }
      if (typeof candidate.unplannedPctWarning === "number") {
         sanitized.unplannedPctWarning = candidate.unplannedPctWarning;
      }
      if (typeof candidate.unplannedPctCritical === "number") {
         sanitized.unplannedPctCritical = candidate.unplannedPctCritical;
      }
      if (typeof candidate.unplannedClassCriticalHours === "number") {
         sanitized.unplannedClassCriticalHours = candidate.unplannedClassCriticalHours;
      }

      if (Object.keys(sanitized).length > 0) {
         output[institutionId] = sanitized;
      }
   });

   return output;
}

export function loadOperativeThresholdOverrides() {
   return readJsonFromStorage<ThresholdOverridesByInstitution>(
      storageKeys.dashboardThresholds,
      {},
      sanitizeThresholdOverrides,
   );
}

export function saveOperativeThresholdOverrides(
   overrides: ThresholdOverridesByInstitution,
) {
   writeJsonToStorage(storageKeys.dashboardThresholds, overrides);
}

export function saveInstitutionOperativeThresholds(
   institutionId: string,
   thresholds: Partial<OperativeThresholds>,
) {
   const current = loadOperativeThresholdOverrides();
   const next: ThresholdOverridesByInstitution = {
      ...current,
      [institutionId]: thresholds,
   };
   saveOperativeThresholdOverrides(next);
}


