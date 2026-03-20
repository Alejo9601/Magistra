import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/features/settings/sections/profile-section";
import { InstitutionsSection } from "@/features/settings/sections/institutions-section";
import { SubjectsSection } from "@/features/settings/sections/subjects-section";
import { NotificationsSection } from "@/features/settings/sections/notifications-section";
import { OperativeThresholdsSection } from "@/features/settings/sections/operative-thresholds-section";
import { AppearanceSection } from "@/features/settings/sections/appearance-section";

export function ConfiguracionContent() {
   return (
      <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:p-6">
         <div className="mb-6">
            <p className="text-sm text-muted-foreground">
               Gestiona tu perfil, instituciones y preferencias
            </p>
         </div>

         <Tabs defaultValue="perfil">
            <div className="mb-4 overflow-x-auto pb-1">
               <TabsList className="w-max min-w-full">
               <TabsTrigger value="perfil" className="text-xs">
                  Mi perfil
               </TabsTrigger>
               <TabsTrigger value="instituciones" className="text-xs">
                  Instituciones
               </TabsTrigger>
               <TabsTrigger value="materias" className="text-xs">
                  Materias
               </TabsTrigger>
               <TabsTrigger value="notificaciones" className="text-xs">
                  Notificaciones
               </TabsTrigger>
               <TabsTrigger value="apariencia" className="text-xs">
                  Apariencia
               </TabsTrigger>
               <TabsTrigger value="operativo" className="text-xs">
                  Operativo
               </TabsTrigger>
               </TabsList>
            </div>

            <TabsContent value="perfil">
               <ProfileSection />
            </TabsContent>
            <TabsContent value="instituciones">
               <InstitutionsSection />
            </TabsContent>
            <TabsContent value="materias">
               <SubjectsSection />
            </TabsContent>
            <TabsContent value="notificaciones">
               <NotificationsSection />
            </TabsContent>
            <TabsContent value="apariencia">
               <AppearanceSection />
            </TabsContent>
            <TabsContent value="operativo">
               <OperativeThresholdsSection />
            </TabsContent>
         </Tabs>
      </div>
   );
}



