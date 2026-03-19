import { useState } from "react";
import { FileText, Search, Plus, Upload, Filter } from "lucide-react";
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
import { contentTypeLabels } from "@/features/resources/constants";
import { ContentCard } from "@/features/resources/content-card";
import { UploadContentDialog } from "@/features/resources/upload-content-dialog";

export function ResourcesContent() {
   const { activeInstitution } = useInstitutionContext();
   const [search, setSearch] = useState("");
   const [filterType, setFilterType] = useState("all");
   const [uploadOpen, setUploadOpen] = useState(false);

   const filtered = contentItems.filter((item) => {
      const matchesSearch =
         item.name.toLowerCase().includes(search.toLowerCase()) ||
         item.description.toLowerCase().includes(search.toLowerCase());
      const matchesInst = item.institutionId === activeInstitution;
      const matchesType = filterType === "all" || item.type === filterType;
      return matchesSearch && matchesInst && matchesType;
   });

   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
         <div className="flex items-center justify-between mb-6">
            <div>
               <p className="text-sm text-muted-foreground">
                  Repositorio de archivos y recursos
               </p>
            </div>
            <Button
               size="sm"
               className="text-xs"
               onClick={() => setUploadOpen(true)}
            >
               <Plus className="size-3.5 mr-1.5" />
               Subir contenido
            </Button>
         </div>

         <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
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
               <Select value={filterType} onValueChange={setFilterType}>
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
                  <FileText className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                     No se encontraron contenidos
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                     Ajusta los filtros o sube un nuevo recurso
                  </p>
                  <Button
                     size="sm"
                     className="text-xs"
                     onClick={() => setUploadOpen(true)}
                  >
                     <Upload className="size-3.5 mr-1.5" />
                     Subir contenido
                  </Button>
               </CardContent>
            </Card>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {filtered.map((item) => (
                  <ContentCard key={item.id} item={item} />
               ))}
            </div>
         )}

         <UploadContentDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            activeInstitution={activeInstitution}
         />
      </div>
   );
}





