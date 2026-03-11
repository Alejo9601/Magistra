import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import HomePage from "@/pages/page";
import PlanificacionPage from "@/pages/planificacion/page";
import GruposPage from "@/pages/grupos/page";
import SeguimientoPage from "@/pages/seguimiento/page";
import StudentProfilePage from "@/pages/seguimiento/[id]/page";
import ContenidosPage from "@/pages/contenidos/page";
import ConfiguracionPage from "@/pages/configuracion/page";
import ClaseDetailPage from "@/pages/clase/[id]/page";
import { InstitutionProvider } from "@/contexts/institution-context";
import { PlanningProvider } from "@/features/planning";
import { DashboardProvider } from "@/features/dashboard";
import { StudentsProvider } from "@/features/students";
import { ClassroomProvider } from "@/features/classroom";
import { AssessmentsProvider } from "@/contexts/assessments-context";
import { ActivitiesProvider } from "@/features/activities";
import "@/pages/globals.css";
import ClaseDictadoPage from "@/pages/clase/[id]/dictado/page";

function App() {
   return (
      <BrowserRouter>
         <InstitutionProvider>
            <StudentsProvider>
               <PlanningProvider>
                  <ClassroomProvider>
                     <ActivitiesProvider>
                        <AssessmentsProvider>
                           <DashboardProvider>
                              <Routes>
                                 <Route path="/" element={<HomePage />} />
                                 <Route
                                    path="/planificacion"
                                    element={<PlanificacionPage />}
                                 />
                                 <Route path="/grupos" element={<GruposPage />} />
                                 <Route
                                    path="/seguimiento"
                                    element={<SeguimientoPage />}
                                 />
                                 <Route
                                    path="/seguimiento/:id"
                                    element={<StudentProfilePage />}
                                 />
                                 <Route
                                    path="/contenidos"
                                    element={<ContenidosPage />}
                                 />
                                 <Route
                                    path="/configuracion"
                                    element={<ConfiguracionPage />}
                                 />
                                 <Route
                                    path="/clase/:id"
                                    element={<ClaseDetailPage />}
                                 />
                                 <Route
                                    path="/clase/:id/dictado"
                                    element={<ClaseDictadoPage />}
                                 />
                                 <Route path="*" element={<Navigate to="/" replace />} />
                              </Routes>
                           </DashboardProvider>
                        </AssessmentsProvider>
                     </ActivitiesProvider>
                  </ClassroomProvider>
               </PlanningProvider>
            </StudentsProvider>
         </InstitutionProvider>
         <Toaster position="bottom-right" richColors />
      </BrowserRouter>
   );
}

export default App;





