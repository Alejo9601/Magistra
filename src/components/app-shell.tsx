import {
   SidebarProvider,
   SidebarInset,
   SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { institutions } from "@/lib/edu-repository";
import { useInstitutionContext } from "@/contexts/institution-context";

export function AppShell({
   children,
   title,
}: {
   children: React.ReactNode;
   title?: string;
}) {
   const { activeInstitution, setActiveInstitution } = useInstitutionContext();
   const currentInst =
      institutions.find((i) => i.id === activeInstitution) || institutions[0];

   return (
      <SidebarProvider>
         <AppSidebar />
         <SidebarInset>
            <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-border/80 bg-background/75 px-4 backdrop-blur-md">
               <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 !h-4" />
                  {title && (
                     <h1 className="text-sm font-semibold tracking-tight text-foreground">
                        {title}
                     </h1>
                  )}
               </div>
               <div className="ml-auto flex items-center gap-3">
                  <Select
                     value={activeInstitution}
                     onValueChange={setActiveInstitution}
                  >
                     <SelectTrigger className="h-8 w-auto text-xs">
                        <div className="flex items-center gap-2">
                           <Building2
                              className="size-3.5"
                              style={{ color: currentInst.color }}
                           />
                           <SelectValue />
                        </div>
                     </SelectTrigger>
                     <SelectContent>
                        {institutions.map((inst) => (
                           <SelectItem key={inst.id} value={inst.id}>
                              <span className="text-xs">{inst.name}</span>
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            </header>
            <div className="relative flex-1 overflow-y-auto overflow-x-hidden page-enter">
               <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
               <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-warning/10 blur-3xl" />
               {children}
            </div>
         </SidebarInset>
      </SidebarProvider>
   );
}

