import { useCallback, useState } from "react";
import type { ActivityType } from "@/types";

export function useClaseDictadoActivityState() {
   const [linkDialogOpen, setLinkDialogOpen] = useState(false);
   const [linkSearch, setLinkSearch] = useState("");
   const [selectedExistingActivityIds, setSelectedExistingActivityIds] = useState<string[]>([]);

   const [createDialogOpen, setCreateDialogOpen] = useState(false);
   const [newActivityTitle, setNewActivityTitle] = useState("");
   const [newActivityType, setNewActivityType] = useState<ActivityType>("practica");
   const [newActivityDescription, setNewActivityDescription] = useState("");
   const [newActivityEvaluable, setNewActivityEvaluable] = useState(false);

   const resetNewActivityForm = useCallback(() => {
      setNewActivityTitle("");
      setNewActivityType("practica");
      setNewActivityDescription("");
      setNewActivityEvaluable(false);
   }, []);

   const clearLinkSelection = useCallback(() => {
      setSelectedExistingActivityIds([]);
      setLinkSearch("");
   }, []);

   const handleToggleExistingSelection = useCallback((activityId: string) => {
      setSelectedExistingActivityIds((prev) =>
         prev.includes(activityId)
            ? prev.filter((id) => id !== activityId)
            : [...prev, activityId],
      );
   }, []);

   const handleCreateDialogOpenChange = useCallback(
      (open: boolean) => {
         setCreateDialogOpen(open);
         if (!open) {
            resetNewActivityForm();
         }
      },
      [resetNewActivityForm],
   );

   const handleLinkDialogOpenChange = useCallback(
      (open: boolean) => {
         setLinkDialogOpen(open);
         if (!open) {
            clearLinkSelection();
         }
      },
      [clearLinkSelection],
   );

   const openCreateDialog = useCallback(() => setCreateDialogOpen(true), []);
   const closeCreateDialog = useCallback(() => setCreateDialogOpen(false), []);
   const openLinkDialog = useCallback(() => setLinkDialogOpen(true), []);
   const closeLinkDialog = useCallback(() => setLinkDialogOpen(false), []);

   return {
      linkDialogOpen,
      linkSearch,
      selectedExistingActivityIds,
      createDialogOpen,
      newActivityTitle,
      newActivityType,
      newActivityDescription,
      newActivityEvaluable,
      setLinkSearch,
      setNewActivityTitle,
      setNewActivityType,
      setNewActivityDescription,
      setNewActivityEvaluable,
      resetNewActivityForm,
      clearLinkSelection,
      handleToggleExistingSelection,
      handleCreateDialogOpenChange,
      handleLinkDialogOpenChange,
      openCreateDialog,
      closeCreateDialog,
      openLinkDialog,
      closeLinkDialog,
   };
}
