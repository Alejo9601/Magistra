import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export function ClassEditorFooterActions({
   onClose,
   onSaveDraft,
   onPublish,
}: {
   onClose: () => void;
   onSaveDraft: () => void;
   onPublish: () => void;
}) {
   return (
      <DialogFooter className="gap-2">
         <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            Cancelar
         </Button>
         <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={onSaveDraft}
         >
            Guardar borrador
         </Button>
         <Button size="sm" className="text-xs" onClick={onPublish}>
            Guardar y publicar
         </Button>
      </DialogFooter>
   );
}
