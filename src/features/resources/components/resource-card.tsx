import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSubjectById, getInstitutionById } from "@/lib/edu-repository";
import { fileTypeIcons } from "@/features/resources/utils";
import type { ContentItem } from "@/types";

export function ResourceCard({ item }: { item: ContentItem }) {
   const IconComp = fileTypeIcons[item.fileType] || FileText;
   const subject = getSubjectById(item.subjectId);
   const inst = getInstitutionById(item.institutionId);
   const dateObj = new Date(item.uploadDate + "T12:00:00");

   return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
         <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
               <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <IconComp className="size-5 text-muted-foreground" />
               </div>
               <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-foreground truncate">
                     {item.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                     {subject?.name} - {inst?.name}
                  </p>
               </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
               {item.description}
            </p>
            <div className="flex items-center justify-between">
               <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 2).map((tag) => (
                     <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                     </Badge>
                  ))}
               </div>
               <span className="text-[10px] text-muted-foreground">
                  {dateObj.toLocaleDateString("es-AR", {
                     day: "2-digit",
                     month: "short",
                  })}
               </span>
            </div>
         </CardContent>
      </Card>
   );
}



