import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/features/settings/sections/profile-section";
import { InstitutionsSection } from "@/features/settings/sections/institutions-section";
import { SubjectsSection } from "@/features/settings/sections/subjects-section";
import { PeriodsSection } from "@/features/settings/sections/periods-section";
import { NotificationsSection } from "@/features/settings/sections/notifications-section";

export function ConfiguracionContent() {
   return (
      <div className="p-6 max-w-4xl mx-auto">
         <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">Configuracion</h1>
            <p className="text-sm text-muted-foreground">
               Gestiona tu perfil, instituciones y preferencias
            </p>
         </div>

         <Tabs defaultValue="perfil">
            <TabsList className="mb-4">
               <TabsTrigger value="perfil" className="text-xs">
                  Mi perfil
               </TabsTrigger>
               <TabsTrigger value="instituciones" className="text-xs">
                  Instituciones
               </TabsTrigger>
               <TabsTrigger value="materias" className="text-xs">
                  Materias
               </TabsTrigger>
               <TabsTrigger value="periodos" className="text-xs">
                  Periodos
               </TabsTrigger>
               <TabsTrigger value="notificaciones" className="text-xs">
                  Notificaciones
               </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil">
               <ProfileSection />
            </TabsContent>
            <TabsContent value="instituciones">
               <InstitutionsSection />
            </TabsContent>
            <TabsContent value="materias">
               <SubjectsSection />
            </TabsContent>
            <TabsContent value="periodos">
               <PeriodsSection />
            </TabsContent>
            <TabsContent value="notificaciones">
               <NotificationsSection />
            </TabsContent>
         </Tabs>
      </div>
   );
}

