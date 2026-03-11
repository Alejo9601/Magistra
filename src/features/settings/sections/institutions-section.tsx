import { useMemo, useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogDescription,
} from "@/components/ui/dialog";
import {
   createInstitution,
   deleteInstitution,
   getAssignmentIdBySubjectId,
   institutions,
   subjects,
} from "@/lib/edu-repository";
import { usePlanningContext } from "@/features/planning";
import { useClassroomContext } from "@/features/classroom";
import { useStudentsContext } from "@/features/students";
import { useAssessmentsContext } from "@/features/assessments";
import { useActivitiesContext } from "@/features/activities";
import { useInstitutionContext } from "@/features/institution";
import { toast } from "sonner";

const colorOptions = [
   "#4F46E5",
   "#0891B2",
   "#059669",
   "#D97706",
   "#DC2626",
   "#7C3AED",
];

const levelOptions = [
   "Primaria",
   "Secundaria",
   "Terciaria",
   "Universidad",
   "Otro",
] as const;

export function InstitutionsSection() {
   const { activeInstitution, setActiveInstitution } = useInstitutionContext();
   const { removeClassesByAssignment } = usePlanningContext();
   const { removeRecordsByClassIds } = useClassroomContext();
   const { unlinkSubjectFromStudents } = useStudentsContext();
   const { removeAssessmentsByAssignment } = useAssessmentsContext();
   const { removeActivitiesByAssignment } = useActivitiesContext();

   const [revision, setRevision] = useState(0);
   const [addOpen, setAddOpen] = useState(false);
   const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
   const [name, setName] = useState("");
   const [address, setAddress] = useState("");
   const [level, setLevel] = useState<(typeof levelOptions)[number]>("Secundaria");

   const institutionList = useMemo(() => institutions, [revision]);

   const resetForm = () => {
      setName("");
      setAddress("");
      setLevel("Secundaria");
      setSelectedColor(colorOptions[0]);
   };

   const handleCreate = () => {
      if (!name.trim() || !address.trim()) {
         toast.error("Complete institution name and address.");
         return;
      }

      createInstitution({
         name,
         address,
         level,
         color: selectedColor,
      });

      setRevision((prev) => prev + 1);
      setAddOpen(false);
      resetForm();
      toast.success("Institution created successfully.");
   };

   const handleDelete = (institutionId: string) => {
      if (institutions.length <= 1) {
         toast.error("At least one institution must remain.");
         return;
      }

      const scopedSubjectIds = subjects
         .filter((subject) => subject.institutionId === institutionId)
         .map((subject) => subject.id);

      scopedSubjectIds.forEach((subjectId) => {
         const assignmentId = getAssignmentIdBySubjectId(subjectId);
         const removedClassIds = removeClassesByAssignment(assignmentId);

         removeRecordsByClassIds(removedClassIds);
         removeAssessmentsByAssignment(assignmentId);
         removeActivitiesByAssignment(assignmentId);
         unlinkSubjectFromStudents(subjectId);
      });

      const deleted = deleteInstitution(institutionId);
      if (!deleted) {
         toast.error("Institution could not be deleted.");
         return;
      }

      if (activeInstitution === institutionId) {
         setActiveInstitution(institutions[0].id);
      }

      setRevision((prev) => prev + 1);
      toast.success("Institution deleted with related data.");
   };

   return (
      <>
         <Card>
            <CardHeader className="pb-3">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <Building2 className="size-4" />
                     Institutions
                  </CardTitle>
                  <Button
                     variant="outline"
                     size="sm"
                     className="text-xs"
                     onClick={() => setAddOpen(true)}
                  >
                     <Plus className="size-3.5 mr-1.5" />
                     Add institution
                  </Button>
               </div>
            </CardHeader>
            <CardContent className="pt-0">
               <div className="flex flex-col gap-3">
                  {institutionList.map((inst) => (
                     <div
                        key={inst.id}
                        className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                     >
                        <div
                           className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                           style={{ backgroundColor: inst.color + "15" }}
                        >
                           <Building2
                              className="size-5"
                              style={{ color: inst.color }}
                           />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-semibold text-foreground">
                              {inst.name}
                           </p>
                           <p className="text-[10px] text-muted-foreground">
                              {inst.address}
                           </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                           {inst.level}
                        </Badge>
                        <div
                           className="size-4 rounded-full"
                           style={{ backgroundColor: inst.color }}
                        />
                        <Button
                           variant="ghost"
                           size="icon"
                           className="size-7"
                           onClick={() => handleDelete(inst.id)}
                           title="Delete institution"
                        >
                           <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                     </div>
                  ))}
               </div>
            </CardContent>
         </Card>

         <Dialog
            open={addOpen}
            onOpenChange={(open) => {
               setAddOpen(open);
               if (!open) {
                  resetForm();
               }
            }}
         >
            <DialogContent className="sm:max-w-[420px]">
               <DialogHeader>
                  <DialogTitle>Add Institution</DialogTitle>
                  <DialogDescription>
                     Link a new institution to your profile.
                  </DialogDescription>
               </DialogHeader>
               <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Institution name</Label>
                     <Input
                        className="h-9 text-xs"
                        placeholder="Ex: Colegio Nacional Buenos Aires"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Address</Label>
                     <Input
                        className="h-9 text-xs"
                        placeholder="Ex: Av. San Martin 123"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Education level</Label>
                     <div className="flex flex-wrap gap-2">
                        {levelOptions.map((candidateLevel) => (
                           <button
                              key={candidateLevel}
                              onClick={() => setLevel(candidateLevel)}
                              className="px-3 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                              data-active={level === candidateLevel}
                           >
                              {candidateLevel}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Identifier color</Label>
                     <div className="flex gap-2">
                        {colorOptions.map((color) => (
                           <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`size-8 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-offset-2 ring-foreground" : "hover:scale-110"}`}
                              style={{ backgroundColor: color }}
                           />
                        ))}
                     </div>
                  </div>
               </div>
               <DialogFooter>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setAddOpen(false)}
                     className="text-xs"
                  >
                     Cancel
                  </Button>
                  <Button size="sm" className="text-xs" onClick={handleCreate}>
                     Save
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </>
   );
}
