import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import HomePage from "@/pages/page";
import PlanificacionPage from "@/pages/planificacion/page";
import GruposPage from "@/pages/grupos/page";
import SeguimientoPage from "@/pages/seguimiento/page";
import StudentProfilePage from "@/pages/seguimiento/[id]/page";
import RecursosPage from "@/pages/recursos/page";
import ConfiguracionPage from "@/pages/configuracion/page";
import ClassDetailPage from "@/pages/clase/[id]/page";
import { InstitutionProvider } from "@/features/institution";
import { PlanningProvider } from "@/features/planning";
import { DashboardProvider } from "@/features/dashboard";
import { StudentsProvider } from "@/features/students";
import { ClassroomProvider } from "@/features/classroom";
import { AssessmentsProvider } from "@/features/assessments";
import { ActivitiesProvider } from "@/features/activities";
import { TeacherProvider } from "@/features/teacher";
import "@/pages/globals.css";
import ClassTeachingPage from "@/pages/clase/[id]/dictado/page";
import ActivityGradingPage from "@/pages/actividad/[id]/calificar/page";
import { TeachingRouteGuard } from "@/features/classroom/components/teaching-route-guard";

function App() {
   return (
      <BrowserRouter>
         <TeacherProvider>
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
                                       path="/recursos"
                                       element={<RecursosPage />}
                                    />
                                    <Route
                                       path="/configuracion"
                                       element={<ConfiguracionPage />}
                                    />
                                    <Route
                                       path="/clase/:id"
                                       element={<ClassDetailPage />}
                                    />
                                    <Route
                                       path="/clase/:id/dictado"
                                       element={
                                          <TeachingRouteGuard>
                                             <ClassTeachingPage />
                                          </TeachingRouteGuard>
                                       }
                                    />
                                    <Route
                                       path="/actividad/:id/calificar"
                                       element={<ActivityGradingPage />}
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
         </TeacherProvider>
         <Toaster position="bottom-right" richColors />
      </BrowserRouter>
   );
}

export default App;








