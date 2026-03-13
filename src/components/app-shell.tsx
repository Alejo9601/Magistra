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
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { institutions } from "@/lib/edu-repository";
import { useInstitutionContext } from "@/features/institution";

function shortenInstitutionName(name: string, maxLength: number) {
   if (name.length <= maxLength) {
      return name;
   }
   return `${name.slice(0, maxLength - 1)}...`;
}

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
            <header className="sticky top-0 z-40 flex h-14 w-full max-w-full shrink-0 items-center overflow-hidden border-b border-border/80 bg-background/75 px-3 sm:px-4 backdrop-blur-md">
               <div className="flex min-w-0 flex-1 items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 !h-4" />
                  {title && (
                     <h1 className="hidden truncate text-sm font-semibold tracking-tight text-foreground sm:block">
                        {title}
                     </h1>
                  )}
               </div>
               <div className="ml-2 flex min-w-0 max-w-[60vw] items-center gap-2 sm:ml-auto sm:max-w-none sm:gap-3">
                  <Select
                     value={activeInstitution}
                     onValueChange={setActiveInstitution}
                  >
                     <SelectTrigger className="h-8 w-full max-w-[60vw] text-xs sm:w-auto sm:max-w-none">
                        <div className="flex items-center gap-2">
                           <Building2
                              className="size-3.5"
                              style={{ color: currentInst.color }}
                           />
                           <span className="truncate" title={currentInst.name}>
                              <span className="sm:hidden">
                                 {shortenInstitutionName(currentInst.name, 16)}
                              </span>
                              <span className="hidden sm:inline">
                                 {shortenInstitutionName(currentInst.name, 28)}
                              </span>
                           </span>
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


