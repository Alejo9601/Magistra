import type { ClassSession } from "@/lib/edu-repository";

export type ViewMode = "calendar" | "list";
export type StatusFilter = "all" | ClassSession["status"];
export type TypeFilter = "all" | ClassSession["type"];
export type ClassFormInput = Omit<ClassSession, "id">;
