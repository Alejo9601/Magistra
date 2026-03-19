import { useState } from "react";
import { FileText, Filter, Plus, Search, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { contentItems, institutions } from "@/lib/edu-repository";
import { useInstitutionContext } from "@/features/institution";
import { ResourceCard, UploadResourceDialog } from "@/features/resources/components";
import { useResourcesData } from "@/features/resources/hooks";
import type { ResourceFilterType } from "@/features/resources/types";
import { contentTypeLabels } from "@/features/resources/utils";

export function ResourcesContent() {
   const { activeInstitution } = useInstitutionContext();
   const [search, setSearch] = useState("");
   const [filterType, setFilterType] = useState<ResourceFilterType>("all");
   const [uploadOpen, setUploadOpen] = useState(false);

   const { filtered } = useResourcesData({
      contentItems,
      activeInstitution,
      search,
      filterType,
   });

   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
         <div className="mb-6 flex items-center justify-between">
            <div>
               <p className="text-sm text-muted-foreground">Repositorio de archivos y recursos</p>
            </div>
            <Button size="sm" className="text-xs" onClick={() => setUploadOpen(true)}>
               <Plus className="mr-1.5 size-3.5" />
               Subir contenido
            </Button>
         </div>

         <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm min-w-[200px] flex-1">
               <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
               <Input
                  className="h-9 pl-8 text-xs"
                  placeholder="Buscar recurso..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-2">
               <Filter className="size-3.5 text-muted-foreground" />
               <Badge variant="secondary" className="h-8 rounded-md px-2.5">
                  {institutions.find((i) => i.id === activeInstitution)?.name}
               </Badge>
               <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value as ResourceFilterType)}
               >
                  <SelectTrigger className="h-8 w-auto text-xs">
                     <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todos los tipos</SelectItem>
                     {Object.entries(contentTypeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                           {v}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         {filtered.length === 0 ? (
            <Card>
               <CardContent className="p-12 text-center">
                  <FileText className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                  <p className="mb-1 text-sm font-medium text-foreground">No se encontraron contenidos</p>
                  <p className="mb-4 text-xs text-muted-foreground">Ajusta los filtros o sube un nuevo recurso</p>
                  <Button size="sm" className="text-xs" onClick={() => setUploadOpen(true)}>
                     <Upload className="mr-1.5 size-3.5" />
                     Subir contenido
                  </Button>
               </CardContent>
            </Card>
         ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
               {filtered.map((item) => (
                  <ResourceCard key={item.id} item={item} />
               ))}
            </div>
         )}

         <UploadResourceDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            activeInstitution={activeInstitution}
         />
      </div>
   );
}
