import { describe, expect, it } from "vitest";
import {
   resolveAssignmentIdForInstitution,
   resolveInstitutionId,
} from "@/features/planning/utils/institution-context-guards";

const assignments = [
   { id: "a1", institutionId: "inst-a" },
   { id: "a2", institutionId: "inst-a" },
   { id: "b1", institutionId: "inst-b" },
];

const getAssignmentById = (assignmentId: string) =>
   assignments.find((assignment) => assignment.id === assignmentId) ?? null;

describe("resolveInstitutionId", () => {
   it("uses active institution when initial is undefined", () => {
      expect(resolveInstitutionId("inst-a")).toBe("inst-a");
   });

   it("uses initial institution when provided", () => {
      expect(resolveInstitutionId("inst-a", "inst-b")).toBe("inst-b");
   });

   it("falls back when active institution scope is all", () => {
      expect(resolveInstitutionId("all", undefined, "inst-a")).toBe("inst-a");
   });

   it("returns empty string when scope is all and fallback is unavailable", () => {
      expect(resolveInstitutionId("all")).toBe("");
   });
});

describe("resolveAssignmentIdForInstitution", () => {
   it("falls back to first assignment when candidate is missing", () => {
      expect(
         resolveAssignmentIdForInstitution({
            institutionId: "inst-a",
            candidateAssignmentId: undefined,
            assignmentsByInstitution: assignments.filter(
               (assignment) => assignment.institutionId === "inst-a",
            ),
            getAssignmentById,
         }),
      ).toBe("a1");
   });

   it("keeps candidate when it belongs to the same institution", () => {
      expect(
         resolveAssignmentIdForInstitution({
            institutionId: "inst-a",
            candidateAssignmentId: "a2",
            assignmentsByInstitution: assignments.filter(
               (assignment) => assignment.institutionId === "inst-a",
            ),
            getAssignmentById,
         }),
      ).toBe("a2");
   });

   it("falls back when candidate belongs to another institution", () => {
      expect(
         resolveAssignmentIdForInstitution({
            institutionId: "inst-a",
            candidateAssignmentId: "b1",
            assignmentsByInstitution: assignments.filter(
               (assignment) => assignment.institutionId === "inst-a",
            ),
            getAssignmentById,
         }),
      ).toBe("a1");
   });

   it("falls back when candidate does not exist", () => {
      expect(
         resolveAssignmentIdForInstitution({
            institutionId: "inst-a",
            candidateAssignmentId: "unknown",
            assignmentsByInstitution: assignments.filter(
               (assignment) => assignment.institutionId === "inst-a",
            ),
            getAssignmentById,
         }),
      ).toBe("a1");
   });

   it("returns empty string when institution has no assignments", () => {
      expect(
         resolveAssignmentIdForInstitution({
            institutionId: "inst-c",
            candidateAssignmentId: "a1",
            assignmentsByInstitution: [],
            getAssignmentById,
         }),
      ).toBe("");
   });
});
